import { Request, RequestHandler, Response } from "express";
import { PrismaClient, Blog } from "@prisma/client";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { z, ZodError } from "zod";
import multer from "multer";
import sanitizeHtml from "sanitize-html";

const prisma = new PrismaClient();

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.UPLOAD_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.UPLOAD_SECRET_ACCESS_KEY || "",
    },
});

const sendErrorResponse = (res: Response, status: number, message: string, details?: any) => {
    res.status(status).json({ message, details });
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, or WebP images are allowed"));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export const createBlog: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const schema = z.object({
            title: z.string().min(1, "Title is required"),
            content: z.string().min(1, "Content is required"),
            tags: z.string().optional().transform((val) => (val ? val.split(",").map((tag) => tag.trim()) : [])),
            published: z.string().transform((val) => val === "true"),
            videoUrl: z.string().url().optional(),
            authorId: z.string().transform((val) => parseInt(val)).optional(),
        });

        const { title, content, tags, published, videoUrl, authorId } = schema.parse(req.body);

        const adminCognitoId = req.user?.id;
        if (!adminCognitoId) {
            sendErrorResponse(res, 401, "Unauthorized: Admin not authenticated");
            return;
        }

        if (authorId) {
            const author = await prisma.author.findUnique({ where: { id: authorId } });
            if (!author) {
                sendErrorResponse(res, 400, "Invalid author ID");
                return;
            }
        }

        let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        let increment = 1;
        while (await prisma.blog.findUnique({ where: { slug } })) {
            slug = `${slug}-${increment++}`;
        }

        let coverImage: string | undefined;
        if (req.file) {
            const key = `blog-covers/${uuidv4()}-${req.file.originalname}`;
            const command = new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET || "",
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            });
            await s3Client.send(command);
            coverImage = key;
        }

        const blog = await prisma.blog.create({
            data: {
                title,
                slug,
                content: sanitizeHtml(content, {
                    allowedTags: ['p', 'b', 'i', 'em', 'strong', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'img'],
                    allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
                }),
                coverImage,
                videoUrl,
                published: published ?? false,
                tags,
                adminCognitoId,
                authorId,
            },
            include: { author: true },
        });

        res.status(201).json(blog);
    } catch (error: any) {
        if (error instanceof ZodError) {
            sendErrorResponse(res, 400, "Invalid input", error.issues);
            return;
        }
        sendErrorResponse(res, 500, "Error creating blog", { error: error.message });
    }
};

export const updateBlog: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const schema = z.object({
            title: z.string().min(1).optional(),
            content: z.string().min(1).optional(),
            tags: z.string().optional().transform((val) => (val ? JSON.parse(val) : [])),
            published: z.string().optional().transform((val) => val === "true"),
            videoUrl: z.string().url().optional().or(z.literal("")),
            coverImage: z.string().optional().nullable(),
            authorId: z.string().transform((val) => parseInt(val)).optional(),
        });

        const { title, content, tags, published, videoUrl, authorId } = schema.parse(req.body);

        const { id } = req.params;
        const adminCognitoId = req.user?.id;
        if (!adminCognitoId) {
            sendErrorResponse(res, 401, "Unauthorized: Admin not authenticated");
            return;
        }

        const blog = await prisma.blog.findUnique({ where: { id: parseInt(id) } });
        if (!blog || blog.adminCognitoId !== adminCognitoId) {
            sendErrorResponse(res, 404, "Blog not found or unauthorized");
            return;
        }

        if (authorId) {
            const author = await prisma.author.findUnique({ where: { id: authorId } });
            if (!author) {
                sendErrorResponse(res, 400, "Invalid author ID");
                return;
            }
        }

        let coverImage = blog.coverImage;
        if (req.file) {
            if (blog.coverImage) {
                await s3Client.send(
                    new DeleteObjectCommand({
                        Bucket: process.env.AWS_S3_BUCKET,
                        Key: blog.coverImage,
                    })
                );
            }
            const key = `blog-covers/${uuidv4()}-${req.file.originalname}`;
            const command = new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET || "",
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            });
            await s3Client.send(command);
            coverImage = key;
        } else if (req.body.coverImage === "null") {
            if (blog.coverImage) {
                await s3Client.send(
                    new DeleteObjectCommand({
                        Bucket: process.env.AWS_S3_BUCKET,
                        Key: blog.coverImage,
                    })
                );
            }
            coverImage = null;
        }

        let slug = blog.slug;
        if (title && title !== blog.title) {
            slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            let increment = 1;
            while (await prisma.blog.findUnique({ where: { slug } })) {
                slug = `${slug}-${increment++}`;
            }
        }

        const updateData: Partial<Blog> = { coverImage, slug, authorId };
        if (title) updateData.title = title;
        if (content) updateData.content = sanitizeHtml(content, {
            allowedTags: ['p', 'b', 'i', 'em', 'strong', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'img'],
            allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
        });
        if (tags) updateData.tags = tags;
        if (published !== undefined) updateData.published = published;
        if (videoUrl !== undefined) updateData.videoUrl = videoUrl;

        const updatedBlog = await prisma.blog.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: { author: true },
        });

        res.status(200).json(updatedBlog);
    } catch (error: any) {
        if (error instanceof ZodError) {
            sendErrorResponse(res, 400, "Invalid input", error.issues);
            return;
        }
        sendErrorResponse(res, 500, "Error updating blog", { error: error.message });
    }
};

export const getBlogs: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminCognitoId = req.user?.id;
        if (!adminCognitoId) {
            sendErrorResponse(res, 401, "Unauthorized: Admin not authenticated");
            return;
        }

        const { page = 1, limit = 10, search, published } = req.query;
        const pageNum = Number(page);
        const limitNum = Number(limit);

        const whereClause: any = { adminCognitoId };
        if (search && typeof search === "string") {
            whereClause.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
            ];
        }
        if (published !== undefined) {
            whereClause.published = published === "true";
        }

        const [blogs, total] = await Promise.all([
            prisma.blog.findMany({
                where: whereClause,
                include: { author: true },
                orderBy: { createdAt: "desc" },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
            }),
            prisma.blog.count({ where: whereClause }),
        ]);

        const blogsWithSignedUrls = await Promise.all(blogs.map(async (blog) => {
            if (blog.coverImage) {
                const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: blog.coverImage,
                }), { expiresIn: 7 * 24 * 60 * 60 });
                return { ...blog, coverImageSignedUrl: signedUrl };
            }
            return blog;
        }));

        res.status(200).json({
            data: blogsWithSignedUrls,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            total,
        });
    } catch (error: any) {
        sendErrorResponse(res, 500, "Error fetching blogs", { error: error.message });
    }
};

export const getPublicBlogs: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page = "1", limit = "10", search, tag, authorId } = req.query;
        const pageNum = z.number().min(1).parse(Number(page));
        const limitNum = z.number().min(1).parse(Number(limit));
        const authorIdNum = authorId ? z.number().parse(Number(authorId)) : undefined;

        const whereClause: any = { published: true };
        if (search && typeof search === "string") {
            whereClause.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
            ];
        }
        if (tag && typeof tag === "string") {
            whereClause.tags = { has: tag };
        }
        if (authorIdNum) {
            whereClause.authorId = authorIdNum;
        }

        const [blogs, total] = await Promise.all([
            prisma.blog.findMany({
                where: whereClause,
                include: { author: true },
                orderBy: { createdAt: "desc" },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
            }),
            prisma.blog.count({ where: whereClause }),
        ]);

        const blogsWithSignedUrls = await Promise.all(
            blogs.map(async (blog) => {
                if (blog.coverImage) {
                    const signedUrl = await getSignedUrl(
                        s3Client,
                        new GetObjectCommand({
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: blog.coverImage,
                        }),
                        { expiresIn: 7 * 24 * 60 * 60 }
                    );
                    return { ...blog, coverImageSignedUrl: signedUrl };
                }
                return blog;
            })
        );

        res.status(200).json({
            data: blogsWithSignedUrls,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            total,
        });
    } catch (error: any) {
        if (error instanceof ZodError) {
            sendErrorResponse(res, 400, "Invalid input", error.issues);
            return;
        }
        sendErrorResponse(res, 500, "Error fetching public blogs", { error: error.message });
    }
};

export const getBlogBySlug: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        const adminCognitoId = req.user?.id;

        const blog = await prisma.blog.findUnique({
            where: { slug },
            include: { author: true },
        });

        if (!blog) {
            sendErrorResponse(res, 404, "Blog not found");
            return;
        }

        if (!blog.published && (!adminCognitoId || blog.adminCognitoId !== adminCognitoId)) {
            sendErrorResponse(res, 403, "Unauthorized: Blog is not published");
            return;
        }

        let coverImageSignedUrl: string | undefined;
        if (blog.coverImage) {
            coverImageSignedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: blog.coverImage,
            }), { expiresIn: 7 * 24 * 60 * 60 });
        }

        res.status(200).json({ ...blog, coverImageSignedUrl });
    } catch (error: any) {
        sendErrorResponse(res, 500, "Error fetching blog", { error: error.message });
    }
};

export const deleteBlog: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminCognitoId = req.user?.id;

        if (!adminCognitoId) {
            sendErrorResponse(res, 401, "Unauthorized: Admin not authenticated");
            return;
        }

        const blog = await prisma.blog.findUnique({
            where: { id: parseInt(id) },
        });

        if (!blog || blog.adminCognitoId !== adminCognitoId) {
            sendErrorResponse(res, 404, "Blog not found or unauthorized");
            return;
        }

        if (blog.coverImage) {
            await s3Client.send(
                new DeleteObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: blog.coverImage,
                })
            );
        }

        await prisma.blog.delete({
            where: { id: parseInt(id) },
        });

        res.status(200).json({ message: "Blog deleted successfully" });
    } catch (error: any) {
        sendErrorResponse(res, 500, "Error deleting blog", { error: error.message });
    }
};

export const saveBlogDraft: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminCognitoId = req.user?.id;
        if (!adminCognitoId) {
            sendErrorResponse(res, 401, "Unauthorized");
            return;
        }

        const schema = z.object({
            title: z.string().optional(),
            slug: z.string().optional(),
            content: z.string().optional().transform((val) => (val ? sanitizeHtml(val, {
                allowedTags: ['p', 'b', 'i', 'em', 'strong', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'img'],
                allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
            }) : val)),
            excerpt: z.string().optional(),
            tags: z.string().optional().transform((val) => (val ? val.split(',').map((tag) => tag.trim()).filter((tag) => tag) : [])),
            published: z.string().optional().transform((val) => (val ? val === 'true' : undefined)),
            videoUrl: z.string().optional(),
            authorId: z.string().transform((val) => parseInt(val)).optional(),
        });

        const data = schema.parse(req.body);

        if (data.authorId) {
            const author = await prisma.author.findUnique({ where: { id: data.authorId } });
            if (!author) {
                sendErrorResponse(res, 400, "Invalid author ID");
                return;
            }
        }

        const draftData: any = {
            adminCognitoId,
            title: data.title,
            slug: data.slug,
            content: data.content,
            excerpt: data.excerpt,
            tags: data.tags,
            published: data.published,
            videoUrl: data.videoUrl,
            authorId: data.authorId,
        };

        if (id) {
            const blog = await prisma.blog.findUnique({ where: { id: parseInt(id) } });
            if (!blog || blog.adminCognitoId !== adminCognitoId) {
                sendErrorResponse(res, 404, "Blog not found or unauthorized");
                return;
            }
            const updatedDraft = await prisma.blog.update({
                where: { id: parseInt(id) },
                data: draftData,
                include: { author: true },
            });
            res.status(200).json(updatedDraft);
        } else {
            const newDraft = await prisma.blog.create({
                data: { ...draftData, published: false },
                include: { author: true },
            });
            res.status(201).json(newDraft);
        }
    } catch (error: any) {
        if (error instanceof ZodError) {
            sendErrorResponse(res, 400, "Invalid input", error.issues);
            return;
        }
        sendErrorResponse(res, 500, "Error saving draft", { error: error.message });
    }
};

export const publishBlog: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { published } = z.object({ published: z.boolean() }).parse(req.body);
        const adminCognitoId = req.user?.id;
        if (!adminCognitoId) {
            sendErrorResponse(res, 401, "Unauthorized");
            return;
        }

        const blog = await prisma.blog.findUnique({ where: { id: parseInt(id) } });
        if (!blog || blog.adminCognitoId !== adminCognitoId) {
            sendErrorResponse(res, 404, "Blog not found or unauthorized");
            return;
        }

        const updatedBlog = await prisma.blog.update({
            where: { id: parseInt(id) },
            data: { published },
            include: { author: true },
        });
        res.status(200).json(updatedBlog);
    } catch (error: any) {
        if (error instanceof ZodError) {
            sendErrorResponse(res, 400, "Invalid input", error.issues);
            return;
        }
        sendErrorResponse(res, 500, "Error publishing blog", { error: error.message });
    }
};

export const uploadBlogCover = upload.single("coverImage");

