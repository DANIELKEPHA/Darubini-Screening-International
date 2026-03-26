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
exports.uploadAuthorProfile = exports.createAuthor = exports.getAuthorById = exports.getAuthors = void 0;
const client_1 = require("@prisma/client");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
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
const getAuthors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authors = yield prisma.author.findMany({
            select: { id: true, name: true, email: true, bio: true, profilePicture: true },
        });
        const authorsWithSignedUrls = yield Promise.all(authors.map((author) => __awaiter(void 0, void 0, void 0, function* () {
            if (author.profilePicture) {
                const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: author.profilePicture,
                }), { expiresIn: 7 * 24 * 60 * 60 } // 7 days
                );
                return Object.assign(Object.assign({}, author), { profilePictureSignedUrl: signedUrl });
            }
            return author;
        })));
        res.status(200).json(authorsWithSignedUrls);
    }
    catch (error) {
        sendErrorResponse(res, 500, "Error fetching authors", { error: error.message });
    }
});
exports.getAuthors = getAuthors;
const getAuthorById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const authorId = zod_1.z.number().parse(Number(id));
        const author = yield prisma.author.findUnique({
            where: { id: authorId },
            include: { blogs: { where: { published: true }, orderBy: { createdAt: "desc" } } },
        });
        if (!author) {
            sendErrorResponse(res, 404, "Author not found");
            return;
        }
        let profilePictureSignedUrl;
        if (author.profilePicture) {
            profilePictureSignedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: author.profilePicture,
            }), { expiresIn: 7 * 24 * 60 * 60 } // 7 days
            );
        }
        const blogsWithSignedUrls = yield Promise.all(author.blogs.map((blog) => __awaiter(void 0, void 0, void 0, function* () {
            if (blog.coverImage) {
                const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: blog.coverImage,
                }), { expiresIn: 7 * 24 * 60 * 60 });
                return Object.assign(Object.assign({}, blog), { coverImageSignedUrl: signedUrl });
            }
            return blog;
        })));
        res.status(200).json(Object.assign(Object.assign({}, author), { profilePictureSignedUrl, blogs: blogsWithSignedUrls }));
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            sendErrorResponse(res, 400, "Invalid author ID", error.issues);
            return;
        }
        sendErrorResponse(res, 500, "Error fetching author", { error: error.message });
    }
});
exports.getAuthorById = getAuthorById;
const createAuthor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(1, "Name is required"),
            email: zod_1.z.string().email("Invalid email address"),
            bio: zod_1.z.string().optional(),
        });
        const { name, email, bio } = schema.parse(req.body);
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            sendErrorResponse(res, 401, "Unauthorized: Admin not authenticated");
            return;
        }
        const existingAuthor = yield prisma.author.findUnique({ where: { email } });
        if (existingAuthor) {
            sendErrorResponse(res, 400, "Author with this email already exists");
            return;
        }
        let profilePicture;
        if (req.file) {
            const key = `author-profiles/${(0, uuid_1.v4)()}-${req.file.originalname}`;
            const command = new client_s3_1.PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET || "",
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            });
            yield s3Client.send(command);
            profilePicture = key;
        }
        const author = yield prisma.author.create({
            data: { name, email, bio, profilePicture },
        });
        res.status(201).json(author);
    }
    catch (error) {
        console.error("createAuthor: Error occurred", {
            error: error.message,
            stack: error.stack,
            details: error instanceof zod_1.ZodError ? error.issues : error,
        });
        if (error instanceof zod_1.ZodError) {
            sendErrorResponse(res, 400, "Invalid input", error.issues);
            return;
        }
        sendErrorResponse(res, 500, "Error creating author", { error: error.message });
    }
});
exports.createAuthor = createAuthor;
exports.uploadAuthorProfile = upload.single("profilePicture");
