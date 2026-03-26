import { PrismaClient, Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import sanitizeHtml from 'sanitize-html';

const prisma = new PrismaClient();

type UserRole = 'admin' | 'accounts' | 'staff';

interface AuthUser {
    id: string;
    role: UserRole;
}

export const getBankAccounts = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ['admin', 'accounts', 'staff'];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to view bank accounts` });
            return;
        }

        const accounts = await prisma.bankAccount.findMany({
            where: {
                OR: [
                    { createdByAdminCognitoId: cognitoId },
                    { createdByAccountsCognitoId: cognitoId },
                ],
            },
            orderBy: { createdAt: 'desc' },
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                operationalExpenses: { select: { id: true, expenseName: true, amount: true } },
                transactions: { select: { id: true, amount: true, date: true, status: true } },
            },
        });

        const actorFieldMap: Record<UserRole, string> = {
            admin: 'actorAdminCognitoId',
            accounts: 'actorAccountsCognitoId',
            staff: 'actorStaffCognitoId',
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: 'READ',
                entity: 'BankAccount',
                entityId: 'multiple',
                meta: { count: accounts.length, role, cognitoId },
                [actorField]: cognitoId,
            },
        });

        res.json({ accounts });
    } catch (error) {
        console.error('Error retrieving bank accounts:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await prisma.$disconnect();
    }
};

export const createBankAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ['admin', 'accounts', 'staff'];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to create bank accounts` });
            return;
        }

        const { accountName, accountNumber, currency, balance = 0 } = req.body as {
            accountName: string;
            accountNumber: string;
            currency: string;
            balance?: number;
        };

        // Validation
        if (!accountName || typeof accountName !== 'string' || accountName.length > 100) {
            res.status(400).json({ message: 'Account name must be a string, 100 characters or less' });
            return;
        }
        if (!accountNumber || typeof accountNumber !== 'string' || accountNumber.length > 50) {
            res.status(400).json({ message: 'Account number must be a string, 50 characters or less' });
            return;
        }
        if (!currency || typeof currency !== 'string' || currency.length < 3 || currency.length > 10) {
            res.status(400).json({ message: 'Currency must be a string between 3 and 10 characters' });
            return;
        }
        if (isNaN(Number(balance)) || Number(balance) < 0) {
            res.status(400).json({ message: 'Balance must be a non-negative number' });
            return;
        }

        const data: Prisma.BankAccountCreateInput = {
            accountName: sanitizeHtml(accountName),
            accountNumber: sanitizeHtml(accountNumber),
            currency: sanitizeHtml(currency),
            balance: new Prisma.Decimal(balance),
            [role === 'admin' ? 'createdByAdmin' : 'createdByAccounts']: {
                connect: { cognitoId },
            },
        };

        const account = await prisma.bankAccount.create({
            data,
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                operationalExpenses: { select: { id: true, expenseName: true, amount: true } },
                transactions: { select: { id: true, amount: true, date: true, status: true } },
            },
        });

        const actorFieldMap: Record<UserRole, string> = {
            admin: 'actorAdminCognitoId',
            accounts: 'actorAccountsCognitoId',
            staff: 'actorStaffCognitoId',
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity: 'BankAccount',
                entityId: account.id.toString(),
                meta: {
                    accountName: account.accountName,
                    accountNumber: account.accountNumber,
                    currency: account.currency,
                    balance: account.balance.toNumber(),
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });

        res.status(201).json(account);
    } catch (error) {
        console.error('Error creating bank account:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await prisma.$disconnect();
    }
};

export const updateBankAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;
        const { id } = req.params;
        const idNumber = Number(id);

        const allowedRoles: UserRole[] = ['admin', 'accounts', 'staff'];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to update bank accounts` });
            return;
        }

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: 'Invalid bank account ID' });
            return;
        }

        const { accountName, accountNumber, currency, balance } = req.body as {
            accountName?: string;
            accountNumber?: string;
            currency?: string;
            balance?: number;
        };

        // Validation
        if (accountName && (typeof accountName !== 'string' || accountName.length > 100)) {
            res.status(400).json({ message: 'Account name must be a string, 100 characters or less' });
            return;
        }
        if (accountNumber && (typeof accountNumber !== 'string' || accountNumber.length > 50)) {
            res.status(400).json({ message: 'Account number must be a string, 50 characters or less' });
            return;
        }
        if (currency && (typeof currency !== 'string' || currency.length < 3 || currency.length > 10)) {
            res.status(400).json({ message: 'Currency must be a string between 3 and 10 characters' });
            return;
        }
        if (balance !== undefined && (isNaN(Number(balance)) || Number(balance) < 0)) {
            res.status(400).json({ message: 'Balance must be a non-negative number' });
            return;
        }

        const existingAccount = await prisma.bankAccount.findUnique({
            where: { id: idNumber },
        });

        if (!existingAccount) {
            res.status(404).json({ message: 'Bank account not found' });
            return;
        }

        const data: Prisma.BankAccountUpdateInput = {
            accountName: accountName ? sanitizeHtml(accountName) : undefined,
            accountNumber: accountNumber ? sanitizeHtml(accountNumber) : undefined,
            currency: currency ? sanitizeHtml(currency) : undefined,
            balance: balance !== undefined ? new Prisma.Decimal(balance) : undefined,
            updatedAt: new Date(),
        };

        const account = await prisma.bankAccount.update({
            where: { id: idNumber },
            data,
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                operationalExpenses: { select: { id: true, expenseName: true, amount: true } },
                transactions: { select: { id: true, amount: true, date: true, status: true } },
            },
        });

        const actorFieldMap: Record<UserRole, string> = {
            admin: 'actorAdminCognitoId',
            accounts: 'actorAccountsCognitoId',
            staff: 'actorStaffCognitoId',
        };
        const actorField = actorFieldMap[role];

        const updatedFields = Object.keys(data).filter((key) => data[key as keyof typeof data] !== undefined);

        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity: 'BankAccount',
                entityId: account.id.toString(),
                meta: {
                    accountName: account.accountName,
                    accountNumber: account.accountNumber,
                    currency: account.currency,
                    balance: account.balance.toNumber(),
                    updatedFields,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });

        res.json(account);
    } catch (error) {
        console.error('Error updating bank account:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Bank account not found' });
            return;
        }
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await prisma.$disconnect();
    }
};

export const deleteBankAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;
        const { id } = req.params;
        const idNumber = Number(id);

        const allowedRoles: UserRole[] = ['admin', 'accounts', "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to delete bank accounts` });
            return;
        }

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: 'Invalid bank account ID' });
            return;
        }

        const existingAccount = await prisma.bankAccount.findUnique({
            where: { id: idNumber },
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                operationalExpenses: { select: { id: true } },
                transactions: { select: { id: true } },
            },
        });

        if (!existingAccount) {
            res.status(404).json({ message: 'Bank account not found' });
            return;
        }

        if (existingAccount.operationalExpenses.length > 0 || existingAccount.transactions.length > 0) {
            res.status(400).json({ message: 'Cannot delete account with linked expenses or transactions' });
            return;
        }

        const accountDetailsForAudit = {
            id: existingAccount.id,
            accountName: existingAccount.accountName,
            accountNumber: existingAccount.accountNumber,
            currency: existingAccount.currency,
            balance: existingAccount.balance.toString(),
            createdBy: {
                role,
                name: existingAccount.createdByAdmin?.name || existingAccount.createdByAccounts?.name || 'Unknown',
                cognitoId: existingAccount.createdByAdminCognitoId || existingAccount.createdByAccountsCognitoId || null,
            },
            createdAt: existingAccount.createdAt.toISOString(),
            updatedAt: existingAccount.updatedAt.toISOString(),
        };

        await prisma.bankAccount.delete({
            where: { id: idNumber },
        });

        const actorFieldMap: Record<UserRole, string> = {
            admin: 'actorAdminCognitoId',
            accounts: 'actorAccountsCognitoId',
            staff: 'actorStaffCognitoId',
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                entity: 'BankAccount',
                entityId: id,
                meta: {
                    accountDetails: accountDetailsForAudit,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });

        res.status(204).end();
    } catch (error) {
        console.error('Error deleting bank account:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Bank account not found' });
            return;
        }
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await prisma.$disconnect();
    }
};