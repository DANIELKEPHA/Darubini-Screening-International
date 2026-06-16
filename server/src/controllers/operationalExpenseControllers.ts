import { PrismaClient, Prisma, Frequency, PaymentMode, PaymentStatus, ExpenseStatus, ItemType, AccountType } from "@prisma/client";
import { Request, Response } from "express";
import sanitizeHtml from "sanitize-html";
import PDFDocument from "pdfkit";
import { PassThrough } from "node:stream";

const prisma = new PrismaClient();

type UserRole = "admin" | "user" | "accounts" | "staff";

interface AuthUser {
    id: string;
    role: UserRole;
}

type OperationalExpenseUpdateFields = keyof Prisma.OperationalExpenseUpdateInput;

const actorFieldMap: Record<UserRole, string> = {
    admin: "actorAdminCognitoId",
    accounts: "actorAccountsCognitoId",
    staff: "actorStaffCognitoId",
    user: "actorUserCognitoId",
};

const validateString = (value: any, maxLength: number, fieldName: string): string | null => {
    if (value === undefined || value === null) return null;
    if (typeof value !== "string" || value.length > maxLength || value.trim() === "") {
        throw new Error(`${fieldName} must be a non-empty string, ${maxLength} characters or less`);
    }
    return sanitizeHtml(value.trim());
};

const validateKraPin = (kraPin: any): string | null => {
    if (kraPin === undefined || kraPin === null) return null;
    if (typeof kraPin !== "string" || kraPin.length !== 11 || !/^[A-Za-z0-9]+$/.test(kraPin)) {
        throw new Error("KRA PIN must be an 11-character alphanumeric string or null");
    }
    return sanitizeHtml(kraPin);
};

const validateAmount = (amount: any, fieldName: string): number => {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
        throw new Error(`${fieldName} must be a positive number`);
    }
    return num;
};

const validateDate = (date: any): Date => {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date format");
    }
    return parsedDate;
};

export const validateAccount = async (
    bankAccountId: number | undefined,
    cashAccountId: number | undefined,
    mobileAccountId: number | undefined,
    otherAccountId: number | undefined,
    currency: string
): Promise<void> => {


    const accountIds = [bankAccountId, cashAccountId, mobileAccountId, otherAccountId].filter(id => id !== undefined);
    if (accountIds.length > 1) {
        console.error('Multiple account IDs provided:', { accountIds });
        throw new Error(`Only one account ID can be provided: ${JSON.stringify(accountIds)}`);
    }
    if (accountIds.length === 0) {
        return;
    }

    const accountId = accountIds[0];
    let account;
    let accountType: string;
    if (bankAccountId) {
        account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
        accountType = 'BankAccount';
    } else if (cashAccountId) {
        account = await prisma.cashAccount.findUnique({ where: { id: cashAccountId } });
        accountType = 'CashAccount';
    } else if (mobileAccountId) {
        account = await prisma.mobileAccount.findUnique({ where: { id: mobileAccountId } });
        accountType = 'MobileAccount';
    } else {
        account = await prisma.otherAccount.findUnique({ where: { id: otherAccountId } });
        accountType = 'OtherAccount';
    }

    if (!account) {
        throw new Error(`Invalid or non-existent ${accountType} ID ${accountId}`);
    }
    if (account.currency !== currency) {
        throw new Error(`Account currency (${account.currency}) must match expense currency (${currency})`);
    }
};

const createAuditLog = async (
    action: string,
    entityId: string,
    role: UserRole,
    cognitoId: string,
    expense: any,
    extraMeta: Record<string, any> = {}
) => {
    const actorFieldMap: Record<UserRole, string> = {
        admin: "actorAdminCognitoId",
        accounts: "actorAccountsCognitoId",
        staff: "actorStaffCognitoId",
        user: "actorUserCognitoId",
    };
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entity: "OperationalExpense",
                entityId,
                meta: {
                    expenseName: expense.expenseName,
                    amount: expense.amount.toString(),
                    currency: expense.currency,
                    itemType: expense.itemType,
                    accountType: expense.accountType,
                    bankAccountId: expense.bankAccountId,
                    cashAccountId: expense.cashAccountId,
                    mobileAccountId: expense.mobileAccountId,
                    otherAccountId: expense.otherAccountId,
                    role,
                    cognitoId,
                    ...extraMeta,
                },
                [actorFieldMap[role]]: cognitoId,
            },
        });
    } catch (auditError) {
        console.warn(`Failed to create audit log for ${action}:`, {
            message: auditError instanceof Error ? auditError.message : "Unknown error",
            stack: auditError instanceof Error ? auditError.stack : undefined,
            entityId,
            timestamp: new Date().toISOString(),
        });
    }
};

export const createOperationalExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            agentName,
            kraPin,
            date,
            expenseDetails,
            expenseName,
            institutionName,
            frequency,
            paymentMode,
            paymentModeDescription,
            amount,
            currency,
            totalAmountPaid,
            supplierId,
            bankAccountId,
            cashAccountId,
            mobileAccountId,
            otherAccountId,
            isDraft = false,
            itemType,
            accountType
        } = req.body as {
            agentName: string;
            kraPin?: string | null;
            date: string;
            expenseDetails: string;
            expenseName: string;
            institutionName: string;
            frequency?: Frequency;
            paymentMode?: PaymentMode;
            paymentModeDescription?: string | null;
            amount: number;
            currency?: string;
            totalAmountPaid?: number;
            supplierId?: number;
            bankAccountId?: number;
            cashAccountId?: number;
            mobileAccountId?: number;
            otherAccountId?: number;
            isDraft?: boolean;
            itemType?: ItemType;
            accountType?: AccountType;
        };

        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({
                message: `Access denied: Role ${role} not authorized to create operational expenses`
            });
            return;
        }

        const sanitizedAgentName = validateString(agentName, 100, "Agent name");
        const sanitizedKraPin = validateKraPin(kraPin);
        const parsedDate = validateDate(date);
        const sanitizedExpenseDetails = validateString(expenseDetails, 1000, "Expense details");
        const sanitizedExpenseName = validateString(expenseName, 100, "Expense name");
        const sanitizedInstitutionName = validateString(institutionName, 100, "Institution name");
        const sanitizedAmount = validateAmount(amount, "Amount");
        const sanitizedTotalAmountPaid = totalAmountPaid !== undefined
            ? validateAmount(totalAmountPaid, "Total amount paid")
            : sanitizedAmount;

        let sanitizedPaymentModeDesc: string | null = null;

        if (role === "admin") {
            if (!frequency || !Object.values(Frequency).includes(frequency)) {
                throw new Error("Invalid or missing frequency");
            }
            if (!paymentMode || !Object.values(PaymentMode).includes(paymentMode)) {
                throw new Error("Invalid or missing payment mode");
            }

            const sanitizedCurrency = validateString(currency, 10, "Currency");
            if (sanitizedCurrency && sanitizedCurrency.length < 3) {
                throw new Error("Currency must be at least 3 characters");
            }

            // ✅ Make paymentModeDescription truly optional
            if (paymentModeDescription && paymentModeDescription.trim() !== "") {
                sanitizedPaymentModeDesc = validateString(paymentModeDescription, 500, "Payment mode description");
            }
        }

        if (itemType && !Object.values(ItemType).includes(itemType)) {
            throw new Error("Invalid item type");
        }
        if (accountType && !Object.values(AccountType).includes(accountType)) {
            throw new Error("Invalid account type");
        }

        const effectiveCurrency = role === "admin" && currency ? currency : "KES";

        await validateAccount(bankAccountId, cashAccountId, mobileAccountId, otherAccountId, effectiveCurrency);

        const data: Prisma.OperationalExpenseCreateInput = {
            agentName: sanitizedAgentName!,
            kraPin: sanitizedKraPin,
            date: parsedDate,
            expenseDetails: sanitizedExpenseDetails!,
            expenseName: sanitizedExpenseName!,
            institutionName: sanitizedInstitutionName!,
            frequency: role === "admin" && frequency ? frequency : Frequency.ONCE_OFF,
            paymentMode: role === "admin" && paymentMode ? paymentMode : PaymentMode.CASH,

            // ✅ Now properly optional (null when not provided or empty)
            paymentModeDescription: sanitizedPaymentModeDesc,

            amount: new Prisma.Decimal(sanitizedAmount),
            currency: effectiveCurrency,
            totalAmountPaid: new Prisma.Decimal(sanitizedTotalAmountPaid),
            paymentStatus: PaymentStatus.PENDING,
            expenseStatus: isDraft ? ExpenseStatus.DRAFT : ExpenseStatus.PENDING,

            supplier: supplierId ? { connect: { id: supplierId } } : undefined,
            bankAccount: bankAccountId ? { connect: { id: bankAccountId } } : undefined,
            cashAccount: cashAccountId ? { connect: { id: cashAccountId } } : undefined,
            mobileAccount: mobileAccountId ? { connect: { id: mobileAccountId } } : undefined,
            otherAccount: otherAccountId ? { connect: { id: otherAccountId } } : undefined,

            itemType,
            accountType,

            [role === "admin" ? "createdByAdmin" : role === "accounts" ? "createdByAccounts" : "createdByStaff"]: {
                connect: { cognitoId }
            },
        };

        const expense = await prisma.$transaction(async (tx) => {
            const created = await tx.operationalExpense.create({
                data,
                include: {
                    createdByAdmin: true,
                    createdByAccounts: true,
                    createdByStaff: true,
                    approvedByAdmin: true,
                    approvedByAccounts: true,
                    approvedByStaff: true,
                    supplier: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });

            const now = new Date();
            const referenceNumber = `DSIC-${now.getFullYear()}-EXP-${created.id.toString().padStart(5, "0")}`;

            return tx.operationalExpense.update({
                where: { id: created.id },
                data: { referenceNumber },
                include: {
                    createdByAdmin: true,
                    createdByAccounts: true,
                    createdByStaff: true,
                    approvedByAdmin: true,
                    approvedByAccounts: true,
                    approvedByStaff: true,
                    supplier: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });
        });

        await createAuditLog(isDraft ? "CREATE_DRAFT" : "CREATE", expense.id.toString(), role, cognitoId, expense);

        res.status(201).json({ success: true, data: expense });
    } catch (error) {
        res.status(
            error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025" ? 404 : 400
        ).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    } finally {
        await prisma.$disconnect();
    }
};

export const getOperationalExpenses = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page = "1", limit = "10", period, agentName, expenseName, kraPin, expenseDescription, frequency, paymentMode, bankAccountId, cashAccountId, mobileAccountId, otherAccountId, includeDrafts = "false" } = req.query;
        const pageNumber = Number(page);
        const maxLimit = 100;
        const limitNumber = Math.min(Number(limit), maxLimit);
        const showDrafts = includeDrafts === "true";

        // Validate authenticated user
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        // Validate user role
        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to view operational expenses` });
            return;
        }

        // Validate page and limit parameters
        if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
            res.status(400).json({ message: "Invalid page or limit parameters" });
            return;
        }

        // Validate account IDs
        const accountIds: { [key: string]: number | undefined } = {
            bankAccountId: bankAccountId ? Number(bankAccountId) : undefined,
            cashAccountId: cashAccountId ? Number(cashAccountId) : undefined,
            mobileAccountId: mobileAccountId ? Number(mobileAccountId) : undefined,
            otherAccountId: otherAccountId ? Number(otherAccountId) : undefined,
        };
        for (const [key, id] of Object.entries(accountIds)) {
            if (id !== undefined && (isNaN(id) || id <= 0)) {
                res.status(400).json({ message: `Invalid ${key}` });
                return;
            }
        }

        // Build where clause
        const where: Prisma.OperationalExpenseWhereInput = {
            AND: [
                period ? { date: { gte: new Date(String(period).split(",")[0]), lte: new Date(String(period).split(",")[1]) } } : {},
                agentName ? { agentName: { contains: String(agentName), mode: Prisma.QueryMode.insensitive } } : {},
                kraPin ? { kraPin: { contains: String(kraPin), mode: Prisma.QueryMode.insensitive } } : {},
                expenseName ? { expenseName: { contains: String(expenseName), mode: Prisma.QueryMode.insensitive } } : {},
                expenseDescription ? { reasonForPayment: { contains: String(expenseDescription), mode: Prisma.QueryMode.insensitive } } : {},
                frequency ? { frequency: String(frequency) as Frequency } : {},
                paymentMode ? { paymentMode: String(paymentMode) as PaymentMode } : {},
                bankAccountId ? { bankAccountId: accountIds.bankAccountId } : {},
                cashAccountId ? { cashAccountId: accountIds.cashAccountId } : {},
                mobileAccountId ? { mobileAccountId: accountIds.mobileAccountId } : {},
                otherAccountId ? { otherAccountId: accountIds.otherAccountId } : {},
                showDrafts
                    ? {
                        expenseStatus: ExpenseStatus.DRAFT,
                        ...(role === "admin"
                            ? {}
                            : {
                                OR: [
                                    role === "staff" ? { createdByStaffCognitoId: cognitoId } : {},
                                    role === "accounts" ? { createdByAccountsCognitoId: cognitoId } : {},
                                ].filter((condition) => Object.keys(condition).length > 0),
                            }),
                    }
                    : { expenseStatus: { not: ExpenseStatus.DRAFT } },
            ].filter((condition) => Object.keys(condition).length > 0),
        };

        // Fetch expenses and count
        const [expenses, total] = await Promise.all([
            prisma.operationalExpense.findMany({
                where,
                orderBy: { date: "desc" },
                skip: (pageNumber - 1) * limitNumber,
                take: limitNumber,
                include: {
                    createdByAdmin: true,
                    createdByAccounts: true,
                    createdByStaff: true,
                    approvedByAdmin: true,
                    approvedByAccounts: true,
                    approvedByStaff: true,
                    supplier: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            }),
            prisma.operationalExpense.count({ where }),
        ]);

        // Create audit log
        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        if (actorField && cognitoId) {
            await prisma.auditLog.create({
                data: {
                    action: "READ",
                    entity: "OperationalExpense",
                    entityId: "multiple",
                    meta: {
                        count: expenses.length,
                        page: pageNumber,
                        limit: limitNumber,
                        includeDrafts: showDrafts,
                        bankAccountId,
                        cashAccountId,
                        mobileAccountId,
                        otherAccountId,
                        role,
                        cognitoId,
                    },
                    [actorField]: cognitoId,
                },
            });
        }

        res.json({
            expenses,
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        });
    } catch (error) {
        console.error("Error fetching operational expenses:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res.status(500).json({
                    message: "Data integrity error: Some expenses reference non-existent users/accounts. Contact admin."
                });
                return;
            }
        }

        res.status(500).json({ message: "Internal server error" });
    }
};

export const getOperationalExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const idNumber = Number(id);

        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        // Validate user role
        const allowedRoles: UserRole[] = ['admin', 'accounts', 'staff'];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to view operational expense` });
            return;
        }

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: 'Invalid expense ID' });
            return;
        }

        const expense = await prisma.operationalExpense.findUnique({
            where: { id: idNumber },
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                approvedByAdmin: true,
                approvedByAccounts: true,
                approvedByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
            },
        });

        if (!expense) {
            res.status(404).json({ message: 'Expense not found' });
            return;
        }

        if (role === 'staff' && expense.createdByStaffCognitoId !== cognitoId && expense.expenseStatus === ExpenseStatus.DRAFT) {
            res.status(403).json({ message: 'Access denied: Cannot view draft expense created by another user' });
            return;
        }

        // Create audit log
        const actorFieldMap: Record<UserRole, string> = {
            admin: 'actorAdminCognitoId',
            accounts: 'actorAccountsCognitoId',
            user: 'actorUserCognitoId',
            staff: 'actorStaffCognitoId',
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: 'READ',
                entity: 'OperationalExpense',
                entityId: id,
                meta: {
                    expenseName: expense.expenseName,
                    amount: expense.amount.toString(),
                    currency: expense.currency,
                    itemType: expense.itemType,
                    accountType: expense.accountType,
                    bankAccountId: expense.bankAccountId,
                    cashAccountId: expense.cashAccountId,
                    mobileAccountId: expense.mobileAccountId,
                    otherAccountId: expense.otherAccountId,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });

        res.json(expense);
    } catch (error) {
        console.error("Error fetching operational expenses:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res.status(500).json({
                    message: "Data integrity error: Some expenses reference non-existent users/accounts. Contact admin."
                });
                return;
            }
        }

        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateOperationalExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const idNumber = Number(id);

        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to update operational expense` });
            return;
        }

        if (isNaN(idNumber) || idNumber <= 0) {
            throw new Error("Invalid expense ID");
        }

        const {
            agentName,
            kraPin,
            date,
            expenseDetails,
            expenseName,
            institutionName,
            frequency,
            paymentMode,
            paymentModeDescription,
            amount,
            currency,
            totalAmountPaid,
            supplierId,
            bankAccountId,
            cashAccountId,
            mobileAccountId,
            otherAccountId,
            expenseStatus,
            itemType,
            accountType,
        } = req.body as {
            agentName?: string;
            kraPin?: string | null;
            date?: string;
            expenseDetails?: string;
            expenseName?: string;
            institutionName?: string;
            frequency?: Frequency;
            paymentMode?: PaymentMode;
            paymentModeDescription?: string;
            amount?: number;
            currency?: string;
            totalAmountPaid?: number;
            supplierId?: number;
            bankAccountId?: number;
            cashAccountId?: number;
            mobileAccountId?: number;
            otherAccountId?: number;
            expenseStatus?: ExpenseStatus;
            itemType?: ItemType;
            accountType?: AccountType;
        };

        const existingExpense = await prisma.operationalExpense.findUnique({
            where: { id: idNumber },
            include: {
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
                createdByAdmin: { select: { name: true } },
                createdByAccounts: { select: { name: true } },
                createdByStaff: { select: { name: true } },
                approvedByAdmin: { select: { name: true } },
                approvedByAccounts: { select: { name: true } },
                approvedByStaff: { select: { name: true } },
            },
        });

        if (!existingExpense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }

        if (role === "staff" && existingExpense.createdByStaffCognitoId !== cognitoId && existingExpense.expenseStatus === ExpenseStatus.DRAFT) {
            res.status(403).json({ message: "Access denied: Cannot update draft expense created by another user" });
            return;
        }

        if (expenseStatus && !["admin", "accounts"].includes(role) && expenseStatus === ExpenseStatus.CANCELLED) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to reverse expense` });
            return;
        }

        if (expenseStatus === ExpenseStatus.CANCELLED && (existingExpense.expenseStatus === ExpenseStatus.CANCELLED || existingExpense.expenseStatus === ExpenseStatus.DRAFT)) {
            throw new Error("Cannot reverse an expense that is already cancelled or a draft");
        }

        if (itemType && !Object.values(ItemType).includes(itemType)) {
            throw new Error("Invalid item type");
        }
        if (accountType && !Object.values(AccountType).includes(accountType)) {
            throw new Error("Invalid account type");
        }

        // Validate inputs
        const sanitizedAgentName = validateString(agentName, 100, "Agent name") ?? undefined;
        const sanitizedKraPin = validateKraPin(kraPin);
        const sanitizedDate = date ? validateDate(date) : undefined;
        const sanitizedExpenseDetails = validateString(expenseDetails, 1000, "Expense details") ?? undefined;
        const sanitizedExpenseName = validateString(expenseName, 100, "Expense name") ?? undefined;
        const sanitizedInstitutionName = validateString(institutionName, 100, "Institution name") ?? undefined;
        const sanitizedAmount = amount !== undefined ? validateAmount(amount, "Amount") : undefined;
        const sanitizedTotalAmountPaid = totalAmountPaid !== undefined ? validateAmount(totalAmountPaid, "Total amount paid") : undefined;

        if (role === "admin") {
            if (frequency && !Object.values(Frequency).includes(frequency)) {
                throw new Error("Invalid frequency");
            }
            if (paymentMode && !Object.values(PaymentMode).includes(paymentMode)) {
                throw new Error("Invalid payment mode");
            }
            const sanitizedPaymentModeDesc = validateString(paymentModeDescription, 500, "Payment mode description") ?? undefined;
            const sanitizedCurrency = validateString(currency, 10, "Currency") ?? undefined;
            if (sanitizedCurrency && sanitizedCurrency.length < 3) {
                throw new Error("Currency must be at least 3 characters");
            }
        }

        const effectiveCurrency = currency || existingExpense.currency;
        await validateAccount(bankAccountId, cashAccountId, mobileAccountId, otherAccountId, effectiveCurrency);

        const data: Prisma.OperationalExpenseUpdateInput = {
            agentName: sanitizedAgentName,
            kraPin: sanitizedKraPin,
            date: sanitizedDate,
            expenseDetails: sanitizedExpenseDetails,
            expenseName: sanitizedExpenseName,
            institutionName: sanitizedInstitutionName,
            frequency,
            paymentMode,
            paymentModeDescription,
            amount: sanitizedAmount !== undefined ? new Prisma.Decimal(sanitizedAmount) : undefined,
            currency: effectiveCurrency,
            totalAmountPaid: sanitizedTotalAmountPaid !== undefined ? new Prisma.Decimal(sanitizedTotalAmountPaid) : undefined,
            supplier: supplierId ? { connect: { id: supplierId } } : undefined,
            bankAccount: bankAccountId !== undefined ? (bankAccountId ? { connect: { id: bankAccountId } } : { disconnect: true }) : undefined,
            cashAccount: cashAccountId !== undefined ? (cashAccountId ? { connect: { id: cashAccountId } } : { disconnect: true }) : undefined,
            mobileAccount: mobileAccountId !== undefined ? (mobileAccountId ? { connect: { id: mobileAccountId } } : { disconnect: true }) : undefined,
            otherAccount: otherAccountId !== undefined ? (otherAccountId ? { connect: { id: otherAccountId } } : { disconnect: true }) : undefined,
            expenseStatus,
            itemType,
            accountType,
        };

        const expense = await prisma.operationalExpense.update({
            where: { id: idNumber },
            data,
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                approvedByAdmin: true,
                approvedByAccounts: true,
                approvedByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
            },
        });

        const updateFields: OperationalExpenseUpdateFields[] = Object.keys(data).filter(
            (key) => data[key as keyof typeof data] !== undefined
        ) as OperationalExpenseUpdateFields[];

        await createAuditLog(
            expenseStatus === ExpenseStatus.CANCELLED ? "REVERSE" : "UPDATE",
            id,
            role,
            cognitoId,
            expense,
            { updateFields }
        );

        res.json({ success: true, data: expense });
    } catch (error) {
        res.status(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025" ? 404 : 400).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    } finally {
        await prisma.$disconnect();
    }
};

export const reverseOperationalExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const idNumber = Number(id);

        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ["admin", "accounts"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to reverse operational expense` });
            return;
        }

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid expense ID" });
            return;
        }

        const existingExpense = await prisma.operationalExpense.findUnique({
            where: { id: idNumber },
        });

        if (!existingExpense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }

        if (existingExpense.expenseStatus === ExpenseStatus.CANCELLED || existingExpense.expenseStatus === ExpenseStatus.DRAFT) {
            res.status(400).json({ message: "Cannot reverse an expense that is already cancelled or a draft" });
            return;
        }

        const expense = await prisma.operationalExpense.update({
            where: { id: idNumber },
            data: { expenseStatus: ExpenseStatus.CANCELLED },
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                approvedByAdmin: true,
                approvedByAccounts: true,
                approvedByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
            },
        });

        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: "REVERSE",
                entity: "OperationalExpense",
                entityId: id,
                meta: {
                    expenseName: expense.expenseName,
                    amount: expense.amount.toString(),
                    currency: expense.currency,
                    itemType: expense.itemType,
                    accountType: expense.accountType,
                    bankAccountId: expense.bankAccountId,
                    cashAccountId: expense.cashAccountId,
                    mobileAccountId: expense.mobileAccountId,
                    otherAccountId: expense.otherAccountId,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });

        res.json(expense);
    } catch (error) {
        console.error("Error reversing operational expense:", {
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

export const reverseAndEditOperationalExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const idNumber = Number(id);

        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ["admin", "accounts"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to reverse and edit operational expense` });
            return;
        }

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid expense ID" });
            return;
        }

        const existingExpense = await prisma.operationalExpense.findUnique({
            where: { id: idNumber },
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
            },
        });

        if (!existingExpense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }

        if (existingExpense.expenseStatus === ExpenseStatus.CANCELLED || existingExpense.expenseStatus === ExpenseStatus.DRAFT) {
            res.status(400).json({ message: "Cannot reverse and edit an expense that is already cancelled or a draft" });
            return;
        }

        const expense = await prisma.$transaction(async (tx) => {
            // Step 1: Cancel the existing expense
            const canceledExpense = await tx.operationalExpense.update({
                where: { id: idNumber },
                data: { expenseStatus: ExpenseStatus.CANCELLED },
                include: {
                    createdByAdmin: true,
                    createdByAccounts: true,
                    createdByStaff: true,
                    approvedByAdmin: true,
                    approvedByAccounts: true,
                    approvedByStaff: true,
                    supplier: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });

            // Step 2: Create a new draft expense with copied fields
            const newExpenseData: Prisma.OperationalExpenseCreateInput = {
                agentName: existingExpense.agentName,
                kraPin: existingExpense.kraPin,
                date: existingExpense.date,
                expenseDetails: existingExpense.expenseDetails,
                expenseName: existingExpense.expenseName,
                institutionName: existingExpense.institutionName,
                frequency: existingExpense.frequency,
                paymentMode: existingExpense.paymentMode,
                paymentModeDescription: existingExpense.paymentModeDescription,
                amount: existingExpense.amount,
                currency: existingExpense.currency,
                totalAmountPaid: new Prisma.Decimal(0),
                expenseStatus: ExpenseStatus.DRAFT,
                paymentStatus: PaymentStatus.PENDING,
                supplier: existingExpense.supplierId ? { connect: { id: existingExpense.supplierId } } : undefined,
                bankAccount: existingExpense.bankAccountId ? { connect: { id: existingExpense.bankAccountId } } : undefined,
                cashAccount: existingExpense.cashAccountId ? { connect: { id: existingExpense.cashAccountId } } : undefined,
                mobileAccount: existingExpense.mobileAccountId ? { connect: { id: existingExpense.mobileAccountId } } : undefined,
                otherAccount: existingExpense.otherAccountId ? { connect: { id: existingExpense.otherAccountId } } : undefined,
                itemType: existingExpense.itemType,
                accountType: existingExpense.accountType,
                [role === "admin" ? "createdByAdmin" : "createdByAccounts"]: {
                    connect: { cognitoId },
                },
            };

            const newExpense = await tx.operationalExpense.create({
                data: newExpenseData,
                include: {
                    createdByAdmin: true,
                    createdByAccounts: true,
                    createdByStaff: true,
                    approvedByAdmin: true,
                    approvedByAccounts: true,
                    approvedByStaff: true,
                    supplier: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });

            // Step 3: Create audit logs for both actions
            await tx.auditLog.create({
                data: {
                    action: "REVERSE",
                    entity: "OperationalExpense",
                    entityId: id,
                    meta: {
                        expenseName: canceledExpense.expenseName,
                        amount: canceledExpense.amount.toString(),
                        currency: canceledExpense.currency,
                        itemType: canceledExpense.itemType,
                        accountType: canceledExpense.accountType,
                        bankAccountId: canceledExpense.bankAccountId,
                        cashAccountId: canceledExpense.cashAccountId,
                        mobileAccountId: canceledExpense.mobileAccountId,
                        otherAccountId: canceledExpense.otherAccountId,
                        role,
                        cognitoId,
                    },
                    [actorFieldMap[role]]: cognitoId,
                },
            });

            await tx.auditLog.create({
                data: {
                    action: "CREATE_DRAFT",
                    entity: "OperationalExpense",
                    entityId: newExpense.id.toString(),
                    meta: {
                        expenseName: newExpense.expenseName,
                        amount: newExpense.amount.toString(),
                        currency: newExpense.currency,
                        itemType: newExpense.itemType,
                        accountType: newExpense.accountType,
                        bankAccountId: newExpense.bankAccountId,
                        cashAccountId: newExpense.cashAccountId,
                        mobileAccountId: newExpense.mobileAccountId,
                        otherAccountId: newExpense.otherAccountId,
                        originalExpenseId: idNumber,
                        role,
                        cognitoId,
                    },
                    [actorFieldMap[role]]: cognitoId,
                },
            });

            return newExpense;
        });

        res.json(expense);
    } catch (error) {
        console.error("Error reversing and editing operational expense:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025" ? 404 : 400).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    } finally {
        await prisma.$disconnect();
    }
};

export const approveOperationalExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const idNumber = Number(id);
        const { bankAccountId, cashAccountId, mobileAccountId, otherAccountId } = req.body;

        if (!req.user) {
            console.warn('No authenticated user found');
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        // Validate user role
        const allowedRoles: UserRole[] = ['admin', 'accounts'];
        if (!allowedRoles.includes(role)) {
            console.warn('Unauthorized role', { role });
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to approve operational expense` });
            return;
        }

        if (isNaN(idNumber) || idNumber <= 0) {
            throw new Error('Invalid expense ID');
        }

        const existingExpense = await prisma.operationalExpense.findUnique({
            where: { id: idNumber },
            select: {
                id: true,
                expenseStatus: true,
                expenseName: true,
                amount: true,
                currency: true,
                itemType: true,
                accountType: true,
                bankAccountId: true,
                cashAccountId: true,
                mobileAccountId: true,
                otherAccountId: true,
                totalAmountPaid: true,
                paymentStatus: true,
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                approvedByAdmin: true,
                approvedByAccounts: true,
                approvedByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
                agentName: true,
                paymentMode: true,
            },
        });

        if (!existingExpense) {
            console.warn('Expense not found', { expenseId: idNumber });
            res.status(404).json({ message: 'Expense not found' });
            return;
        }

        if (existingExpense.expenseStatus === ExpenseStatus.APPROVED) {
            throw new Error('Expense is already approved');
        }
        if (existingExpense.expenseStatus === ExpenseStatus.CANCELLED) {
            throw new Error('Cannot approve a cancelled expense');
        }
        if (existingExpense.expenseStatus === ExpenseStatus.DRAFT) {
            throw new Error('Cannot approve a draft expense');
        }

        // Enforce single account ID from request body, fall back to existing expense account ID
        let effectiveBankAccountId: number | undefined;
        let effectiveCashAccountId: number | undefined;
        let effectiveMobileAccountId: number | undefined;
        let effectiveOtherAccountId: number | undefined;

        const providedAccountIds = [bankAccountId, cashAccountId, mobileAccountId, otherAccountId].filter(id => id !== undefined);
        if (providedAccountIds.length > 1) {
            console.error('Multiple account IDs provided in request body', { providedAccountIds });
            throw new Error(`Only one account ID can be provided in the request body: ${JSON.stringify(providedAccountIds)}`);
        }

        if (bankAccountId) {
            effectiveBankAccountId = bankAccountId;
        } else if (cashAccountId) {
            effectiveCashAccountId = cashAccountId;
        } else if (mobileAccountId) {
            effectiveMobileAccountId = mobileAccountId;
        } else if (otherAccountId) {
            effectiveOtherAccountId = otherAccountId;
        } else {
            // Convert null to undefined for Prisma fields
            effectiveBankAccountId = existingExpense.bankAccountId ?? undefined;
            effectiveCashAccountId = existingExpense.cashAccountId ?? undefined;
            effectiveMobileAccountId = existingExpense.mobileAccountId ?? undefined;
            effectiveOtherAccountId = existingExpense.otherAccountId ?? undefined;
        }

        // Require an account ID
        if (!effectiveBankAccountId && !effectiveCashAccountId && !effectiveMobileAccountId && !effectiveOtherAccountId) {
            console.error('No account ID provided or found in expense');
            throw new Error('An account ID (bank, cash, mobile, or other) must be provided or set in the expense');
        }

        await validateAccount(
            effectiveBankAccountId,
            effectiveCashAccountId,
            effectiveMobileAccountId,
            effectiveOtherAccountId,
            existingExpense.currency
        );

        const [expense, transaction] = await prisma.$transaction(async (tx) => {
            // Fetch and validate account
            let account;
            let accountType: string | null = null;
            let accountId: number | null = null;

            if (effectiveBankAccountId) {
                account = await tx.bankAccount.findUnique({ where: { id: effectiveBankAccountId } });

                if (!account) throw new Error(`Bank account not found: ID ${effectiveBankAccountId}`);
                accountType = 'BankAccount';
                accountId = effectiveBankAccountId;
            } else if (effectiveCashAccountId) {
                account = await tx.cashAccount.findUnique({ where: { id: effectiveCashAccountId } });

                if (!account) throw new Error(`Cash account not found: ID ${effectiveCashAccountId}`);
                accountType = 'CashAccount';
                accountId = effectiveCashAccountId;
            } else if (effectiveMobileAccountId) {
                account = await tx.mobileAccount.findUnique({ where: { id: effectiveMobileAccountId } });

                if (!account) throw new Error(`Mobile account not found: ID ${effectiveMobileAccountId}`);
                accountType = 'MobileAccount';
                accountId = effectiveMobileAccountId;
            } else if (effectiveOtherAccountId) {
                account = await tx.otherAccount.findUnique({ where: { id: effectiveOtherAccountId } });

                if (!account) throw new Error(`Other account not found: ID ${effectiveOtherAccountId}`);
                accountType = 'OtherAccount';
                accountId = effectiveOtherAccountId;
            }

            // Validate account balance
            if (account) {
                const balance = Number(account.balance);
                const expenseAmount = Number(existingExpense.amount);

                if (balance < expenseAmount) {
                    throw new Error(`Insufficient balance in ${accountType} ID ${accountId}: ${balance} ${existingExpense.currency} available, ${expenseAmount} required`);
                }
            }

            // Prevent re-approval if already PAID
            if (existingExpense.paymentStatus === PaymentStatus.PAID) {
                throw new Error('Expense is already paid and cannot be re-approved');
            }

            const updateData: Prisma.OperationalExpenseUpdateInput = {
                expenseStatus: ExpenseStatus.APPROVED,
                [role === 'admin' ? 'approvedByAdmin' : 'approvedByAccounts']: {
                    connect: { cognitoId },
                },
                bankAccount: effectiveBankAccountId ? { connect: { id: effectiveBankAccountId } } : { disconnect: true },
                cashAccount: effectiveCashAccountId ? { connect: { id: effectiveCashAccountId } } : { disconnect: true },
                mobileAccount: effectiveMobileAccountId ? { connect: { id: effectiveMobileAccountId } } : { disconnect: true },
                otherAccount: effectiveOtherAccountId ? { connect: { id: effectiveOtherAccountId } } : { disconnect: true },
                totalAmountPaid: existingExpense.amount, // Set to amount, not additive
                paymentStatus: PaymentStatus.PAID,
            };

            const updatedExpense = await tx.operationalExpense.update({
                where: { id: idNumber },
                data: updateData,
                include: {
                    createdByAdmin: true,
                    createdByAccounts: true,
                    createdByStaff: true,
                    approvedByAdmin: true,
                    approvedByAccounts: true,
                    approvedByStaff: true,
                    supplier: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });

            const transaction = await tx.transaction.create({
                data: {
                    amount: existingExpense.amount,
                    currency: existingExpense.currency,
                    payee: existingExpense.agentName || 'Unknown',
                    paymentMode: existingExpense.paymentMode || PaymentMode.CASH,
                    status: PaymentStatus.PAID,
                    date: new Date(),
                    expense: { connect: { id: idNumber } },
                    bankAccount: effectiveBankAccountId ? { connect: { id: effectiveBankAccountId } } : undefined,
                    cashAccount: effectiveCashAccountId ? { connect: { id: effectiveCashAccountId } } : undefined,
                    mobileAccount: effectiveMobileAccountId ? { connect: { id: effectiveMobileAccountId } } : undefined,
                    otherAccount: effectiveOtherAccountId ? { connect: { id: effectiveOtherAccountId } } : undefined,
                    [role === 'admin' ? 'createdByAdmin' : 'createdByAccounts']: {
                        connect: { cognitoId },
                    },
                },
            });

            await tx.auditLog.create({
                data: {
                    action: 'CREATE',
                    entity: 'Transaction',
                    entityId: transaction.id.toString(),
                    meta: {
                        expenseId: idNumber,
                        expenseName: existingExpense.expenseName,
                        amount: transaction.amount.toString(),
                        currency: transaction.currency,
                        payee: transaction.payee,
                        paymentMode: transaction.paymentMode,
                        accountType,
                        accountId,
                        role,
                        cognitoId,
                    },
                    [actorFieldMap[role]]: cognitoId,
                },
            });

            // Deduct balance if account exists
            if (account && accountType && accountId) {
                const newBalance = new Prisma.Decimal(Number(account.balance) - Number(existingExpense.amount));

                if (accountType === 'BankAccount') {
                    await tx.bankAccount.update({
                        where: { id: accountId },
                        data: { balance: newBalance, updatedAt: new Date() },
                    });
                } else if (accountType === 'CashAccount') {
                    await tx.cashAccount.update({
                        where: { id: accountId },
                        data: { balance: newBalance, updatedAt: new Date() },
                    });
                } else if (accountType === 'MobileAccount') {
                    await tx.mobileAccount.update({
                        where: { id: accountId },
                        data: { balance: newBalance, updatedAt: new Date() },
                    });
                } else if (accountType === 'OtherAccount') {
                    await tx.otherAccount.update({
                        where: { id: accountId },
                        data: { balance: newBalance, updatedAt: new Date() },
                    });
                }
                await tx.auditLog.create({
                    data: {
                        action: `DEDUCT_BALANCE_${accountType.toUpperCase()}`,
                        entity: accountType,
                        entityId: accountId.toString(),
                        meta: {
                            expenseId: idNumber,
                            expenseName: existingExpense.expenseName,
                            amountDeducted: existingExpense.amount.toString(),
                            newBalance: newBalance.toString(),
                            currency: existingExpense.currency,
                            role,
                            cognitoId,
                        },
                        [actorFieldMap[role]]: cognitoId,
                    },
                });
            }

            return [updatedExpense, transaction];
        });

        await createAuditLog('APPROVE', id, role, cognitoId, expense, {
            bankAccountId: effectiveBankAccountId,
            cashAccountId: effectiveCashAccountId,
            mobileAccountId: effectiveMobileAccountId,
            otherAccountId: effectiveOtherAccountId,
            transactionId: transaction.id,
        });

        res.json({ success: true, data: { expense, transaction } });
    } catch (error) {
        console.error('Error approving operational expense', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025' ? 404 : 400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal server error',
        });
    }
};

export const deleteOperationalExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const idNumber = Number(id);

        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to delete operational expense` });
            return;
        }

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid expense ID" });
            return;
        }

        const existingExpense = await prisma.operationalExpense.findUnique({
            where: { id: idNumber },
            include: {
                createdByStaff: true,
                createdByAdmin: true,
                createdByAccounts: true,
                approvedByAdmin: true,
                approvedByAccounts: true,
                approvedByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
                transactions: true,
            },
        });

        if (!existingExpense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }

        if (role === "staff" && existingExpense.createdByStaffCognitoId !== cognitoId) {

            res.status(403).json({ message: "Access denied: Cannot delete expense created by another user" });
            return;
        }

        if (existingExpense.transactions.length > 0) {
            res.status(400).json({ message: "Cannot delete expense with associated transactions" });
            return;
        }

        const expenseDetailsForAudit = {
            id: existingExpense.id,
            referenceNumber: existingExpense.referenceNumber,
            agentName: existingExpense.agentName,
            kraPin: existingExpense.kraPin,
            date: existingExpense.date.toISOString(),
            expenseDetails: existingExpense.expenseDetails,
            expenseName: existingExpense.expenseName,
            institutionName: existingExpense.institutionName,
            frequency: existingExpense.frequency,
            paymentMode: existingExpense.paymentMode,
            paymentModeDescription: existingExpense.paymentModeDescription,
            amount: existingExpense.amount.toString(),
            currency: existingExpense.currency,
            totalAmountPaid: existingExpense.totalAmountPaid.toString(),
            paymentStatus: existingExpense.paymentStatus,
            expenseStatus: existingExpense.expenseStatus,
            lpoStatus: existingExpense.lpoStatus,
            itemType: existingExpense.itemType,
            accountType: existingExpense.accountType,
            bankAccountId: existingExpense.bankAccountId,
            cashAccountId: existingExpense.cashAccountId,
            mobileAccountId: existingExpense.mobileAccountId,
            otherAccountId: existingExpense.otherAccountId,
            supplier: existingExpense.supplier ? { id: existingExpense.supplier.id, name: existingExpense.supplier.name } : null,
            createdBy: {
                role,
                name: existingExpense.createdByAdmin?.name || existingExpense.createdByAccounts?.name || existingExpense.createdByStaff?.name || "Unknown",
                cognitoId: existingExpense.createdByAdminCognitoId || existingExpense.createdByAccountsCognitoId || existingExpense.createdByStaffCognitoId || null,
            },
            approvedBy: {
                name: existingExpense.approvedByAdmin?.name || existingExpense.approvedByAccounts?.name || existingExpense.approvedByStaff?.name || null,
                cognitoId: existingExpense.approvedByAdminCognitoId || existingExpense.approvedByAccountsCognitoId || existingExpense.approvedByStaffCognitoId || null,
            },
            createdAt: existingExpense.createdAt.toISOString(),
            updatedAt: existingExpense.updatedAt.toISOString(),
        };

        await prisma.operationalExpense.delete({
            where: { id: idNumber },
        });

        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: "DELETE",
                entity: "OperationalExpense",
                entityId: id,
                meta: {
                    expenseDetails: expenseDetailsForAudit,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting operational expense:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const downloadOperationalExpensePdf = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const idNumber = Number(id);

        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to download operational expense PDF` });
            return;
        }

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid expense ID" });
            return;
        }

        const expense = await prisma.operationalExpense.findUnique({
            where: { id: idNumber },
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                approvedByAdmin: true,
                approvedByAccounts: true,
                approvedByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
            },
        });

        if (!expense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }

        if (role === "staff" && expense.createdByStaffCognitoId !== cognitoId && expense.expenseStatus === ExpenseStatus.DRAFT) {
            res.status(403).json({ message: "Access denied: Cannot download draft expense created by another user" });
            return;
        }

        const doc = new PDFDocument({
            size: 'A4',
            bufferPages: true,
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });
        const stream = new PassThrough();
        const buffers: Buffer[] = [];

        stream.on("data", (chunk) => buffers.push(chunk));
        stream.on("end", () => {
            const pdfBuffer = Buffer.concat(buffers);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=expense-${id}.pdf`);
            res.send(pdfBuffer);
        });

        doc.pipe(stream);

        const primaryColor = '#8d182c';
        const secondaryColor = '#D9911E';
        const lightGray = '#f5f5f5';
        const darkGray = '#666666';

        // Header section with logo and reference - fixed positioning
        const logoWidth = 60;
        const logoHeight = 60;
        // Use the correct aspect ratio to prevent distortion
        doc.image('public/images/logo.png', 50, 50, { width: logoWidth, height: logoHeight });

        // Reference number - moved left and reduced font size
        const now = new Date();
        const referenceNumber = `DSIC-${now.getFullYear()}-EXP-${expense.id.toString().padStart(5, "0")}`;

        doc.fillColor(secondaryColor)
            .fontSize(10) // Reduced from 12 to 10 points
            .font('Helvetica-Bold')
            .text(`REF: ${expense.referenceNumber || referenceNumber}`,
                300, 65, { width: 250, align: 'right' }); // Moved left from 400 to 300

        // Main title - positioned below logo
        const titleY = 50 + logoHeight + 20;
        doc.fillColor(primaryColor)
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('Operational Expense', 50, titleY);

        doc.fillColor(darkGray)
            .fontSize(12)
            .font('Helvetica')
            .text('Expense Details', 50, titleY + 30);

        // Card container
        const cardX = 50;
        const cardY = titleY + 50;
        const cardWidth = 495;

        // Draw card background with rounded corners
        doc.roundedRect(cardX, cardY, cardWidth, 400, 5)
            .fill(lightGray);

        // Card content
        const contentX = cardX + 20;
        let contentY = cardY + 20;

        // Expense name (larger and prominent)
        doc.fillColor(primaryColor)
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(expense.expenseName || 'N/A', contentX, contentY, {
                width: cardWidth - 40,
                align: 'left'
            });

        contentY += 30;

        // Separator line
        doc.moveTo(contentX, contentY)
            .lineTo(contentX + cardWidth - 40, contentY)
            .lineWidth(1)
            .strokeColor(darkGray)
            .stroke();

        contentY += 15;

        // BASIC INFORMATION SECTION - Single Column
        doc.fillColor(darkGray)
            .fontSize(10)
            .text('BASIC INFORMATION', contentX, contentY);

        contentY += 15;

        // Single column layout for basic info
        const labelWidth = 120;
        const valueX = contentX + labelWidth + 10;

        doc.fillColor('black')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Institution:', contentX, contentY, { width: labelWidth });

        const institutionHeight = doc.heightOfString(expense.institutionName || 'N/A', { width: cardWidth - valueX - 20 });
        doc.font('Helvetica')
            .text(expense.institutionName || 'N/A', valueX, contentY, { width: cardWidth - valueX - 20 });

        contentY += Math.max(20, institutionHeight + 5);

        doc.font('Helvetica-Bold')
            .text('Category:', contentX, contentY, { width: labelWidth });

        const categoryText = expense.accountType ? expense.accountType.replace(/_/g, " ").toLowerCase() : 'N/A';
        const categoryHeight = doc.heightOfString(categoryText, { width: cardWidth - valueX - 20 });
        doc.font('Helvetica')
            .text(categoryText, valueX, contentY, { width: cardWidth - valueX - 20 });

        contentY += Math.max(20, categoryHeight + 5);

        doc.font('Helvetica-Bold')
            .text('Frequency:', contentX, contentY, { width: labelWidth });

        doc.font('Helvetica')
            .text(expense.frequency || 'N/A', valueX, contentY, { width: cardWidth - valueX - 20 });

        contentY += 20;

        doc.font('Helvetica-Bold')
            .text('Payment Mode:', contentX, contentY, { width: labelWidth });

        doc.font('Helvetica')
            .text(expense.paymentMode || 'N/A', valueX, contentY, { width: cardWidth - valueX - 20 });

        contentY += 20;

        doc.font('Helvetica-Bold')
            .text('Date:', contentX, contentY, { width: labelWidth });

        doc.font('Helvetica')
            .text(expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A',
                valueX, contentY, { width: cardWidth - valueX - 20 });

        contentY += 20;

        doc.font('Helvetica-Bold')
            .text('Status:', contentX, contentY, { width: labelWidth });

        doc.font('Helvetica')
            .text(expense.expenseStatus || "N/A", valueX, contentY, { width: cardWidth - valueX - 20 });

        contentY += 30;

        // Separator line
        doc.moveTo(contentX, contentY)
            .lineTo(contentX + cardWidth - 40, contentY)
            .lineWidth(1)
            .strokeColor(darkGray)
            .stroke();

        contentY += 15;

        // PAYMENT DETAILS SECTION
        doc.fillColor(darkGray)
            .fontSize(10)
            .text('PAYMENT DETAILS', contentX, contentY);

        contentY += 15;

        // Determine the payment account type and name
        let paymentAccountType = 'N/A';
        let paymentAccountName = 'N/A';
        if (expense.bankAccountId && expense.bankAccount) {
            paymentAccountType = 'Bank';
            paymentAccountName = expense.bankAccount.accountName;
        } else if (expense.cashAccountId && expense.cashAccount) {
            paymentAccountType = 'Cash';
            paymentAccountName = expense.cashAccount.accountName;
        } else if (expense.mobileAccountId && expense.mobileAccount) {
            paymentAccountType = 'Mobile';
            paymentAccountName = expense.mobileAccount.accountName;
        } else if (expense.otherAccountId && expense.otherAccount) {
            paymentAccountType = 'Other';
            paymentAccountName = expense.otherAccount.accountName;
        }

        doc.font('Helvetica-Bold')
            .text('Account Type:', contentX, contentY, { width: labelWidth });

        doc.font('Helvetica')
            .text(paymentAccountType, valueX, contentY, { width: cardWidth - valueX - 20 });

        contentY += 20;

        doc.font('Helvetica-Bold')
            .text('Account Name:', contentX, contentY, { width: labelWidth });

        const accountNameHeight = doc.heightOfString(paymentAccountName, { width: cardWidth - valueX - 20 });
        doc.font('Helvetica')
            .text(paymentAccountName, valueX, contentY, { width: cardWidth - valueX - 20 });

        contentY += Math.max(20, accountNameHeight + 5);

        doc.font('Helvetica-Bold')
            .text('Payment Status:', contentX, contentY, { width: labelWidth });

        doc.font('Helvetica')
            .text(expense.paymentStatus || "N/A", valueX, contentY, { width: cardWidth - valueX - 20 });

        contentY += 20;

        doc.font('Helvetica-Bold')
            .text('Amount:', contentX, contentY, { width: labelWidth });

        doc.font('Helvetica')
            .text(`${expense.currency} ${expense.totalAmountPaid.toString()}`, valueX, contentY, { width: cardWidth - valueX - 20 });

        contentY += 30;

        // Separator line
        doc.moveTo(contentX, contentY)
            .lineTo(contentX + cardWidth - 40, contentY)
            .lineWidth(1)
            .strokeColor(darkGray)
            .stroke();

        contentY += 15;

        // APPROVAL INFORMATION SECTION
        doc.fillColor(darkGray)
            .fontSize(10)
            .text('APPROVAL INFORMATION', contentX, contentY);

        contentY += 15;

        doc.font('Helvetica-Bold')
            .text('Created By:', contentX, contentY, { width: labelWidth });

        const createdByName = expense.createdByAdmin?.name || expense.createdByAccounts?.name ||
            expense.createdByStaff?.name || 'Unknown';
        const createdByHeight = doc.heightOfString(createdByName, { width: cardWidth - valueX - 20 });
        doc.font('Helvetica')
            .text(createdByName, valueX, contentY, { width: cardWidth - valueX - 20 });

        contentY += Math.max(20, createdByHeight + 5);

        doc.font('Helvetica-Bold')
            .text('Approved By:', contentX, contentY, { width: labelWidth });

        const approvedByName = expense.approvedByAdmin?.name || expense.approvedByAccounts?.name ||
            expense.approvedByStaff?.name || 'Not Approved';
        const approvedByHeight = doc.heightOfString(approvedByName, { width: cardWidth - valueX - 20 });
        doc.font('Helvetica')
            .text(approvedByName, valueX, contentY, { width: cardWidth - valueX - 20 });

        // Footer
        const footerY = cardY + 400 + 30;

        doc.fillColor(darkGray)
            .fontSize(10)
            .text(`Downloaded: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}`,
                50, footerY);

        doc.fillColor(primaryColor)
            .text('DARUBINI • Operational Expense Report', 400, footerY, { width: 150, align: 'right' });

        doc.end();

        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: "DOWNLOAD_PDF",
                entity: "OperationalExpense",
                entityId: id,
                meta: {
                    expenseName: expense.expenseName,
                    amount: expense.amount.toString(),
                    currency: expense.currency,
                    itemType: expense.itemType,
                    accountType: expense.accountType,
                    bankAccountId: expense.bankAccountId,
                    cashAccountId: expense.cashAccountId,
                    mobileAccountId: expense.mobileAccountId,
                    otherAccountId: expense.otherAccountId,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });

    } catch (error) {
        console.error("Error downloading operational expense PDF:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};