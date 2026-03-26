import { PrismaClient, Prisma, PaymentMode, PaymentStatus } from '@prisma/client';
import { Request, Response } from 'express';
import axios from 'axios';
import { generatePesapalToken } from '../middleware/utils';

const prisma = new PrismaClient();

type UserRole = 'admin' | 'accounts' | 'staff';

interface AuthUser {
    id: string;
    role: UserRole;
}

interface PesapalTransactionStatusResponse {
    payment_status: 'Completed' | 'Failed' | 'Pending' | 'Invalid';
    amount: number;
    currency: string;
}

export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ['admin', 'accounts'];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to initiate payments` });
            return;
        }

        const { amount, currency, payee, paymentMode, expenseId, accountType, accountId, transactionId } = req.body as {
            amount: number;
            currency: string;
            payee: string;
            paymentMode: PaymentMode;
            expenseId?: number;
            accountType: 'BANK' | 'CASH' | 'MOBILE' | 'OTHER';
            accountId: number;
            transactionId?: number;
        };

        // Validation
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            res.status(400).json({ message: 'Amount must be a positive number' });
            return;
        }
        if (!currency || typeof currency !== 'string' || currency.length < 3 || currency.length > 10) {
            res.status(400).json({ message: 'Currency must be a string between 3 and 10 characters' });
            return;
        }
        if (!payee || typeof payee !== 'string' || payee.length > 100) {
            res.status(400).json({ message: 'Payee must be a string, 100 characters or less' });
            return;
        }
        if (!paymentMode || !Object.values(PaymentMode).includes(paymentMode)) {
            res.status(400).json({ message: 'Invalid payment mode; must be one of MPESA_PAYBILL, BANK_DEPOSIT, VISA_CARD, CASH' });
            return;
        }
        const validAccountTypes = ['BANK', 'CASH', 'MOBILE', 'OTHER'] as const;
        type AccountType = typeof validAccountTypes[number];
        if (!accountType || !validAccountTypes.includes(accountType)) {
            res.status(400).json({ message: `Invalid account type; must be one of: ${validAccountTypes.join(', ')}` });
            return;
        }
        if (!accountId || isNaN(Number(accountId)) || Number(accountId) <= 0) {
            res.status(400).json({ message: 'Invalid account ID' });
            return;
        }
        if (expenseId && (isNaN(Number(expenseId)) || Number(expenseId) <= 0)) {
            res.status(400).json({ message: 'Invalid expense ID' });
            return;
        }
        if (transactionId && (isNaN(Number(transactionId)) || Number(transactionId) <= 0)) {
            res.status(400).json({ message: 'Invalid transaction ID' });
            return;
        }

        // Validate account based on accountType
        let account;
        if (accountType === 'BANK') {
            account = await prisma.bankAccount.findUnique({ where: { id: accountId } });
        } else if (accountType === 'CASH') {
            account = await prisma.cashAccount.findUnique({ where: { id: accountId } });
        } else if (accountType === 'MOBILE') {
            account = await prisma.mobileAccount.findUnique({ where: { id: accountId } });
        } else if (accountType === 'OTHER') {
            account = await prisma.otherAccount.findUnique({ where: { id: accountId } });
        }

        if (!account) {
            res.status(404).json({ message: `${accountType} account not found` });
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
                res.status(400).json({ message: 'Expense must be approved to initiate payment' });
                return;
            }

            if (expense.amount.toNumber() !== amount) {
                res.status(400).json({ message: 'Payment amount does not match expense amount' });
                return;
            }

            // Check if expense references the same account
            const expenseAccountIds: { [key: string]: number | null } = {
                bankAccountId: expense.bankAccountId,
                cashAccountId: expense.cashAccountId,
                mobileAccountId: expense.mobileAccountId,
                otherAccountId: expense.otherAccountId,
            };
            const accountKey = `${accountType.toLowerCase()}AccountId`;
            if (expenseAccountIds[accountKey] !== accountId) {
                res.status(400).json({ message: 'Expense must reference the same account as the payment' });
                return;
            }
        }

        const token = await generatePesapalToken();
        const paymentResponse = await axios.post(
            'https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest',
            {
                id: transactionId ? `TXN${transactionId}` : `EXP${expenseId || Date.now()}`,
                currency,
                amount,
                description: `Payment for ${expenseId ? `Expense ID ${expenseId}` : 'Operational Expense'}`,
                callback_url: `${process.env.API_BASE_URL}/payments/callback`,
                notification_id: process.env.PESAPAL_NOTIFICATION_ID,
                billing_address: { email_address: payee.includes('@') ? payee : undefined, phone_number: !payee.includes('@') ? payee : undefined },
            },
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );

        const { order_tracking_id } = paymentResponse.data;

        const transactionData: Prisma.TransactionCreateInput = {
            amount,
            currency,
            payee,
            paymentMode,
            status: 'PENDING',
            date: new Date().toISOString(),
            checkoutRequestId: order_tracking_id,
            expense: expenseId ? { connect: { id: expenseId } } : undefined,
            [`${accountType.toLowerCase()}AccountId`]: accountId,
            [role === 'admin' ? 'createdByAdmin' : 'createdByAccounts']: {
                connect: { cognitoId },
            },
        };

        const transaction = await prisma.transaction.upsert({
            where: { id: transactionId || -1 },
            update: {
                amount,
                currency,
                payee,
                paymentMode,
                status: 'PENDING',
                checkoutRequestId: order_tracking_id,
                expense: expenseId ? { connect: { id: expenseId } } : { disconnect: true },
                [`${accountType.toLowerCase()}AccountId`]: accountId,
            },
            create: transactionData,
            include: {
                expense: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
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
                action: 'INITIATE_PAYMENT',
                entity: 'Transaction',
                entityId: transaction.id.toString(),
                meta: { amount, currency, payee, paymentMode, expenseId, accountType, accountId, orderTrackingId: order_tracking_id, role, cognitoId },
                [actorField]: cognitoId,
            },
        });

         res.status(201).json({ transaction, paymentUrl: paymentResponse.data.redirect_url });
    } catch (error) {
        console.error('Error initiating payment:', {
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

export const handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const { OrderTrackingId, OrderMerchantReference, OrderStatus } = req.body as {
            OrderTrackingId: string;
            OrderMerchantReference: string;
            OrderStatus: string;
        };

        if (!OrderTrackingId) {
            res.status(400).json({ message: 'Missing OrderTrackingId' });
            return;
        }

        const transaction = await prisma.transaction.findUnique({
            where: { checkoutRequestId: OrderTrackingId },
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

        const statusMap: Record<string, PaymentStatus> = {
            Completed: PaymentStatus.PAID,
            Failed: PaymentStatus.FAILED,
            Pending: PaymentStatus.PENDING,
        };
        const paymentStatus = statusMap[OrderStatus] || PaymentStatus.PENDING;

        const updatedTransaction = await prisma.$transaction(async (tx) => {
            const transactionUpdate = await tx.transaction.update({
                where: { checkoutRequestId: OrderTrackingId },
                data: {
                    status: { set: paymentStatus },
                },
                include: {
                    expense: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });

            if (paymentStatus === PaymentStatus.PAID && transaction.expenseId) {
                await tx.operationalExpense.update({
                    where: { id: transaction.expenseId },
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

        await prisma.auditLog.create({
            data: {
                action: 'PAYMENT_WEBHOOK',
                entity: 'Transaction',
                entityId: transaction.id.toString(),
                meta: {
                    orderTrackingId: OrderTrackingId,
                    status: paymentStatus,
                    orderMerchantReference: OrderMerchantReference,
                },
                actorAdminCognitoId: 'system',
            },
        });

        res.json({ message: 'Webhook processed' });
    } catch (error) {
        console.error('Error processing payment webhook:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            body: req.body,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await prisma.$disconnect();
    }
};

export const ipnListener = async (req: Request, res: Response): Promise<void> => {
    try {
        const { OrderTrackingId, OrderMerchantReference, OrderNotificationType, ipn_id, signature } = req.body;

        // Validate IPN
        const token = await generatePesapalToken();
        const validationResponse = await axios.post(
            'https://cybqa.pesapal.com/pesapalv3/api/Transactions/ValidateIPN',
            { ipn_id, signature },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!validationResponse.data.valid) {
            res.status(400).json({ message: 'Invalid IPN signature' });
            return;
        }

        if (!OrderTrackingId || OrderNotificationType !== 'IPNCHANGE') {
            res.status(400).json({ message: 'Invalid IPN payload' });
            return;
        }

        const statusResponse = await axios.get<PesapalTransactionStatusResponse>(
            `https://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
        const { payment_status, amount, currency } = statusResponse.data;

        const transaction = await prisma.transaction.findUnique({
            where: { checkoutRequestId: OrderTrackingId },
            include: { expense: true },
        });

        if (!transaction) {
            res.status(404).json({ message: 'Transaction not found' });
            return;
        }

        const statusMap: Record<'Completed' | 'Failed' | 'Pending' | 'Invalid', PaymentStatus> = {
            Completed: 'PAID',
            Failed: 'FAILED',
            Pending: 'PENDING',
            Invalid: 'FAILED',
        };

        const dbStatus: PaymentStatus = payment_status in statusMap ? statusMap[payment_status] : 'PENDING';

        const updatedTransaction = await prisma.transaction.update({
            where: { checkoutRequestId: OrderTrackingId },
            data: { status: dbStatus, updatedAt: new Date() },
            include: { expense: true },
        });

        if (dbStatus === 'PAID' && transaction.expenseId) {
            await prisma.operationalExpense.update({
                where: { id: transaction.expenseId },
                data: {
                    paymentStatus: 'PAID',
                    totalAmountPaid: new Prisma.Decimal(transaction.amount),
                },
            });
        }

        await prisma.auditLog.create({
            data: {
                action: 'IPN_RECEIVED',
                entity: 'Transaction',
                entityId: transaction.id.toString(),
                meta: { orderTrackingId: OrderTrackingId, payment_status, amount, currency },
                actorAdminCognitoId: 'system',
            },
        });

        res.status(200).json({ message: 'IPN processed successfully' });
    } catch (error) {
        console.error('Error processing IPN:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            body: req.body,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await prisma.$disconnect();
    }
};