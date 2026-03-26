import { Request, RequestHandler, Response } from "express";
import {
  PrismaClient,
  EmailSendStatus,
  User,
  GuestUser,
  EmailSend,
} from "@prisma/client";
import axios from "axios";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { parse } from "csv-parse";
import { Readable } from "stream";

const prisma = new PrismaClient();

const brevoApi = axios.create({
  baseURL: "https://api.brevo.com/v3",
  headers: {
    "api-key": process.env.BREVO_API_KEY || "",
    "Content-Type": "application/json",
  },
});

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.UPLOAD_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.UPLOAD_SECRET_ACCESS_KEY || "",
    },
});


export const createEmailList = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, userIds = [], guestUserIds = [] } = req.body;
    const adminCognitoId = req.user?.id;

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
      console.error(
        "Configuration error: BREVO_API_KEY is missing in environment variables"
      );
      res
        .status(500)
        .json({
          message: "Server configuration error: Brevo API key is missing",
        });
      return;
    }
    const folderResponse = await brevoApi.get("/contacts/folders");
    let folderId = folderResponse.data.folders?.[0]?.id;
    if (!folderId) {
      const newFolder = await brevoApi.post("/contacts/folders", {
        name: "Default Darubini Folder",
      });
      folderId = newFolder.data.id;
    } else {
    }

    const brevoResponse = await brevoApi.post("/contacts/lists", {
      name,
      folderId,
    });
    const brevoListId = brevoResponse.data.id;

    const emailList = await prisma.emailList.create({
      data: {
        brevoListId,
        name,
        adminCognitoId,
        users: { connect: userIds?.map((id: number) => ({ id })) || [] },
        guestUsers: {
          connect: guestUserIds?.map((id: number) => ({ id })) || [],
        },
      },
      include: { users: true, guestUsers: true },
    });

    const contacts = [
      ...(emailList.users?.map((user: User) => ({
        email: user.email,
        attributes: { NAME: user.name || "" },
      })) || []),
      ...(emailList.guestUsers?.map((guest: GuestUser) => ({
        email: guest.email,
        attributes: { NAME: guest.name || "" },
      })) || []),
    ];

    if (contacts.length > 0) {
      await brevoApi.post("/contacts/import", {
        listIds: [brevoListId],
        jsonBody: contacts,
      });
    }

    res.status(201).json(emailList);
  } catch (error: any) {
    console.error("Error in createEmailList:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({
      message: "Error creating email list",
      error: error.message,
      details: error.response?.data || "No additional details available",
    });
  }
};

export const addEmailToList = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {

        const { listId } = req.params;
        const { email, name } = req.body;
        const file = (req.file as Express.Multer.File) || null;
        const adminCognitoId = req.user?.id;

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

        const emailList = await prisma.emailList.findUnique({
            where: { id: parseInt(listId) },
            include: { users: true, guestUsers: true },
        });
        if (!emailList) {
            console.error("Validation failed: Email list not found");
            res.status(404).json({ message: "Email list not found" });
            return;
        }

        const contacts: { email: string; name?: string }[] = [];
        const skippedEmails: string[] = [];

        if (file) {
            const csvData = await new Promise<{ email: string; name?: string }[]>((resolve, reject) => {
                const results: { email: string; name?: string }[] = [];
                const parser = parse({ columns: true, trim: true, skip_empty_lines: true });

                parser.on("data", (row) => {
                    if (row.email && /^\S+@\S+\.\S+$/.test(row.email)) {
                        results.push({ email: row.email, name: row.name });
                    } else {
                        skippedEmails.push(row.email || "Invalid email");
                    }
                });

                parser.on("end", () => resolve(results));
                parser.on("error", (err) => reject(err));

                const stream = Readable.from(file.buffer);
                stream.pipe(parser);
            });

            contacts.push(...csvData);
        } else if (email) {
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                console.error("Validation failed: Invalid email address");
                res.status(400).json({ message: "Valid email address is required" });
                return;
            }
            contacts.push({ email, name });
        } else {
            console.error("Validation failed: Email or CSV file required");
            res.status(400).json({ message: "Email or CSV file is required" });
            return;
        }

        const newGuestUsers: { id: number; email: string; name: string }[] = [];
        for (const contact of contacts) {
            let guestUser = await prisma.guestUser.findUnique({ where: { email: contact.email } });
            if (!guestUser) {
                guestUser = await prisma.guestUser.create({
                    data: {
                        email: contact.email,
                        name: contact.name || "Unknown", // Provide default value for required name field
                    },
                });
            } else if (emailList.guestUsers.some((user: GuestUser) => user.email === contact.email)) {

                skippedEmails.push(contact.email);
                continue;
            }
            newGuestUsers.push(guestUser);
        }

        if (newGuestUsers.length > 0) {
            const updatedList = await prisma.emailList.update({
                where: { id: parseInt(listId) },
                data: {
                    guestUsers: { connect: newGuestUsers.map(user => ({ id: user.id })) },
                },
                include: { users: true, guestUsers: true },
            });

            try {
                await brevoApi.post("/contacts/import", {
                    listIds: [emailList.brevoListId],
                    jsonBody: newGuestUsers.map(user => ({
                        email: user.email,
                        attributes: { NAME: user.name || "Unknown" },
                    })),
                });
            } catch (brevoError: any) {
                console.error("Brevo API error:", {
                    message: brevoError.message,
                    response: brevoError.response?.data,
                    status: brevoError.response?.status,
                });
                res.status(400).json({
                    message: "Failed to sync contacts with Brevo",
                    error: brevoError.message,
                    details: { ...brevoError.response?.data, skippedEmails },
                });
                return;
            }

            res.status(200).json({ ...updatedList, skippedEmails });
        } else {
            res.status(400).json({ message: "No new emails added", skippedEmails });
        }
    } catch (error: any) {
        console.error("Error in addEmailToList:", {
            message: error.message,
            response: error.response?.data,
            stack: error.stack,
            requestBody: req.body,
            params: req.params,
        });
        res.status(500).json({
            message: "Error adding emails to list",
            error: error.message,
            details: error.response?.data || "No additional details available",
        });
    }
};

export const getEmailLists: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const adminCognitoId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    if (!adminCognitoId) {
      console.error("No adminCognitoId found in request");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const emailLists = await prisma.emailList.findMany({
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
  } catch (error) {
    console.error("Error fetching email lists:", error);
    res.status(500).json({ error: "Failed to fetch email lists" });
  }
};

export const createEmailCampaign: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, subject, htmlContent, emailListId, scheduledAt } = req.body;
        const files = req.files as Express.Multer.File[] | undefined;
        const adminCognitoId = req.user?.id;

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

        const emailList = await prisma.emailList.findUnique({
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
            ...(emailList.users?.map((user: User) => ({
                email: user.email,
                attributes: { NAME: user.name || "Recipient" },
            })) || []),
            ...(emailList.guestUsers?.map((guest: GuestUser) => ({
                email: guest.email,
                attributes: { NAME: guest.name || "Recipient" },
            })) || []),
        ];
        if (contacts.length > 0) {
            try {
                await brevoApi.post("/contacts/import", {
                    listIds: [emailList.brevoListId],
                    jsonBody: contacts,
                });
            } catch (brevoError: any) {
                console.error("Failed to sync contacts to Brevo:", {
                    message: brevoError.message,
                    response: brevoError.response?.data,
                    status: brevoError.response?.status,
                });
                res.status(400).json({
                    message: "Failed to sync contacts to Brevo",
                    error: brevoError.message,
                    details: brevoError.response?.data || "No additional Brevo details",
                });
                return;
            }
        } else {
            console.error("Validation failed: Email list has no recipients");
            res.status(400).json({ message: "Email list has no recipients" });
            return;
        }

        // Upload files to S3
        const attachmentUrls: string[] = [];
        const attachmentRecords: { fileName: string; filePath: string; mimeType: string; size: number }[] = [];
        if (files && files.length > 0) {
            for (const file of files) {
                const key = `attachments/${uuidv4()}-${file.originalname}`;
                try {
                    const command = new PutObjectCommand({
                        Bucket: process.env.AWS_S3_BUCKET || "",
                        Key: key,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                    });
                    await s3Client.send(command);

                    const presignedUrl = await getSignedUrl(s3Client, new PutObjectCommand({
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
                } catch (s3Error: any) {
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
            const brevoResponse = await brevoApi.post("/emailCampaigns", {
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
            const emailCampaign = await prisma.emailCampaign.create({
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
        } catch (brevoError: any) {
            console.error("Brevo API error:", {
                message: brevoError.message,
                response: brevoError.response?.data,
                status: brevoError.response?.status,
            });
            res.status(400).json({
                message: "Failed to create Brevo campaign",
                error: brevoError.message,
                details: brevoError.response?.data || "No additional Brevo details",
            });
            return;
        }
    } catch (error: any) {
        console.error("Error in createEmailCampaign:", {
            message: error.message,
            response: error.response?.data,
            stack: error.stack,
            requestBody: req.body,
        });
        res.status(500).json({
            message: "Error creating email campaign",
            error: error.message,
            details: error.response?.data || "No additional details available",
        });
    }
};

export const updateEmailCampaign: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, subject, htmlContent, emailListId, scheduledAt } = req.body;
        const files = req.files as Express.Multer.File[] | undefined;
        const adminCognitoId = req.user?.id;

        if (!adminCognitoId) {
            console.error("Authentication failed: No adminCognitoId found");
            res.status(401).json({ message: "Unauthorized: Admin not authenticated" });
            return;
        }

        const campaign = await prisma.emailCampaign.findUnique({
            where: { id: parseInt(id) },
            include: { emailList: true, attachments: true },
        });
        if (!campaign || campaign.adminCognitoId !== adminCognitoId) {
            console.error("Validation failed: Campaign not found or unauthorized");
            res.status(404).json({ message: "Campaign not found or unauthorized" });
            return;
        }

        // Handle attachments
        const attachmentUrls: string[] = [];
        const attachmentRecords: { fileName: string; filePath: string; mimeType: string; size: number }[] = [];
        if (files && files.length > 0) {
            for (const attachment of campaign.attachments) {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: attachment.filePath,
                }));
            }
            await prisma.attachment.deleteMany({ where: { emailCampaignId: parseInt(id) } });

            for (const file of files) {
                const key = `attachments/${uuidv4()}-${file.originalname}`;
                const command = new PutObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET || "your-bucket-name",
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                });
                await s3Client.send(command);
                const presignedUrl = await getSignedUrl(s3Client, new PutObjectCommand({
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
        } else {
            for (const attachment of campaign.attachments) {
                const presignedUrl = await getSignedUrl(s3Client, new PutObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: attachment.filePath,
                }), { expiresIn: 30 * 24 * 60 * 60 });
                attachmentUrls.push(presignedUrl);
            }
        }

        // Sync contacts if emailListId changes
        let brevoListId = campaign.emailList.brevoListId;
        if (emailListId && parseInt(emailListId) !== campaign.emailListId) {
            const emailList = await prisma.emailList.findUnique({
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
                ...(emailList.users?.map((user: User) => ({
                    email: user.email,
                    attributes: { NAME: user.name || "Recipient" },
                })) || []),
                ...(emailList.guestUsers?.map((guest: GuestUser) => ({
                    email: guest.email,
                    attributes: { NAME: guest.name || "Recipient" },
                })) || []),
            ];
            if (contacts.length > 0) {
                await brevoApi.post("/contacts/import", {
                    listIds: [brevoListId],
                    jsonBody: contacts,
                });
            }
        }

        // Prepare Brevo update
        const brevoUpdateData: any = {};
        if (name) brevoUpdateData.name = name;
        if (subject) brevoUpdateData.subject = subject;
        if (htmlContent) brevoUpdateData.htmlContent = htmlContent;
        if (emailListId) brevoUpdateData.recipients = { listIds: [brevoListId] };
        if (scheduledAt) brevoUpdateData.scheduledAt = scheduledAt;
        if (attachmentUrls.length > 0) brevoUpdateData.attachment = attachmentUrls.map(url => ({ url }));

        if (Object.keys(brevoUpdateData).length > 0) {
            try {
                await brevoApi.put(`/emailCampaigns/${campaign.brevoCampaignId}`, brevoUpdateData);
            } catch (brevoError: any) {
                console.error("Brevo API error:", {
                    message: brevoError.message,
                    response: brevoError.response?.data,
                    status: brevoError.response?.status,
                });
                res.status(400).json({
                    message: "Failed to update Brevo campaign",
                    error: brevoError.message,
                    details: brevoError.response?.data || "No additional Brevo details",
                });
                return;
            }
        }

        // Update Prisma database
        const updateData: any = {};
        if (name) updateData.name = name;
        if (subject) updateData.subject = subject;
        if (htmlContent) updateData.htmlContent = htmlContent;
        if (emailListId) updateData.emailListId = parseInt(emailListId);
        if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
        if (scheduledAt && campaign.status !== "SENT") updateData.status = "SCHEDULED";
        if (attachmentRecords.length > 0) {
            updateData.attachments = { create: attachmentRecords };
        }

        const updatedCampaign = await prisma.emailCampaign.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: { emailList: true, attachments: true },
        });

        res.status(200).json(updatedCampaign);
    } catch (error: any) {
        console.error("Error in updateEmailCampaign:", {
            message: error.message,
            response: error.response?.data,
            stack: error.stack,
            requestBody: req.body,
        });
        res.status(500).json({
            message: "Error updating campaign",
            error: error.message,
            details: error.response?.data || "No additional details available",
        });
    }
};

export const sendEmailCampaign = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminCognitoId = req.user?.id;

    if (!adminCognitoId) {
      res
        .status(401)
        .json({ message: "Unauthorized: Admin not authenticated" });
      return;
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: parseInt(id) },
      include: { emailList: true },
    });
    if (!campaign || campaign.adminCognitoId !== adminCognitoId) {
      res.status(404).json({ message: "Campaign not found or unauthorized" });
      return;
    }

    await brevoApi.post(`/emailCampaigns/${campaign.brevoCampaignId}/sendNow`);

    await prisma.emailCampaign.update({
      where: { id: parseInt(id) },
      data: { status: "SENT" },
    });

    await prisma.emailSend.updateMany({
      where: { emailCampaignId: parseInt(id) },
      data: { status: "SENT", sentAt: new Date() },
    });

    res.json({ message: "Email campaign sent" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error sending email campaign: ${error.message}` });
  }
};

export const getCampaigns: RequestHandler = async (
    req: Request,
    res: Response
) => {
  try {
    const adminCognitoId = req.user?.id;
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

    const whereClause: any = {
      adminCognitoId,
    };

    if (search && typeof search === "string" && search.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { subject: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const [campaigns, total] = await Promise.all([
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
  } catch (error: any) {
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
};

export const scheduleCampaign: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { campaignId, scheduleAt } = req.body;
    const adminCognitoId = req.user?.id;

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

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: Number(campaignId) },
      include: { emailList: true },
    });

    if (!campaign || campaign.adminCognitoId !== adminCognitoId) {
      console.error("Validation failed: Campaign not found or unauthorized");
      res.status(404).json({ message: "Campaign not found or unauthorized" });
      return;
    }

    try {
      await brevoApi.patch(`/emailCampaigns/${campaign.brevoCampaignId}`, {
        scheduledAt: scheduleAt,
      });

      const updatedCampaign = await prisma.emailCampaign.update({
        where: { id: Number(campaignId) },
        data: {
          scheduledAt: new Date(scheduleAt),
          status: "SCHEDULED",
        },
        include: { emailList: true },
      });

      res.status(200).json(updatedCampaign);
    } catch (brevoError: any) {
      console.error("Brevo API error:", {
        message: brevoError.message,
        response: brevoError.response?.data,
        status: brevoError.response?.status,
      });
      res.status(400).json({
        message: "Failed to schedule Brevo campaign",
        error: brevoError.message,
        details: brevoError.response?.data || "No additional Brevo details",
      });
      return;
    }
  } catch (error: any) {
    console.error("Error in scheduleCampaign:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({
      message: "Error scheduling campaign",
      error: error.message,
      details: error.response?.data || "No additional details available",
    });
  }
};

export const getCampaignAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminCognitoId = req.user?.id;

    if (!adminCognitoId) {
      res
        .status(401)
        .json({ message: "Unauthorized: Admin not authenticated" });
      return;
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: parseInt(id) },
      include: { emailSends: true },
    });
    if (!campaign || campaign.adminCognitoId !== adminCognitoId) {
      res.status(404).json({ message: "Campaign not found or unauthorized" });
      return;
    }

    const stats = await brevoApi.get(
      `/emailCampaigns/${campaign.brevoCampaignId}`
    );

    const totalSends = campaign.emailSends.length;
    const delivered = campaign.emailSends.filter(
      (s: EmailSend) => s.status === EmailSendStatus.DELIVERED
    ).length;
    const opened = campaign.emailSends.filter(
      (s: EmailSend) => s.status === EmailSendStatus.OPENED
    ).length;
    const clicked = campaign.emailSends.filter(
      (s: EmailSend) => s.status === EmailSendStatus.CLICKED
    ).length;
    const bounced = campaign.emailSends.filter(
      (s: EmailSend) => s.status === EmailSendStatus.BOUNCED
    ).length;

    res.json({
      totalSends,
      delivered,
      openRate: totalSends > 0 ? (opened / totalSends) * 100 : 0,
      clickRate: totalSends > 0 ? (clicked / totalSends) * 100 : 0,
      bounceRate: totalSends > 0 ? (bounced / totalSends) * 100 : 0,
      brevoStats: stats.data.statistics?.globalStats || {},
    });
  } catch (error: any) {
    res
      .status(500)
      .json({
        message: `Error retrieving campaign analytics: ${error.message}`,
      });
  }
};

export const handleBrevoWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { event, email, "campaign-id": campaignId } = req.body;

    const campaign = await prisma.emailCampaign.findUnique({
      where: { brevoCampaignId: parseInt(campaignId) },
    });
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    const emailSend = await prisma.emailSend.findFirst({
      where: {
        emailCampaignId: campaign.id,
        OR: [{ user: { email } }, { guestUser: { email } }],
      },
    });

    if (!emailSend) {
      res.status(404).json({ message: "Email send record not found" });
      return;
    }

    const statusMap: { [key: string]: string } = {
      delivered: "DELIVERED",
      opened: "OPENED",
      click: "CLICKED",
      bounce: "BOUNCED",
      unsub: "UNSUBSCRIBED",
      spam: "SPAM",
      error: "FAILED",
    };

    const updateData: any = { status: statusMap[event] || "FAILED" };
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

    await prisma.emailSend.update({
      where: { id: emailSend.id },
      data: updateData,
    });

    res.json({ message: "Webhook processed" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error processing webhook: ${error.message}` });
  }
};
