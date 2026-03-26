"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBlogCover = exports.publishBlog = exports.saveBlogDraft = exports.deleteBlog = exports.getBlogBySlug = exports.getPublicBlogs = exports.getBlogs = exports.updateBlog = exports.createBlog = void 0;
const client_1 = require("@prisma/client");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const prisma = new client_1.PrismaClient();
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.UPLOAD_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.UPLOAD_SECRET_ACCESS_KEY || "",
    },
});
const sendErrorResponse = (res, status, message, details) => {
    res.status(status).json({ message, details });
};
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only JPEG, PNG, or WebP images are allowed"));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
const createBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const schema = zod_1.z.object({
            title: zod_1.z.string().min(1, "Title is required"),
            content: zod_1.z.string().min(1, "Content is required"),
            tags: zod_1.z.string().optional().transform((val) => (val ? val.split(",").map((tag) => tag.trim()) : [])),
            published: zod_1.z.string().transform((val) => val === "true"),
            videoUrl: zod_1.z.string().url().optional(),
            authorId: zod_1.z.string().transform((val) => parseInt(val)).optional(),
        });
        const { title, content, tags, published, videoUrl, authorId } = schema.parse(req.body);
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            sendErrorResponse(res, 401, "Unauthorized: Admin not authenticated");
            return;
        }
        if (authorId) {
            const author = yield prisma.author.findUnique({ where: { id: authorId } });
            if (!author) {
                sendErrorResponse(res, 400, "Invalid author ID");
                return;
            }
        }
        let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        let increment = 1;
        while (yield prisma.blog.findUnique({ where: { slug } })) {
            slug = `${slug}-${increment++}`;
        }
        let coverImage;
        if (req.file) {
            const key = `blog-covers/${(0, uuid_1.v4)()}-${req.file.originalname}`;
            const command = new client_s3_1.PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET || "",
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            });
            yield s3Client.send(command);
            coverImage = key;
        }
        const blog = yield prisma.blog.create({
            data: {
                title,
                slug,
                content: (0, sanitize_html_1.default)(content, {
                    allowedTags: ['p', 'b', 'i', 'em', 'strong', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'img'],
                    allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
                }),
                coverImage,
                videoUrl,
                published: published !== null && published !== void 0 ? published : false,
                tags,
                adminCognitoId,
                authorId,
            },
            include: { author: true },
        });
        res.status(201).json(blog);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            sendErrorResponse(res, 400, "Invalid input", error.issues);
            return;
        }
        sendErrorResponse(res, 500, "Error creating blog", { error: error.message });
    }
});
exports.createBlog = createBlog;
const updateBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const schema = zod_1.z.object({
            title: zod_1.z.string().min(1).optional(),
            content: zod_1.z.string().min(1).optional(),
            tags: zod_1.z.string().optional().transform((val) => (val ? JSON.parse(val) : [])),
            published: zod_1.z.string().optional().transform((val) => val === "true"),
            videoUrl: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
            coverImage: zod_1.z.string().optional().nullable(),
            authorId: zod_1.z.string().transform((val) => parseInt(val)).optional(),
        });
        const { title, content, tags, published, videoUrl, authorId } = schema.parse(req.body);
        const { id } = req.params;
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            sendErrorResponse(res, 401, "Unauthorized: Admin not authenticated");
            return;
        }
        const blog = yield prisma.blog.findUnique({ where: { id: parseInt(id) } });
        if (!blog || blog.adminCognitoId !== adminCognitoId) {
            sendErrorResponse(res, 404, "Blog not found or unauthorized");
            return;
        }
        if (authorId) {
            const author = yield prisma.author.findUnique({ where: { id: authorId } });
            if (!author) {
                sendErrorResponse(res, 400, "Invalid author ID");
                return;
            }
        }
        let coverImage = blog.coverImage;
        if (req.file) {
            if (blog.coverImage) {
                yield s3Client.send(new client_s3_1.DeleteObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: blog.coverImage,
                }));
            }
            const key = `blog-covers/${(0, uuid_1.v4)()}-${req.file.originalname}`;
            const command = new client_s3_1.PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET || "",
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            });
            yield s3Client.send(command);
            coverImage = key;
        }
        else if (req.body.coverImage === "null") {
            if (blog.coverImage) {
                yield s3Client.send(new client_s3_1.DeleteObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: blog.coverImage,
                }));
            }
            coverImage = null;
        }
        let slug = blog.slug;
        if (title && title !== blog.title) {
            slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            let increment = 1;
            while (yield prisma.blog.findUnique({ where: { slug } })) {
                slug = `${slug}-${increment++}`;
            }
        }
        const updateData = { coverImage, slug, authorId };
        if (title)
            updateData.title = title;
        if (content)
            updateData.content = (0, sanitize_html_1.default)(content, {
                allowedTags: ['p', 'b', 'i', 'em', 'strong', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'img'],
                allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
            });
        if (tags)
            updateData.tags = tags;
        if (published !== undefined)
            updateData.published = published;
        if (videoUrl !== undefined)
            updateData.videoUrl = videoUrl;
        const updatedBlog = yield prisma.blog.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: { author: true },
        });
        res.status(200).json(updatedBlog);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            sendErrorResponse(res, 400, "Invalid input", error.issues);
            return;
        }
        sendErrorResponse(res, 500, "Error updating blog", { error: error.message });
    }
});
exports.updateBlog = updateBlog;
const getBlogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            sendErrorResponse(res, 401, "Unauthorized: Admin not authenticated");
            return;
        }
        const { page = 1, limit = 10, search, published } = req.query;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const whereClause = { adminCognitoId };
        if (search && typeof search === "string") {
            whereClause.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
            ];
        }
        if (published !== undefined) {
            whereClause.published = published === "true";
        }
        const [blogs, total] = yield Promise.all([
            prisma.blog.findMany({
                where: whereClause,
                include: { author: true },
                orderBy: { createdAt: "desc" },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
            }),
            prisma.blog.count({ where: whereClause }),
        ]);
        const blogsWithSignedUrls = yield Promise.all(blogs.map((blog) => __awaiter(void 0, void 0, void 0, function* () {
            if (blog.coverImage) {
                const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: blog.coverImage,
                }), { expiresIn: 7 * 24 * 60 * 60 });
                return Object.assign(Object.assign({}, blog), { coverImageSignedUrl: signedUrl });
            }
            return blog;
        })));
        res.status(200).json({
            data: blogsWithSignedUrls,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            total,
        });
    }
    catch (error) {
        sendErrorResponse(res, 500, "Error fetching blogs", { error: error.message });
    }
});
exports.getBlogs = getBlogs;
const getPublicBlogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = "1", limit = "10", search, tag, authorId } = req.query;
        const pageNum = zod_1.z.number().min(1).parse(Number(page));
        const limitNum = zod_1.z.number().min(1).parse(Number(limit));
        const authorIdNum = authorId ? zod_1.z.number().parse(Number(authorId)) : undefined;
        const whereClause = { published: true };
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
        const [blogs, total] = yield Promise.all([
            prisma.blog.findMany({
                where: whereClause,
                include: { author: true },
                orderBy: { createdAt: "desc" },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
            }),
            prisma.blog.count({ where: whereClause }),
        ]);
        const blogsWithSignedUrls = yield Promise.all(blogs.map((blog) => __awaiter(void 0, void 0, void 0, function* () {
            if (blog.coverImage) {
                const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: blog.coverImage,
                }), { expiresIn: 7 * 24 * 60 * 60 });
                return Object.assign(Object.assign({}, blog), { coverImageSignedUrl: signedUrl });
            }
            return blog;
        })));
        res.status(200).json({
            data: blogsWithSignedUrls,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            total,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            sendErrorResponse(res, 400, "Invalid input", error.issues);
            return;
        }
        sendErrorResponse(res, 500, "Error fetching public blogs", { error: error.message });
    }
});
exports.getPublicBlogs = getPublicBlogs;
const getBlogBySlug = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { slug } = req.params;
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const blog = yield prisma.blog.findUnique({
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
        let coverImageSignedUrl;
        if (blog.coverImage) {
            coverImageSignedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: blog.coverImage,
            }), { expiresIn: 7 * 24 * 60 * 60 });
        }
        res.status(200).json(Object.assign(Object.assign({}, blog), { coverImageSignedUrl }));
    }
    catch (error) {
        sendErrorResponse(res, 500, "Error fetching blog", { error: error.message });
    }
});
exports.getBlogBySlug = getBlogBySlug;
const deleteBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            sendErrorResponse(res, 401, "Unauthorized: Admin not authenticated");
            return;
        }
        const blog = yield prisma.blog.findUnique({
            where: { id: parseInt(id) },
        });
        if (!blog || blog.adminCognitoId !== adminCognitoId) {
            sendErrorResponse(res, 404, "Blog not found or unauthorized");
            return;
        }
        if (blog.coverImage) {
            yield s3Client.send(new client_s3_1.DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: blog.coverImage,
            }));
        }
        yield prisma.blog.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({ message: "Blog deleted successfully" });
    }
    catch (error) {
        sendErrorResponse(res, 500, "Error deleting blog", { error: error.message });
    }
});
exports.deleteBlog = deleteBlog;
const saveBlogDraft = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            sendErrorResponse(res, 401, "Unauthorized");
            return;
        }
        const schema = zod_1.z.object({
            title: zod_1.z.string().optional(),
            slug: zod_1.z.string().optional(),
            content: zod_1.z.string().optional().transform((val) => (val ? (0, sanitize_html_1.default)(val, {
                allowedTags: ['p', 'b', 'i', 'em', 'strong', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'img'],
                allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
            }) : val)),
            excerpt: zod_1.z.string().optional(),
            tags: zod_1.z.string().optional().transform((val) => (val ? val.split(',').map((tag) => tag.trim()).filter((tag) => tag) : [])),
            published: zod_1.z.string().optional().transform((val) => (val ? val === 'true' : undefined)),
            videoUrl: zod_1.z.string().optional(),
            authorId: zod_1.z.string().transform((val) => parseInt(val)).optional(),
        });
        const data = schema.parse(req.body);
        if (data.authorId) {
            const author = yield prisma.author.findUnique({ where: { id: data.authorId } });
            if (!author) {
                sendErrorResponse(res, 400, "Invalid author ID");
                return;
            }
        }
        const draftData = {
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
            const blog = yield prisma.blog.findUnique({ where: { id: parseInt(id) } });
            if (!blog || blog.adminCognitoId !== adminCognitoId) {
                sendErrorResponse(res, 404, "Blog not found or unauthorized");
                return;
            }
            const updatedDraft = yield prisma.blog.update({
                where: { id: parseInt(id) },
                data: draftData,
                include: { author: true },
            });
            res.status(200).json(updatedDraft);
        }
        else {
            const newDraft = yield prisma.blog.create({
                data: Object.assign(Object.assign({}, draftData), { published: false }),
                include: { author: true },
            });
            res.status(201).json(newDraft);
        }
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            sendErrorResponse(res, 400, "Invalid input", error.issues);
            return;
        }
        sendErrorResponse(res, 500, "Error saving draft", { error: error.message });
    }
});
exports.saveBlogDraft = saveBlogDraft;
const publishBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { published } = zod_1.z.object({ published: zod_1.z.boolean() }).parse(req.body);
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            sendErrorResponse(res, 401, "Unauthorized");
            return;
        }
        const blog = yield prisma.blog.findUnique({ where: { id: parseInt(id) } });
        if (!blog || blog.adminCognitoId !== adminCognitoId) {
            sendErrorResponse(res, 404, "Blog not found or unauthorized");
            return;
        }
        const updatedBlog = yield prisma.blog.update({
            where: { id: parseInt(id) },
            data: { published },
            include: { author: true },
        });
        res.status(200).json(updatedBlog);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            sendErrorResponse(res, 400, "Invalid input", error.issues);
            return;
        }
        sendErrorResponse(res, 500, "Error publishing blog", { error: error.message });
    }
});
exports.publishBlog = publishBlog;
exports.uploadBlogCover = upload.single("coverImage");
