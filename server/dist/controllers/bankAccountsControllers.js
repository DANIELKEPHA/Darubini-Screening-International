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
exports.deleteBankAccount = exports.updateBankAccount = exports.createBankAccount = exports.getBankAccounts = void 0;
const client_1 = require("@prisma/client");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const prisma = new client_1.PrismaClient();
const getBankAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ['admin', 'accounts', 'staff'];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to view bank accounts` });
            return;
        }
        const accounts = yield prisma.bankAccount.findMany({
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
        const actorFieldMap = {
            admin: 'actorAdminCognitoId',
            accounts: 'actorAccountsCognitoId',
            staff: 'actorStaffCognitoId',
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
            data: {
                action: 'READ',
                entity: 'BankAccount',
                entityId: 'multiple',
                meta: { count: accounts.length, role, cognitoId },
                [actorField]: cognitoId,
            },
        });
        res.json({ accounts });
    }
    catch (error) {
        console.error('Error retrieving bank accounts:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: 'Internal server error' });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.getBankAccounts = getBankAccounts;
const createBankAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ['admin', 'accounts', 'staff'];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to create bank accounts` });
            return;
        }
        const { accountName, accountNumber, currency, balance = 0 } = req.body;
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
        const data = {
            accountName: (0, sanitize_html_1.default)(accountName),
            accountNumber: (0, sanitize_html_1.default)(accountNumber),
            currency: (0, sanitize_html_1.default)(currency),
            balance: new client_1.Prisma.Decimal(balance),
            [role === 'admin' ? 'createdByAdmin' : 'createdByAccounts']: {
                connect: { cognitoId },
            },
        };
        const account = yield prisma.bankAccount.create({
            data,
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                operationalExpenses: { select: { id: true, expenseName: true, amount: true } },
                transactions: { select: { id: true, amount: true, date: true, status: true } },
            },
        });
        const actorFieldMap = {
            admin: 'actorAdminCognitoId',
            accounts: 'actorAccountsCognitoId',
            staff: 'actorStaffCognitoId',
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
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
    }
    catch (error) {
        console.error('Error creating bank account:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: 'Internal server error' });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.createBankAccount = createBankAccount;
const updateBankAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const { id } = req.params;
        const idNumber = Number(id);
        const allowedRoles = ['admin', 'accounts', 'staff'];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to update bank accounts` });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: 'Invalid bank account ID' });
            return;
        }
        const { accountName, accountNumber, currency, balance } = req.body;
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
        const existingAccount = yield prisma.bankAccount.findUnique({
            where: { id: idNumber },
        });
        if (!existingAccount) {
            res.status(404).json({ message: 'Bank account not found' });
            return;
        }
        const data = {
            accountName: accountName ? (0, sanitize_html_1.default)(accountName) : undefined,
            accountNumber: accountNumber ? (0, sanitize_html_1.default)(accountNumber) : undefined,
            currency: currency ? (0, sanitize_html_1.default)(currency) : undefined,
            balance: balance !== undefined ? new client_1.Prisma.Decimal(balance) : undefined,
            updatedAt: new Date(),
        };
        const account = yield prisma.bankAccount.update({
            where: { id: idNumber },
            data,
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                operationalExpenses: { select: { id: true, expenseName: true, amount: true } },
                transactions: { select: { id: true, amount: true, date: true, status: true } },
            },
        });
        const actorFieldMap = {
            admin: 'actorAdminCognitoId',
            accounts: 'actorAccountsCognitoId',
            staff: 'actorStaffCognitoId',
        };
        const actorField = actorFieldMap[role];
        const updatedFields = Object.keys(data).filter((key) => data[key] !== undefined);
        yield prisma.auditLog.create({
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
    }
    catch (error) {
        console.error('Error updating bank account:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Bank account not found' });
            return;
        }
        res.status(500).json({ message: 'Internal server error' });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.updateBankAccount = updateBankAccount;
const deleteBankAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const { id } = req.params;
        const idNumber = Number(id);
        const allowedRoles = ['admin', 'accounts', "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to delete bank accounts` });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: 'Invalid bank account ID' });
            return;
        }
        const existingAccount = yield prisma.bankAccount.findUnique({
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
                name: ((_a = existingAccount.createdByAdmin) === null || _a === void 0 ? void 0 : _a.name) || ((_b = existingAccount.createdByAccounts) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown',
                cognitoId: existingAccount.createdByAdminCognitoId || existingAccount.createdByAccountsCognitoId || null,
            },
            createdAt: existingAccount.createdAt.toISOString(),
            updatedAt: existingAccount.updatedAt.toISOString(),
        };
        yield prisma.bankAccount.delete({
            where: { id: idNumber },
        });
        const actorFieldMap = {
            admin: 'actorAdminCognitoId',
            accounts: 'actorAccountsCognitoId',
            staff: 'actorStaffCognitoId',
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
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
    }
    catch (error) {
        console.error('Error deleting bank account:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Bank account not found' });
            return;
        }
        res.status(500).json({ message: 'Internal server error' });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.deleteBankAccount = deleteBankAccount;
