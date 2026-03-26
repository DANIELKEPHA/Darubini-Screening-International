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
exports.handleBrevoWebhook = exports.getCampaignAnalytics = exports.scheduleCampaign = exports.getCampaigns = exports.sendEmailCampaign = exports.updateEmailCampaign = exports.createEmailCampaign = exports.getEmailLists = exports.addEmailToList = exports.createEmailList = void 0;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const csv_parse_1 = require("csv-parse");
const stream_1 = require("stream");
const prisma = new client_1.PrismaClient();
const brevoApi = axios_1.default.create({
    baseURL: "https://api.brevo.com/v3",
    headers: {
        "api-key": process.env.BREVO_API_KEY || "",
        "Content-Type": "application/json",
    },
});
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.UPLOAD_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.UPLOAD_SECRET_ACCESS_KEY || "",
    },
});
const createEmailList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { name, userIds = [], guestUserIds = [] } = req.body;
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            console.error("Authentication failed: No adminCognitoId found");
            res
                .status(401)
                .json({ message: "Unauthorized: Admin not authenticated" });
            return;
        }
        if (!name) {
            console.error("Validation failed: List name is required");
            res.status(400).json({ message: "List name is required" });
            return;
        }
        if (/\S+@\S+\.\S+/.test(name)) {
            console.error("Validation failed: List name cannot be an email address");
            res.status(400).json({ message: "List name cannot be an email address" });
            return;
        }
        if (!process.env.BREVO_API_KEY) {
            console.error("Configuration error: BREVO_API_KEY is missing in environment variables");
            res
                .status(500)
                .json({
                message: "Server configuration error: Brevo API key is missing",
            });
            return;
        }
        const folderResponse = yield brevoApi.get("/contacts/folders");
        let folderId = (_c = (_b = folderResponse.data.folders) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id;
        if (!folderId) {
            const newFolder = yield brevoApi.post("/contacts/folders", {
                name: "Default Darubini Folder",
            });
            folderId = newFolder.data.id;
        }
        else {
        }
        const brevoResponse = yield brevoApi.post("/contacts/lists", {
            name,
            folderId,
        });
        const brevoListId = brevoResponse.data.id;
        const emailList = yield prisma.emailList.create({
            data: {
                brevoListId,
                name,
                adminCognitoId,
                users: { connect: (userIds === null || userIds === void 0 ? void 0 : userIds.map((id) => ({ id }))) || [] },
                guestUsers: {
                    connect: (guestUserIds === null || guestUserIds === void 0 ? void 0 : guestUserIds.map((id) => ({ id }))) || [],
                },
            },
            include: { users: true, guestUsers: true },
        });
        const contacts = [
            ...(((_d = emailList.users) === null || _d === void 0 ? void 0 : _d.map((user) => ({
                email: user.email,
                attributes: { NAME: user.name || "" },
            }))) || []),
            ...(((_e = emailList.guestUsers) === null || _e === void 0 ? void 0 : _e.map((guest) => ({
                email: guest.email,
                attributes: { NAME: guest.name || "" },
            }))) || []),
        ];
        if (contacts.length > 0) {
            yield brevoApi.post("/contacts/import", {
                listIds: [brevoListId],
                jsonBody: contacts,
            });
        }
        res.status(201).json(emailList);
    }
    catch (error) {
        console.error("Error in createEmailList:", {
            message: error.message,
            response: (_f = error.response) === null || _f === void 0 ? void 0 : _f.data,
            stack: error.stack,
            requestBody: req.body,
        });
        res.status(500).json({
            message: "Error creating email list",
            error: error.message,
            details: ((_g = error.response) === null || _g === void 0 ? void 0 : _g.data) || "No additional details available",
        });
    }
});
exports.createEmailList = createEmailList;
const addEmailToList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const { listId } = req.params;
        const { email, name } = req.body;
        const file = req.file || null;
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            console.error("Authentication failed: No adminCognitoId found");
            res.status(401).json({ message: "Unauthorized: Admin not authenticated" });
            return;
        }
        if (!listId || isNaN(parseInt(listId))) {
            console.error("Validation failed: Invalid listId");
            res.status(400).json({ message: "Invalid list ID" });
            return;
        }
        const emailList = yield prisma.emailList.findUnique({
            where: { id: parseInt(listId) },
            include: { users: true, guestUsers: true },
        });
        if (!emailList) {
            console.error("Validation failed: Email list not found");
            res.status(404).json({ message: "Email list not found" });
            return;
        }
        const contacts = [];
        const skippedEmails = [];
        if (file) {
            const csvData = yield new Promise((resolve, reject) => {
                const results = [];
                const parser = (0, csv_parse_1.parse)({ columns: true, trim: true, skip_empty_lines: true });
                parser.on("data", (row) => {
                    if (row.email && /^\S+@\S+\.\S+$/.test(row.email)) {
                        results.push({ email: row.email, name: row.name });
                    }
                    else {
                        skippedEmails.push(row.email || "Invalid email");
                    }
                });
                parser.on("end", () => resolve(results));
                parser.on("error", (err) => reject(err));
                const stream = stream_1.Readable.from(file.buffer);
                stream.pipe(parser);
            });
            contacts.push(...csvData);
        }
        else if (email) {
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                console.error("Validation failed: Invalid email address");
                res.status(400).json({ message: "Valid email address is required" });
                return;
            }
            contacts.push({ email, name });
        }
        else {
            console.error("Validation failed: Email or CSV file required");
            res.status(400).json({ message: "Email or CSV file is required" });
            return;
        }
        const newGuestUsers = [];
        for (const contact of contacts) {
            let guestUser = yield prisma.guestUser.findUnique({ where: { email: contact.email } });
            if (!guestUser) {
                guestUser = yield prisma.guestUser.create({
                    data: {
                        email: contact.email,
                        name: contact.name || "Unknown", // Provide default value for required name field
                    },
                });
            }
            else if (emailList.guestUsers.some((user) => user.email === contact.email)) {
                skippedEmails.push(contact.email);
                continue;
            }
            newGuestUsers.push(guestUser);
        }
        if (newGuestUsers.length > 0) {
            const updatedList = yield prisma.emailList.update({
                where: { id: parseInt(listId) },
                data: {
                    guestUsers: { connect: newGuestUsers.map(user => ({ id: user.id })) },
                },
                include: { users: true, guestUsers: true },
            });
            try {
                yield brevoApi.post("/contacts/import", {
                    listIds: [emailList.brevoListId],
                    jsonBody: newGuestUsers.map(user => ({
                        email: user.email,
                        attributes: { NAME: user.name || "Unknown" },
                    })),
                });
            }
            catch (brevoError) {
                console.error("Brevo API error:", {
                    message: brevoError.message,
                    response: (_b = brevoError.response) === null || _b === void 0 ? void 0 : _b.data,
                    status: (_c = brevoError.response) === null || _c === void 0 ? void 0 : _c.status,
                });
                res.status(400).json({
                    message: "Failed to sync contacts with Brevo",
                    error: brevoError.message,
                    details: Object.assign(Object.assign({}, (_d = brevoError.response) === null || _d === void 0 ? void 0 : _d.data), { skippedEmails }),
                });
                return;
            }
            res.status(200).json(Object.assign(Object.assign({}, updatedList), { skippedEmails }));
        }
        else {
            res.status(400).json({ message: "No new emails added", skippedEmails });
        }
    }
    catch (error) {
        console.error("Error in addEmailToList:", {
            message: error.message,
            response: (_e = error.response) === null || _e === void 0 ? void 0 : _e.data,
            stack: error.stack,
            requestBody: req.body,
            params: req.params,
        });
        res.status(500).json({
            message: "Error adding emails to list",
            error: error.message,
            details: ((_f = error.response) === null || _f === void 0 ? void 0 : _f.data) || "No additional details available",
        });
    }
});
exports.addEmailToList = addEmailToList;
const getEmailLists = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { page = 1, limit = 10 } = req.query;
        if (!adminCognitoId) {
            console.error("No adminCognitoId found in request");
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const emailLists = yield prisma.emailList.findMany({
            where: { adminCognitoId, deletedAt: null },
            include: {
                users: true,
                guestUsers: true,
                emailCampaigns: true,
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
        });
        res.status(200).json(emailLists);
    }
    catch (error) {
        console.error("Error fetching email lists:", error);
        res.status(500).json({ error: "Failed to fetch email lists" });
    }
});
exports.getEmailLists = getEmailLists;
const createEmailCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        const { name, subject, htmlContent, emailListId, scheduledAt } = req.body;
        const files = req.files;
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            console.error("Authentication failed: No adminCognitoId found");
            res.status(401).json({ message: "Unauthorized: Admin not authenticated" });
            return;
        }
        if (!name || !subject || !emailListId || !htmlContent) {
            console.error("Validation failed: Missing required fields");
            res.status(400).json({ message: "Name, subject, HTML content, and email list ID are required" });
            return;
        }
        const emailList = yield prisma.emailList.findUnique({
            where: { id: parseInt(emailListId) },
            include: { users: true, guestUsers: true },
        });
        if (!emailList) {
            console.error("Validation failed: Email list not found");
            res.status(404).json({ message: "Email list not found" });
            return;
        }
        // Sync contacts to Brevo first
        const contacts = [
            ...(((_b = emailList.users) === null || _b === void 0 ? void 0 : _b.map((user) => ({
                email: user.email,
                attributes: { NAME: user.name || "Recipient" },
            }))) || []),
            ...(((_c = emailList.guestUsers) === null || _c === void 0 ? void 0 : _c.map((guest) => ({
                email: guest.email,
                attributes: { NAME: guest.name || "Recipient" },
            }))) || []),
        ];
        if (contacts.length > 0) {
            try {
                yield brevoApi.post("/contacts/import", {
                    listIds: [emailList.brevoListId],
                    jsonBody: contacts,
                });
            }
            catch (brevoError) {
                console.error("Failed to sync contacts to Brevo:", {
                    message: brevoError.message,
                    response: (_d = brevoError.response) === null || _d === void 0 ? void 0 : _d.data,
                    status: (_e = brevoError.response) === null || _e === void 0 ? void 0 : _e.status,
                });
                res.status(400).json({
                    message: "Failed to sync contacts to Brevo",
                    error: brevoError.message,
                    details: ((_f = brevoError.response) === null || _f === void 0 ? void 0 : _f.data) || "No additional Brevo details",
                });
                return;
            }
        }
        else {
            console.error("Validation failed: Email list has no recipients");
            res.status(400).json({ message: "Email list has no recipients" });
            return;
        }
        // Upload files to S3
        const attachmentUrls = [];
        const attachmentRecords = [];
        if (files && files.length > 0) {
            for (const file of files) {
                const key = `attachments/${(0, uuid_1.v4)()}-${file.originalname}`;
                try {
                    const command = new client_s3_1.PutObjectCommand({
                        Bucket: process.env.AWS_S3_BUCKET || "",
                        Key: key,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                    });
                    yield s3Client.send(command);
                    const presignedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.PutObjectCommand({
                        Bucket: process.env.AWS_S3_BUCKET,
                        Key: key,
                    }), { expiresIn: 7 * 24 * 60 * 60 }); // 7 days
                    attachmentUrls.push(presignedUrl);
                    attachmentRecords.push({
                        fileName: file.originalname,
                        filePath: key,
                        mimeType: file.mimetype,
                        size: file.size,
                    });
                }
                catch (s3Error) {
                    console.error("Failed to upload file to S3:", {
                        message: s3Error.message,
                        stack: s3Error.stack,
                    });
                    res.status(400).json({
                        message: "Failed to upload attachment to S3",
                        error: s3Error.message,
                        details: s3Error.stack || "No additional S3 details",
                    });
                    return;
                }
            }
        }
        // Create Brevo campaign
        try {
            const brevoResponse = yield brevoApi.post("/emailCampaigns", {
                name,
                subject,
                htmlContent,
                sender: {
                    name: process.env.BREVO_SENDER_NAME || "Darubini Screening International Company",
                    email: process.env.BREVO_SENDER_EMAIL || "relations@darubiniscreening.com",
                },
                recipients: { listIds: [emailList.brevoListId] },
                scheduledAt: scheduledAt || undefined,
                attachment: attachmentUrls.length > 0 ? attachmentUrls.map(url => ({ url })) : undefined,
            });
            const brevoCampaignId = brevoResponse.data.id;
            // Create campaign in Prisma
            const emailCampaign = yield prisma.emailCampaign.create({
                data: {
                    brevoCampaignId,
                    name,
                    subject,
                    htmlContent,
                    status: scheduledAt ? "SCHEDULED" : "DRAFT",
                    adminCognitoId,
                    emailListId: parseInt(emailListId),
                    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                    attachments: { create: attachmentRecords },
                },
                include: { emailList: true, attachments: true },
            });
            res.status(201).json(emailCampaign);
        }
        catch (brevoError) {
            console.error("Brevo API error:", {
                message: brevoError.message,
                response: (_g = brevoError.response) === null || _g === void 0 ? void 0 : _g.data,
                status: (_h = brevoError.response) === null || _h === void 0 ? void 0 : _h.status,
            });
            res.status(400).json({
                message: "Failed to create Brevo campaign",
                error: brevoError.message,
                details: ((_j = brevoError.response) === null || _j === void 0 ? void 0 : _j.data) || "No additional Brevo details",
            });
            return;
        }
    }
    catch (error) {
        console.error("Error in createEmailCampaign:", {
            message: error.message,
            response: (_k = error.response) === null || _k === void 0 ? void 0 : _k.data,
            stack: error.stack,
            requestBody: req.body,
        });
        res.status(500).json({
            message: "Error creating email campaign",
            error: error.message,
            details: ((_l = error.response) === null || _l === void 0 ? void 0 : _l.data) || "No additional details available",
        });
    }
});
exports.createEmailCampaign = createEmailCampaign;
const updateEmailCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const { id } = req.params;
        const { name, subject, htmlContent, emailListId, scheduledAt } = req.body;
        const files = req.files;
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            console.error("Authentication failed: No adminCognitoId found");
            res.status(401).json({ message: "Unauthorized: Admin not authenticated" });
            return;
        }
        const campaign = yield prisma.emailCampaign.findUnique({
            where: { id: parseInt(id) },
            include: { emailList: true, attachments: true },
        });
        if (!campaign || campaign.adminCognitoId !== adminCognitoId) {
            console.error("Validation failed: Campaign not found or unauthorized");
            res.status(404).json({ message: "Campaign not found or unauthorized" });
            return;
        }
        // Handle attachments
        const attachmentUrls = [];
        const attachmentRecords = [];
        if (files && files.length > 0) {
            for (const attachment of campaign.attachments) {
                yield s3Client.send(new client_s3_1.DeleteObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: attachment.filePath,
                }));
            }
            yield prisma.attachment.deleteMany({ where: { emailCampaignId: parseInt(id) } });
            for (const file of files) {
                const key = `attachments/${(0, uuid_1.v4)()}-${file.originalname}`;
                const command = new client_s3_1.PutObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET || "your-bucket-name",
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                });
                yield s3Client.send(command);
                const presignedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.PutObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: key,
                }), { expiresIn: 30 * 24 * 60 * 60 });
                attachmentUrls.push(presignedUrl);
                attachmentRecords.push({
                    fileName: file.originalname,
                    filePath: key,
                    mimeType: file.mimetype,
                    size: file.size,
                });
            }
        }
        else {
            for (const attachment of campaign.attachments) {
                const presignedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.PutObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: attachment.filePath,
                }), { expiresIn: 30 * 24 * 60 * 60 });
                attachmentUrls.push(presignedUrl);
            }
        }
        // Sync contacts if emailListId changes
        let brevoListId = campaign.emailList.brevoListId;
        if (emailListId && parseInt(emailListId) !== campaign.emailListId) {
            const emailList = yield prisma.emailList.findUnique({
                where: { id: parseInt(emailListId) },
                include: { users: true, guestUsers: true },
            });
            if (!emailList) {
                console.error("Validation failed: Email list not found");
                res.status(404).json({ message: "Email list not found" });
                return;
            }
            brevoListId = emailList.brevoListId;
            const contacts = [
                ...(((_b = emailList.users) === null || _b === void 0 ? void 0 : _b.map((user) => ({
                    email: user.email,
                    attributes: { NAME: user.name || "Recipient" },
                }))) || []),
                ...(((_c = emailList.guestUsers) === null || _c === void 0 ? void 0 : _c.map((guest) => ({
                    email: guest.email,
                    attributes: { NAME: guest.name || "Recipient" },
                }))) || []),
            ];
            if (contacts.length > 0) {
                yield brevoApi.post("/contacts/import", {
                    listIds: [brevoListId],
                    jsonBody: contacts,
                });
            }
        }
        // Prepare Brevo update
        const brevoUpdateData = {};
        if (name)
            brevoUpdateData.name = name;
        if (subject)
            brevoUpdateData.subject = subject;
        if (htmlContent)
            brevoUpdateData.htmlContent = htmlContent;
        if (emailListId)
            brevoUpdateData.recipients = { listIds: [brevoListId] };
        if (scheduledAt)
            brevoUpdateData.scheduledAt = scheduledAt;
        if (attachmentUrls.length > 0)
            brevoUpdateData.attachment = attachmentUrls.map(url => ({ url }));
        if (Object.keys(brevoUpdateData).length > 0) {
            try {
                yield brevoApi.put(`/emailCampaigns/${campaign.brevoCampaignId}`, brevoUpdateData);
            }
            catch (brevoError) {
                console.error("Brevo API error:", {
                    message: brevoError.message,
                    response: (_d = brevoError.response) === null || _d === void 0 ? void 0 : _d.data,
                    status: (_e = brevoError.response) === null || _e === void 0 ? void 0 : _e.status,
                });
                res.status(400).json({
                    message: "Failed to update Brevo campaign",
                    error: brevoError.message,
                    details: ((_f = brevoError.response) === null || _f === void 0 ? void 0 : _f.data) || "No additional Brevo details",
                });
                return;
            }
        }
        // Update Prisma database
        const updateData = {};
        if (name)
            updateData.name = name;
        if (subject)
            updateData.subject = subject;
        if (htmlContent)
            updateData.htmlContent = htmlContent;
        if (emailListId)
            updateData.emailListId = parseInt(emailListId);
        if (scheduledAt)
            updateData.scheduledAt = new Date(scheduledAt);
        if (scheduledAt && campaign.status !== "SENT")
            updateData.status = "SCHEDULED";
        if (attachmentRecords.length > 0) {
            updateData.attachments = { create: attachmentRecords };
        }
        const updatedCampaign = yield prisma.emailCampaign.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: { emailList: true, attachments: true },
        });
        res.status(200).json(updatedCampaign);
    }
    catch (error) {
        console.error("Error in updateEmailCampaign:", {
            message: error.message,
            response: (_g = error.response) === null || _g === void 0 ? void 0 : _g.data,
            stack: error.stack,
            requestBody: req.body,
        });
        res.status(500).json({
            message: "Error updating campaign",
            error: error.message,
            details: ((_h = error.response) === null || _h === void 0 ? void 0 : _h.data) || "No additional details available",
        });
    }
});
exports.updateEmailCampaign = updateEmailCampaign;
const sendEmailCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            res
                .status(401)
                .json({ message: "Unauthorized: Admin not authenticated" });
            return;
        }
        const campaign = yield prisma.emailCampaign.findUnique({
            where: { id: parseInt(id) },
            include: { emailList: true },
        });
        if (!campaign || campaign.adminCognitoId !== adminCognitoId) {
            res.status(404).json({ message: "Campaign not found or unauthorized" });
            return;
        }
        yield brevoApi.post(`/emailCampaigns/${campaign.brevoCampaignId}/sendNow`);
        yield prisma.emailCampaign.update({
            where: { id: parseInt(id) },
            data: { status: "SENT" },
        });
        yield prisma.emailSend.updateMany({
            where: { emailCampaignId: parseInt(id) },
            data: { status: "SENT", sentAt: new Date() },
        });
        res.json({ message: "Email campaign sent" });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error sending email campaign: ${error.message}` });
    }
});
exports.sendEmailCampaign = sendEmailCampaign;
const getCampaigns = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { page = 1, limit = 10, search } = req.query;
        if (!adminCognitoId) {
            console.error("No adminCognitoId found in request");
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const pageNum = Number(page);
        const limitNum = Number(limit);
        if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
            console.error("Invalid pagination parameters:", { page, limit });
            res.status(400).json({ error: "Invalid page or limit parameters" });
            return;
        }
        const whereClause = {
            adminCognitoId,
        };
        if (search && typeof search === "string" && search.trim()) {
            whereClause.OR = [
                { name: { contains: search.trim(), mode: "insensitive" } },
                { subject: { contains: search.trim(), mode: "insensitive" } },
            ];
        }
        const [campaigns, total] = yield Promise.all([
            prisma.emailCampaign.findMany({
                where: whereClause,
                include: { emailList: true },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
            }),
            prisma.emailCampaign.count({ where: whereClause }),
        ]);
        res.status(200).json({
            data: campaigns,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            total,
        });
    }
    catch (error) {
        console.error("Error fetching email campaigns:", {
            message: error.message,
            stack: error.stack,
            code: error.code, // Useful for Prisma errors
        });
        res.status(500).json({
            error: "Failed to fetch email campaigns",
            details: error.message || "No additional details available",
        });
    }
});
exports.getCampaigns = getCampaigns;
const scheduleCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { campaignId, scheduleAt } = req.body;
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            console.error("Authentication failed: No adminCognitoId found");
            res
                .status(401)
                .json({ message: "Unauthorized: Admin not authenticated" });
            return;
        }
        if (!campaignId || !scheduleAt) {
            console.error("Validation failed: Missing required fields");
            res
                .status(400)
                .json({ message: "Campaign ID and schedule date are required" });
            return;
        }
        const campaign = yield prisma.emailCampaign.findUnique({
            where: { id: Number(campaignId) },
            include: { emailList: true },
        });
        if (!campaign || campaign.adminCognitoId !== adminCognitoId) {
            console.error("Validation failed: Campaign not found or unauthorized");
            res.status(404).json({ message: "Campaign not found or unauthorized" });
            return;
        }
        try {
            yield brevoApi.patch(`/emailCampaigns/${campaign.brevoCampaignId}`, {
                scheduledAt: scheduleAt,
            });
            const updatedCampaign = yield prisma.emailCampaign.update({
                where: { id: Number(campaignId) },
                data: {
                    scheduledAt: new Date(scheduleAt),
                    status: "SCHEDULED",
                },
                include: { emailList: true },
            });
            res.status(200).json(updatedCampaign);
        }
        catch (brevoError) {
            console.error("Brevo API error:", {
                message: brevoError.message,
                response: (_b = brevoError.response) === null || _b === void 0 ? void 0 : _b.data,
                status: (_c = brevoError.response) === null || _c === void 0 ? void 0 : _c.status,
            });
            res.status(400).json({
                message: "Failed to schedule Brevo campaign",
                error: brevoError.message,
                details: ((_d = brevoError.response) === null || _d === void 0 ? void 0 : _d.data) || "No additional Brevo details",
            });
            return;
        }
    }
    catch (error) {
        console.error("Error in scheduleCampaign:", {
            message: error.message,
            stack: error.stack,
            requestBody: req.body,
        });
        res.status(500).json({
            message: "Error scheduling campaign",
            error: error.message,
            details: ((_e = error.response) === null || _e === void 0 ? void 0 : _e.data) || "No additional details available",
        });
    }
});
exports.scheduleCampaign = scheduleCampaign;
const getCampaignAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            res
                .status(401)
                .json({ message: "Unauthorized: Admin not authenticated" });
            return;
        }
        const campaign = yield prisma.emailCampaign.findUnique({
            where: { id: parseInt(id) },
            include: { emailSends: true },
        });
        if (!campaign || campaign.adminCognitoId !== adminCognitoId) {
            res.status(404).json({ message: "Campaign not found or unauthorized" });
            return;
        }
        const stats = yield brevoApi.get(`/emailCampaigns/${campaign.brevoCampaignId}`);
        const totalSends = campaign.emailSends.length;
        const delivered = campaign.emailSends.filter((s) => s.status === client_1.EmailSendStatus.DELIVERED).length;
        const opened = campaign.emailSends.filter((s) => s.status === client_1.EmailSendStatus.OPENED).length;
        const clicked = campaign.emailSends.filter((s) => s.status === client_1.EmailSendStatus.CLICKED).length;
        const bounced = campaign.emailSends.filter((s) => s.status === client_1.EmailSendStatus.BOUNCED).length;
        res.json({
            totalSends,
            delivered,
            openRate: totalSends > 0 ? (opened / totalSends) * 100 : 0,
            clickRate: totalSends > 0 ? (clicked / totalSends) * 100 : 0,
            bounceRate: totalSends > 0 ? (bounced / totalSends) * 100 : 0,
            brevoStats: ((_b = stats.data.statistics) === null || _b === void 0 ? void 0 : _b.globalStats) || {},
        });
    }
    catch (error) {
        res
            .status(500)
            .json({
            message: `Error retrieving campaign analytics: ${error.message}`,
        });
    }
});
exports.getCampaignAnalytics = getCampaignAnalytics;
const handleBrevoWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { event, email, "campaign-id": campaignId } = req.body;
        const campaign = yield prisma.emailCampaign.findUnique({
            where: { brevoCampaignId: parseInt(campaignId) },
        });
        if (!campaign) {
            res.status(404).json({ message: "Campaign not found" });
            return;
        }
        const emailSend = yield prisma.emailSend.findFirst({
            where: {
                emailCampaignId: campaign.id,
                OR: [{ user: { email } }, { guestUser: { email } }],
            },
        });
        if (!emailSend) {
            res.status(404).json({ message: "Email send record not found" });
            return;
        }
        const statusMap = {
            delivered: "DELIVERED",
            opened: "OPENED",
            click: "CLICKED",
            bounce: "BOUNCED",
            unsub: "UNSUBSCRIBED",
            spam: "SPAM",
            error: "FAILED",
        };
        const updateData = { status: statusMap[event] || "FAILED" };
        if (event === "bounce" || event === "error") {
            updateData.reason = req.body.reason || "Unknown error";
        }
        if (event === "delivered") {
            updateData.sentAt = new Date();
        }
        if (event === "opened") {
            updateData.openedAt = new Date();
        }
        if (event === "click") {
            updateData.clickedAt = new Date();
        }
        yield prisma.emailSend.update({
            where: { id: emailSend.id },
            data: updateData,
        });
        res.json({ message: "Webhook processed" });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error processing webhook: ${error.message}` });
    }
});
exports.handleBrevoWebhook = handleBrevoWebhook;
