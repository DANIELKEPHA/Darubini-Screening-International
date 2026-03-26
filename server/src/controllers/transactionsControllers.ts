import { PrismaClient, Prisma, PaymentStatus } from '@prisma/client';
import { Request, Response } from 'express';
import sanitizeHtml from 'sanitize-html';

const prisma = new PrismaClient();

type UserRole = 'admin' | 'accounts' | 'staff';

interface AuthUser {
    id: string;
    role: UserRole;
}

export const getTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ['admin', 'accounts', 'staff'];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to view transactions` });
            return;
        }

        const { page = '1', limit = '10', search, cashAccountId, bankAccountId, mobileAccountId, otherAccountId } = req.query;
        const pageNumber = Number(page);
        const maxLimit = 100;
        const limitNumber = Math.min(Number(limit), maxLimit);

        if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
            console.warn('Invalid page or limit parameters:', { page, limit });
            res.status(400).json({ message: 'Invalid page or limit parameters' });
            return;
        }

        // Sanitize search input
        const sanitizedSearch = search ? sanitizeHtml(String(search)) : undefined;

        // Validate account IDs
        const cashAccountIdNum = cashAccountId ? parseInt(String(cashAccountId), 10) : undefined;
        const bankAccountIdNum = bankAccountId ? parseInt(String(bankAccountId), 10) : undefined;
        const mobileAccountIdNum = mobileAccountId ? parseInt(String(mobileAccountId), 10) : undefined;
        const otherAccountIdNum = otherAccountId ? parseInt(String(otherAccountId), 10) : undefined;

        if (cashAccountIdNum !== undefined && (isNaN(cashAccountIdNum) || cashAccountIdNum <= 0)) {
            res.status(400).json({ message: 'Invalid cash account ID' });
            return;
        }
        if (bankAccountIdNum !== undefined && (isNaN(bankAccountIdNum) || bankAccountIdNum <= 0)) {
            res.status(400).json({ message: 'Invalid bank account ID' });
            return;
        }
        if (mobileAccountIdNum !== undefined && (isNaN(mobileAccountIdNum) || mobileAccountIdNum <= 0)) {
            res.status(400).json({ message: 'Invalid mobile account ID' });
            return;
        }
        if (otherAccountIdNum !== undefined && (isNaN(otherAccountIdNum) || otherAccountIdNum <= 0)) {
            res.status(400).json({ message: 'Invalid other account ID' });
            return;
        }

        // Build the AND conditions array
        const andConditions: Prisma.TransactionWhereInput[] = [];

        if (sanitizedSearch) {
            andConditions.push({
                OR: [
                    { payee: { contains: sanitizedSearch, mode: 'insensitive' } },
                    { currency: { contains: sanitizedSearch, mode: 'insensitive' } },
                ],
            });
        }

        if (cashAccountIdNum !== undefined) {
            andConditions.push({ cashAccountId: cashAccountIdNum });
        }
        if (bankAccountIdNum !== undefined) {
            andConditions.push({ bankAccountId: bankAccountIdNum });
        }
        if (mobileAccountIdNum !== undefined) {
            andConditions.push({ mobileAccountId: mobileAccountIdNum });
        }
        if (otherAccountIdNum !== undefined) {
            andConditions.push({ otherAccountId: otherAccountIdNum });
        }

        // if (role === 'staff') {
        //     andConditions.push({
        //         OR: [
        //             { expense: { createdByStaffCognitoId: cognitoId } },
        //             { expenseId: null }, // Include transactions not linked to expenses
        //         ],
        //     });
        // }

        const where: Prisma.TransactionWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                skip: (pageNumber - 1) * limitNumber,
                take: limitNumber,
                orderBy: { createdAt: 'desc' },
                include: {
                    expense: true,
                    proofFile: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            }),
            prisma.transaction.count({ where }),
        ]);

        const actorFieldMap: Record<UserRole, string> = {
            admin: 'actorAdminCognitoId',
            accounts: 'actorAccountsCognitoId',
            staff: 'actorStaffCognitoId',
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: 'READ',
                entity: 'Transaction',
                entityId: 'multiple',
                meta: {
                    count: transactions.length,
                    page: pageNumber,
                    limit: limitNumber,
                    cashAccountId: cashAccountIdNum,
                    bankAccountId: bankAccountIdNum,
                    mobileAccountId: mobileAccountIdNum,
                    otherAccountId: otherAccountIdNum,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });

        res.json({
            transactions,
            page: pageNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
        });
    } catch (error) {
        console.error('Error retrieving transactions:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            query: req.query,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await prisma.$disconnect();
    }
};

export const reconcileTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;
        const { id } = req.params;
        const idNumber = Number(id);
        const { expenseId } = req.body as { expenseId?: number };

        const allowedRoles: UserRole[] = ['admin', 'accounts'];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to reconcile transactions` });
            return;
        }

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: 'Invalid transaction ID' });
            return;
        }

        if (expenseId !== undefined && (isNaN(expenseId) || expenseId <= 0)) {
            res.status(400).json({ message: 'Invalid expense ID' });
            return;
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id: idNumber },
            include: {
                expense: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
            },
        });

        if (!transaction) {
            res.status(404).json({ message: 'Transaction not found' });
            return;
        }

        if (expenseId) {
            const expense = await prisma.operationalExpense.findUnique({
                where: { id: expenseId },
                include: { bankAccount: true, cashAccount: true, mobileAccount: true, otherAccount: true },
            });

            if (!expense) {
                res.status(404).json({ message: 'Expense not found' });
                return;
            }

            if (expense.expenseStatus !== 'APPROVED') {
                res.status(400).json({ message: 'Expense must be approved to link with transaction' });
                return;
            }

            if (expense.amount.toNumber() !== transaction.amount.toNumber()) {
                res.status(400).json({ message: 'Transaction amount does not match expense amount' });
                return;
            }

            // Check if expense and transaction reference the same account
            const transactionAccountIds: { [key: string]: number | null } = {
                bankAccountId: transaction.bankAccountId,
                cashAccountId: transaction.cashAccountId,
                mobileAccountId: transaction.mobileAccountId,
                otherAccountId: transaction.otherAccountId,
            };
            const expenseAccountIds: { [key: string]: number | null } = {
                bankAccountId: expense.bankAccountId,
                cashAccountId: expense.cashAccountId,
                mobileAccountId: expense.mobileAccountId,
                otherAccountId: expense.otherAccountId,
            };

            const isSameAccount = Object.keys(transactionAccountIds).some(
                (key) => transactionAccountIds[key] !== null && transactionAccountIds[key] === expenseAccountIds[key]
            );
            if (!isSameAccount) {
                res.status(400).json({ message: 'Transaction and expense must reference the same account' });
                return;
            }
        }

        const updatedTransaction = await prisma.$transaction(async (tx) => {
            const transactionUpdate = await tx.transaction.update({
                where: { id: idNumber },
                data: {
                    expenseId: expenseId ? expenseId : null,
                    status: expenseId ? { set: PaymentStatus.PAID } : undefined,
                },
                include: {
                    expense: true,
                    proofFile: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });

            if (expenseId) {
                await tx.operationalExpense.update({
                    where: { id: expenseId },
                    data: {
                        paymentStatus: PaymentStatus.PAID,
                        totalAmountPaid: new Prisma.Decimal(transaction.amount),
                    },
                });

                if (transaction.bankAccountId) {
                    await tx.bankAccount.update({
                        where: { id: transaction.bankAccountId },
                        data: { balance: { decrement: transaction.amount } },
                    });
                } else if (transaction.cashAccountId) {
                    await tx.cashAccount.update({
                        where: { id: transaction.cashAccountId },
                        data: { balance: { decrement: transaction.amount } },
                    });
                } else if (transaction.mobileAccountId) {
                    await tx.mobileAccount.update({
                        where: { id: transaction.mobileAccountId },
                        data: { balance: { decrement: transaction.amount } },
                    });
                } else if (transaction.otherAccountId) {
                    await tx.otherAccount.update({
                        where: { id: transaction.otherAccountId },
                        data: { balance: { decrement: transaction.amount } },
                    });
                }
            }

            return transactionUpdate;
        });

        const actorFieldMap: Record<UserRole, string> = {
            admin: 'actorAdminCognitoId',
            accounts: 'actorAccountsCognitoId',
            staff: 'actorStaffCognitoId',
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: 'RECONCILE',
                entity: 'Transaction',
                entityId: idNumber.toString(),
                meta: {
                    expenseId,
                    amount: transaction.amount.toNumber(),
                    currency: transaction.currency,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });

        res.json(updatedTransaction);
    } catch (error) {
        console.error('Error reconciling transaction:', {
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
            res.status(404).json({ message: 'Transaction or expense not found' });
            return;
        }
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await prisma.$disconnect();
    }
};