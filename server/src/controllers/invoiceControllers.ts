import { Request, Response } from "express";
import { PrismaClient, Prisma, ClientName, PaymentStatus } from "@prisma/client";
import sanitizeHtml from "sanitize-html";

const prisma = new PrismaClient();

type UserRole = "admin" | "accounts" | "staff";

interface AuthUser {
    id: string;
    role: UserRole;
}

interface InvoiceItemInput {
    itemName: string;
    itemType: "GOODS" | "SERVICES";
    quantity: number;
    unitPrice: number;
}

// POST /invoices - Create a new invoice
export const createInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Received request to create invoice:', { method: req.method, url: req.url, body: req.body, headers: req.headers });

        if (!req.user) {
            console.log('Unauthorized: No authenticated user found');
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;
        console.log('Authenticated user:', { cognitoId, role });

        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            console.log(`Access denied: Role ${role} not authorized to create invoices`);
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to create invoices` });
            return;
        }

        const {
            clientExpenseId,
            clientListId,
            issueDate,
            dueDate,
            senderName,
            senderAddress,
            receiverName,
            receiverAddress,
            referenceNumber,
            description,
            currency = "KES",
            subTotal,
            taxAmount,
            totalAmount,
            notes,
            items,
        } = req.body as {
            clientExpenseId: number;
            clientListId?: number;
            issueDate?: string;
            dueDate: string;
            senderName: string;
            senderAddress: string;
            receiverName: string;
            receiverAddress: string;
            referenceNumber?: string;
            description?: string;
            currency?: string;
            subTotal: number;
            taxAmount: number;
            totalAmount: number;
            notes?: string;
            items: InvoiceItemInput[];
        };

        console.log('Extracted request body:', {
            clientExpenseId,
            clientListId,
            issueDate,
            dueDate,
            senderName,
            senderAddress,
            receiverName,
            receiverAddress,
            referenceNumber,
            description,
            currency,
            subTotal,
            taxAmount,
            totalAmount,
            notes,
            items,
        });

        // Input validation
        if (!clientExpenseId || isNaN(clientExpenseId) || clientExpenseId <= 0) {
            console.log('Validation error: Invalid client expense ID');
            res.status(400).json({ message: "Valid client expense ID is required" });
            return;
        }
        if (clientListId && (isNaN(clientListId) || clientListId <= 0)) {
            console.log('Validation error: Invalid client list ID');
            res.status(400).json({ message: "Invalid client list ID" });
            return;
        }
        if (issueDate && isNaN(Date.parse(issueDate))) {
            console.log('Validation error: Invalid issue date');
            res.status(400).json({ message: "Invalid issue date" });
            return;
        }
        if (!dueDate || isNaN(Date.parse(dueDate))) {
            console.log('Validation error: Invalid due date');
            res.status(400).json({ message: "Valid due date is required" });
            return;
        }
        if (!senderName || typeof senderName !== "string" || senderName.length > 255) {
            console.log('Validation error: Invalid sender name');
            res.status(400).json({ message: "Sender name must be a string, 255 characters or less" });
            return;
        }
        if (!senderAddress || typeof senderAddress !== "string" || senderAddress.length > 200) {
            console.log('Validation error: Invalid sender address');
            res.status(400).json({ message: "Sender address must be a string, 200 characters or less" });
            return;
        }
        if (!receiverName || typeof receiverName !== "string" || receiverName.length > 255) {
            console.log('Validation error: Invalid receiver name');
            res.status(400).json({ message: "Receiver name must be a string, 255 characters or less" });
            return;
        }
        if (!receiverAddress || typeof receiverAddress !== "string" || receiverAddress.length > 200) {
            console.log('Validation error: Invalid receiver address');
            res.status(400).json({ message: "Receiver address must be a string, 200 characters or less" });
            return;
        }
        if (referenceNumber && (typeof referenceNumber !== "string" || referenceNumber.length > 100)) {
            console.log('Validation error: Invalid reference number');
            res.status(400).json({ message: "Reference number must be a string, 100 characters or less" });
            return;
        }
        if (description && (typeof description !== "string" || description.length > 1000)) {
            console.log('Validation error: Invalid description');
            res.status(400).json({ message: "Description must be a string, 1000 characters or less" });
            return;
        }
        if (currency && (typeof currency !== "string" || currency.length > 3)) {
            console.log('Validation error: Invalid currency');
            res.status(400).json({ message: "Currency must be a string, 3 characters or less" });
            return;
        }
        if (isNaN(subTotal) || subTotal < 0) {
            console.log('Validation error: Invalid subtotal');
            res.status(400).json({ message: "Subtotal must be a non-negative number" });
            return;
        }
        if (isNaN(taxAmount) || taxAmount < 0) {
            console.log('Validation error: Invalid tax amount');
            res.status(400).json({ message: "Tax amount must be a non-negative number" });
            return;
        }
        if (isNaN(totalAmount) || totalAmount < 0) {
            console.log('Validation error: Invalid total amount');
            res.status(400).json({ message: "Total amount must be a non-negative number" });
            return;
        }
        if (notes && (typeof notes !== "string" || notes.length > 1000)) {
            console.log('Validation error: Invalid notes');
            res.status(400).json({ message: "Notes must be a string, 1000 characters or less" });
            return;
        }
        if (!Array.isArray(items) || items.length === 0) {
            console.log('Validation error: Items array is required and cannot be empty');
            res.status(400).json({ message: "Items array is required and cannot be empty" });
            return;
        }
        for (const item of items) {
            if (!item.itemName || typeof item.itemName !== "string" || item.itemName.length > 255) {
                console.log('Validation error: Invalid item name');
                res.status(400).json({ message: "Each item must have a name, string, 255 characters or less" });
                return;
            }
            if (!["GOODS", "SERVICES"].includes(item.itemType)) {
                console.log('Validation error: Invalid item type');
                res.status(400).json({ message: "Item type must be GOODS or SERVICES" });
                return;
            }
            if (isNaN(item.quantity) || item.quantity < 1) {
                console.log('Validation error: Invalid item quantity');
                res.status(400).json({ message: "Item quantity must be a positive integer" });
                return;
            }
            if (isNaN(item.unitPrice) || item.unitPrice < 0) {
                console.log('Validation error: Invalid item unit price');
                res.status(400).json({ message: "Item unit price must be a non-negative number" });
                return;
            }
        }

        // Verify clientExpense exists
        const clientExpense = await prisma.clientExpense.findUnique({
            where: { id: clientExpenseId },
        });
        if (!clientExpense) {
            console.log('Validation error: Client expense not found');
            res.status(404).json({ message: "Client expense not found" });
            return;
        }

        // Verify clientList exists if provided
        if (clientListId) {
            const clientList = await prisma.clientList.findUnique({
                where: { id: clientListId, deletedAt: null },
            });
            if (!clientList) {
                console.log('Validation error: Client list not found');
                res.status(404).json({ message: "Client list not found" });
                return;
            }
        }

        // Generate unique invoice number
        const invoiceCount = await prisma.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, "0")}`;

        console.log('Validation passed, preparing data for Prisma');

        const data: Prisma.InvoiceCreateInput = {
            invoiceNumber,
            issueDate: issueDate ? new Date(issueDate) : new Date(),
            dueDate: new Date(dueDate),
            senderName: sanitizeHtml(senderName),
            senderAddress: sanitizeHtml(senderAddress),
            receiverName: sanitizeHtml(receiverName),
            receiverAddress: sanitizeHtml(receiverAddress),
            referenceNumber: referenceNumber ? sanitizeHtml(referenceNumber) : null,
            description: description ? sanitizeHtml(description) : null,
            currency,
            subTotal,
            taxAmount,
            totalAmount,
            notes: notes ? sanitizeHtml(notes) : null,
            clientExpense: { connect: { id: clientExpenseId } },
            clientList: clientListId ? { connect: { id: clientListId } } : undefined,
            [role === "admin" ? "createdByAdmin" : role === "accounts" ? "createdByAccounts" : "createdByStaff"]: {
                connect: { cognitoId },
            },
            items: {
                create: items.map(item => ({
                    itemName: sanitizeHtml(item.itemName),
                    itemType: item.itemType,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.quantity * item.unitPrice,
                })),
            },
        };

        console.log('Prisma create input:', data);

        const invoice = await prisma.invoice.create({
            data,
            include: {
                clientExpense: true,
                clientList: true,
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                items: true,
            },
        });

        console.log('Invoice created successfully:', { invoiceId: invoice.id, invoiceNumber });

        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: "CREATE",
                entity: "Invoice",
                entityId: invoice.id.toString(),
                meta: { invoiceNumber, clientExpenseId, clientListId },
                [actorField]: cognitoId,
            },
        });

        console.log('Audit log created for invoice:', { entityId: invoice.id, actorField, cognitoId });

        res.status(201).json(invoice);
    } catch (error) {
        console.error("Error creating invoice:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};

// GET /invoices - List all invoices
export const getInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;
        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to view invoices` });
            return;
        }

        const { page = "1", limit = "10", clientName } = req.query;
        const pageNumber = Number(page);
        const maxLimit = 100;
        const limitNumber = Math.min(Number(limit), maxLimit);

        if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
            res.status(400).json({ message: "Invalid page or limit parameters" });
            return;
        }

        // Validate clientName if provided
        let clientNameFilter: Prisma.EnumClientNameNullableFilter<"ClientList"> | undefined;
        if (clientName) {
            const inputClientName = String(clientName).toUpperCase();
            const matchingClientNames = Object.values(ClientName).filter((name) =>
                name.toUpperCase().includes(inputClientName)
            );
            if (matchingClientNames.length === 0) {
                res.status(400).json({ message: "No matching client names" });
                return;
            }
            clientNameFilter = { in: matchingClientNames.length > 0 ? matchingClientNames : null };
        }

        const where: Prisma.InvoiceWhereInput = {
            AND: [
                ...(clientNameFilter ? [{ clientList: { clientName: clientNameFilter } }] : []),
            ],
        };

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (pageNumber - 1) * limitNumber,
                take: limitNumber,
                include: {
                    clientExpense: true,
                    clientList: true,
                    createdByAdmin: true,
                    createdByAccounts: true,
                    createdByStaff: true,
                    items: true,
                },
            }),
            prisma.invoice.count({ where }),
        ]);

        if (invoices.length === 0) {
            res.status(404).json({ message: "No invoices found" });
            return;
        }

        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: "READ",
                entity: "Invoice",
                entityId: "multiple",
                meta: { count: invoices.length, page: pageNumber, limit: limitNumber },
                [actorField]: cognitoId,
            },
        });

        res.json({
            invoices,
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        });
    } catch (error) {
        console.error("Error retrieving invoices:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            query: req.query,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};

// GET /invoices/:id - View a single invoice
export const getInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;
        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to view invoices` });
            return;
        }

        const { id } = req.params;
        const idNumber = Number(id);

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid invoice ID" });
            return;
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: idNumber },
            include: {
                clientExpense: true,
                clientList: true,
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                items: true,
            },
        });

        if (!invoice) {
            res.status(404).json({ message: "Invoice not found" });
            return;
        }

        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: "READ",
                entity: "Invoice",
                entityId: idNumber.toString(),
                meta: { invoiceNumber: invoice.invoiceNumber },
                [actorField]: cognitoId,
            },
        });

        res.json(invoice);
    } catch (error) {
        console.error("Error retrieving invoice:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};

// PUT /invoices/:id - Update an invoice or mark as paid
export const updateInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;
        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to update invoices` });
            return;
        }

        const { id } = req.params;
        const idNumber = Number(id);

        const {
            clientExpenseId,
            clientListId,
            issueDate,
            dueDate,
            senderName,
            senderAddress,
            receiverName,
            receiverAddress,
            referenceNumber,
            description,
            currency,
            subTotal,
            taxAmount,
            totalAmount,
            notes,
            items,
            markAsPaid,
        } = req.body as {
            clientExpenseId?: number;
            clientListId?: number | null;
            issueDate?: string;
            dueDate?: string;
            senderName?: string;
            senderAddress?: string;
            receiverName?: string;
            receiverAddress?: string;
            referenceNumber?: string | null;
            description?: string | null;
            currency?: string;
            subTotal?: number;
            taxAmount?: number;
            totalAmount?: number;
            notes?: string | null;
            items?: InvoiceItemInput[];
            markAsPaid?: boolean;
        };

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid invoice ID" });
            return;
        }

        const invoice = await prisma.invoice.findUnique({ where: { id: idNumber } });
        if (!invoice) {
            res.status(404).json({ message: "Invoice not found" });
            return;
        }

        // Validate inputs
        if (clientExpenseId && (isNaN(clientExpenseId) || clientExpenseId <= 0)) {
            res.status(400).json({ message: "Invalid client expense ID" });
            return;
        }
        if (clientListId && (isNaN(clientListId) || clientListId <= 0)) {
            res.status(400).json({ message: "Invalid client list ID" });
            return;
        }
        if (issueDate && isNaN(Date.parse(issueDate))) {
            res.status(400).json({ message: "Invalid issue date" });
            return;
        }
        if (dueDate && isNaN(Date.parse(dueDate))) {
            res.status(400).json({ message: "Invalid due date" });
            return;
        }
        if (senderName && (typeof senderName !== "string" || senderName.length > 255)) {
            res.status(400).json({ message: "Sender name must be a string, 255 characters or less" });
            return;
        }
        if (senderAddress && (typeof senderAddress !== "string" || senderAddress.length > 200)) {
            res.status(400).json({ message: "Sender address must be a string, 200 characters or less" });
            return;
        }
        if (receiverName && (typeof receiverName !== "string" || receiverName.length > 255)) {
            res.status(400).json({ message: "Receiver name must be a string, 255 characters or less" });
            return;
        }
        if (receiverAddress && (typeof receiverAddress !== "string" || receiverAddress.length > 200)) {
            res.status(400).json({ message: "Receiver address must be a string, 200 characters or less" });
            return;
        }
        if (referenceNumber !== undefined && referenceNumber != null && (typeof referenceNumber !== "string" || referenceNumber.length > 100)) {
            res.status(400).json({ message: "Reference number must be a string, 100 characters or less" });
            return;
        }
        if (description !== undefined && description != null && (typeof description !== "string" || description.length > 1000)) {
            res.status(400).json({ message: "Description must be a string, 1000 characters or less" });
            return;
        }
        if (currency && (typeof currency !== "string" || currency.length > 3)) {
            res.status(400).json({ message: "Currency must be a string, 3 characters or less" });
            return;
        }
        if (subTotal !== undefined && (isNaN(subTotal) || subTotal < 0)) {
            res.status(400).json({ message: "Subtotal must be a non-negative number" });
            return;
        }
        if (taxAmount !== undefined && (isNaN(taxAmount) || taxAmount < 0)) {
            res.status(400).json({ message: "Tax amount must be a non-negative number" });
            return;
        }
        if (totalAmount !== undefined && (isNaN(totalAmount) || totalAmount < 0)) {
            res.status(400).json({ message: "Total amount must be a non-negative number" });
            return;
        }
        if (notes !== undefined && notes != null && (typeof notes !== "string" || notes.length > 1000)) {
            res.status(400).json({ message: "Notes must be a string, 1000 characters or less" });
            return;
        }
        if (items && (!Array.isArray(items) || items.length === 0)) {
            res.status(400).json({ message: "Items array must be non-empty if provided" });
            return;
        }
        if (items) {
            for (const item of items) {
                if (!item.itemName || typeof item.itemName !== "string" || item.itemName.length > 255) {
                    res.status(400).json({ message: "Each item must have a name, string, 255 characters or less" });
                    return;
                }
                if (!["GOODS", "SERVICES"].includes(item.itemType)) {
                    res.status(400).json({ message: "Item type must be GOODS or SERVICES" });
                    return;
                }
                if (isNaN(item.quantity) || item.quantity < 1) {
                    res.status(400).json({ message: "Item quantity must be a positive integer" });
                    return;
                }
                if (isNaN(item.unitPrice) || item.unitPrice < 0) {
                    res.status(400).json({ message: "Item unit price must be a non-negative number" });
                    return;
                }
            }
        }
        if (markAsPaid !== undefined && typeof markAsPaid !== "boolean") {
            res.status(400).json({ message: "markAsPaid must be a boolean" });
            return;
        }

        // Verify clientExpense exists if provided
        if (clientExpenseId) {
            const clientExpense = await prisma.clientExpense.findUnique({
                where: { id: clientExpenseId },
            });
            if (!clientExpense) {
                res.status(404).json({ message: "Client expense not found" });
                return;
            }
        }

        // Verify clientList exists if provided
        if (clientListId) {
            const clientList = await prisma.clientList.findUnique({
                where: { id: clientListId, deletedAt: null },
            });
            if (!clientList) {
                res.status(404).json({ message: "Client list not found" });
                return;
            }
        }

        const data: Prisma.InvoiceUpdateInput = {};
        if (clientExpenseId) data.clientExpense = { connect: { id: clientExpenseId } };
        if (clientListId !== undefined) data.clientList = clientListId ? { connect: { id: clientListId } } : { disconnect: true };
        if (issueDate) data.issueDate = new Date(issueDate);
        if (dueDate) data.dueDate = new Date(dueDate);
        if (senderName) data.senderName = sanitizeHtml(senderName);
        if (senderAddress) data.senderAddress = sanitizeHtml(senderAddress);
        if (receiverName) data.receiverName = sanitizeHtml(receiverName);
        if (receiverAddress) data.receiverAddress = sanitizeHtml(receiverAddress);
        if (referenceNumber !== undefined) data.referenceNumber = referenceNumber ? sanitizeHtml(referenceNumber) : null;
        if (description !== undefined) data.description = description ? sanitizeHtml(description) : null;
        if (currency) data.currency = currency;
        if (subTotal !== undefined) data.subTotal = subTotal;
        if (taxAmount !== undefined) data.taxAmount = taxAmount;
        if (totalAmount !== undefined) data.totalAmount = totalAmount;
        if (notes !== undefined) data.notes = notes ? sanitizeHtml(notes) : null;

        if (items) {
            data.items = {
                deleteMany: {},
                create: items.map(item => ({
                    itemName: sanitizeHtml(item.itemName),
                    itemType: item.itemType,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.quantity * item.unitPrice,
                })),
            };
        }

        // If marking as paid, update the related clientExpense paymentStatus
        if (markAsPaid) {
            await prisma.clientExpense.update({
                where: { id: invoice.clientExpenseId },
                data: { paymentStatus: PaymentStatus.PAID },
            });
        }

        const updatedInvoice = await prisma.invoice.update({
            where: { id: idNumber },
            data,
            include: {
                clientExpense: true,
                clientList: true,
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                items: true,
            },
        });

        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: markAsPaid ? "MARK_PAID" : "UPDATE",
                entity: "Invoice",
                entityId: idNumber.toString(),
                meta: {
                    invoiceNumber: updatedInvoice.invoiceNumber,
                    updatedFields: Object.keys(data),
                    markAsPaid,
                },
                [actorField]: cognitoId,
            },
        });

        res.json(updatedInvoice);
    } catch (error) {
        console.error("Error updating invoice:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString(),
        });

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Invoice not found" });
            return;
        }

        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};

// DELETE /invoices/:id - Delete an invoice
export const deleteInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;
        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to delete invoices` });
            return;
        }

        const { id } = req.params;
        const idNumber = Number(id);

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid invoice ID" });
            return;
        }

        const invoice = await prisma.invoice.findUnique({ where: { id: idNumber } });
        if (!invoice) {
            res.status(404).json({ message: "Invoice not found" });
            return;
        }

        await prisma.invoice.delete({
            where: { id: idNumber },
        });

        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: "DELETE",
                entity: "Invoice",
                entityId: idNumber.toString(),
                meta: { invoiceNumber: invoice.invoiceNumber },
                [actorField]: cognitoId,
            },
        });

        res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
        console.error("Error deleting invoice:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Invoice not found" });
            return;
        }

        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const generateInvoicePDF = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            console.log('Unauthorized: No authenticated user found');
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;
        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            console.log(`Access denied: Role ${role} not authorized to generate invoice PDFs`);
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to generate invoice PDFs` });
            return;
        }

        const { id } = req.params;
        const idNumber = Number(id);

        if (isNaN(idNumber) || idNumber <= 0) {
            console.log('Validation error: Invalid invoice ID');
            res.status(400).json({ message: "Invalid invoice ID" });
            return;
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: idNumber },
            include: {
                clientExpense: true,
                clientList: true,
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                items: true,
            },
        });

        if (!invoice) {
            console.log('Invoice not found:', { id: idNumber });
            res.status(404).json({ message: "Invoice not found" });
            return;
        }

        // Generate LaTeX document
        const latexContent = `
\\documentclass[a4paper,12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{dejavu}
\\usepackage{geometry}
\\geometry{margin=1in}
\\usepackage{array}
\\usepackage{booktabs}
\\usepackage{siunitx}
\\usepackage{fancyhdr}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{Invoice \\#${sanitizeHtml(invoice.invoiceNumber)}}
\\fancyfoot[C]{\\thepage}
\\renewcommand{\\headrulewidth}{0.4pt}

\\begin{document}
\\sffamily

\\begin{center}
    \\textbf{\\Large Invoice} \\\\
    \\vspace{0.5cm}
    Invoice \\#${sanitizeHtml(invoice.invoiceNumber)} \\\\
    Issue Date: ${invoice.issueDate.toLocaleDateString('en-GB')} \\\\
    Due Date: ${invoice.dueDate.toLocaleDateString('en-GB')} \\\\
\end{center}

\\vspace{0.5cm}

\\begin{tabular}{p{0.45\\textwidth} p{0.45\\textwidth}}
    \\textbf{From:} & \\textbf{To:} \\\\
    ${sanitizeHtml(invoice.senderName)} & ${sanitizeHtml(invoice.receiverName)} \\\\
    ${sanitizeHtml(invoice.senderAddress).replace(/\n/g, '\\\\')} & ${sanitizeHtml(invoice.receiverAddress).replace(/\n/g, '\\\\')} \\\\
    ${invoice.clientExpense ? `KRA PIN: ${sanitizeHtml(invoice.clientExpense.kraPin || 'N/A')}` : ''} & ${invoice.clientList ? `Client: ${sanitizeHtml(invoice.clientList.clientName || invoice.clientList.customClientName || 'N/A')}` : ''} \\\\
    & ${invoice.clientList && invoice.clientList.kraPin ? `KRA PIN: ${sanitizeHtml(invoice.clientList.kraPin)}` : ''} \\\\
\end{tabular}

\\vspace{0.5cm}

\\begin{center}
\\begin{tabular}{|>{\\raggedright}p{0.4\\textwidth}|c|c|r|}
    \\hline
    \\textbf{Description} & \\textbf{Type} & \\textbf{Quantity} & \\textbf{Unit Price (${sanitizeHtml(invoice.currency)})} \\\\
    \\hline
    ${invoice.items
            .map(
                item => `
    ${sanitizeHtml(item.itemName)} & ${sanitizeHtml(item.itemType)} & ${item.quantity} & \\SI{${item.unitPrice.toFixed(2)}}{${sanitizeHtml(invoice.currency)}} \\\\
    \\hline`
            )
            .join('')}
    \\multicolumn{3}{|r|}{\\textbf{Subtotal}} & \\SI{${invoice.subTotal.toFixed(2)}}{${sanitizeHtml(invoice.currency)}} \\\\
    \\hline
    \\multicolumn{3}{|r|}{\\textbf{Tax}} & \\SI{${invoice.taxAmount.toFixed(2)}}{${sanitizeHtml(invoice.currency)}} \\\\
    \\hline
    \\multicolumn{3}{|r|}{\\textbf{Total}} & \\SI{${invoice.totalAmount.toFixed(2)}}{${sanitizeHtml(invoice.currency)}} \\\\
    \\hline
\\end{tabular}
\\end{center}

\\vspace{0.5cm}

${
            invoice.description
                ? `
\\noindent \\textbf{Description:} ${sanitizeHtml(invoice.description).replace(/\n/g, '\\\\')} \\\\
`
                : ''
        }
${
            invoice.notes
                ? `
\\noindent \\textbf{Notes:} ${sanitizeHtml(invoice.notes).replace(/\n/g, '\\\\')} \\\\
`
                : ''
        }
${
            invoice.clientExpense?.paymentStatus
                ? `
\\noindent \\textbf{Payment Status:} ${sanitizeHtml(invoice.clientExpense.paymentStatus)} \\\\
`
                : ''
        }

\\end{document}
        `;

        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: "GENERATE_PDF",
                entity: "Invoice",
                entityId: idNumber.toString(),
                meta: { invoiceNumber: invoice.invoiceNumber },
                [actorField]: cognitoId,
            },
        });

        console.log('LaTeX PDF generated for invoice:', { invoiceId: idNumber, invoiceNumber: invoice.invoiceNumber });

        res.setHeader('Content-Type', 'text/latex');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoice.invoiceNumber}.tex`);
        res.send(latexContent);
    } catch (error) {
        console.error("Error generating invoice PDF:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Invoice not found" });
            return;
        }

        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};