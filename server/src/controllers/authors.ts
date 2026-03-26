import { Request, RequestHandler, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z, ZodError } from "zod";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

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

export const getAuthors: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const authors = await prisma.author.findMany({
            select: { id: true, name: true, email: true, bio: true, profilePicture: true },
        });

        const authorsWithSignedUrls = await Promise.all(
            authors.map(async (author) => {
                if (author.profilePicture) {
                    const signedUrl = await getSignedUrl(
                        s3Client,
                        new GetObjectCommand({
                            Bucket: process.env.AWS_S3_BUCKET,
                            Key: author.profilePicture,
                        }),
                        { expiresIn: 7 * 24 * 60 * 60 } // 7 days
                    );
                    return { ...author, profilePictureSignedUrl: signedUrl };
                }
                return author;
            })
        );

        res.status(200).json(authorsWithSignedUrls);
    } catch (error: any) {
        sendErrorResponse(res, 500, "Error fetching authors", { error: error.message });
    }
};

export const getAuthorById: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const authorId = z.number().parse(Number(id));

        const author = await prisma.author.findUnique({
            where: { id: authorId },
            include: { blogs: { where: { published: true }, orderBy: { createdAt: "desc" } } },
        });

        if (!author) {
            sendErrorResponse(res, 404, "Author not found");
            return;
        }

        let profilePictureSignedUrl: string | undefined;
        if (author.profilePicture) {
            profilePictureSignedUrl = await getSignedUrl(
                s3Client,
                new GetObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: author.profilePicture,
                }),
                { expiresIn: 7 * 24 * 60 * 60 } // 7 days
            );
        }

        const blogsWithSignedUrls = await Promise.all(
            author.blogs.map(async (blog) => {
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

        res.status(200).json({ ...author, profilePictureSignedUrl, blogs: blogsWithSignedUrls });
    } catch (error: any) {
        if (error instanceof ZodError) {
            sendErrorResponse(res, 400, "Invalid author ID", error.issues);
            return;
        }
        sendErrorResponse(res, 500, "Error fetching author", { error: error.message });
    }
};

export const createAuthor: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const schema = z.object({
            name: z.string().min(1, "Name is required"),
            email: z.string().email("Invalid email address"),
            bio: z.string().optional(),
        });

        const { name, email, bio } = schema.parse(req.body);

        const adminCognitoId = req.user?.id;
        if (!adminCognitoId) {
            sendErrorResponse(res, 401, "Unauthorized: Admin not authenticated");
            return;
        }

        const existingAuthor = await prisma.author.findUnique({ where: { email } });
        if (existingAuthor) {
            sendErrorResponse(res, 400, "Author with this email already exists");
            return;
        }

        let profilePicture: string | undefined;
        if (req.file) {
            const key = `author-profiles/${uuidv4()}-${req.file.originalname}`;
            const command = new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET || "",
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            });
            await s3Client.send(command);
            profilePicture = key;
        }

        const author = await prisma.author.create({
            data: { name, email, bio, profilePicture },
        });

        res.status(201).json(author);
    } catch (error: any) {
        console.error("createAuthor: Error occurred", {
            error: error.message,
            stack: error.stack,
            details: error instanceof ZodError ? error.issues : error,
        });
        if (error instanceof ZodError) {
            sendErrorResponse(res, 400, "Invalid input", error.issues);
            return;
        }
        sendErrorResponse(res, 500, "Error creating author", { error: error.message });
    }
};

export const uploadAuthorProfile = upload.single("profilePicture");