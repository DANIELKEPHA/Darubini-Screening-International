import * as z from "zod";
import {
    AccountType,
    ClientExpense, ExpenseCheck,
    ExpenseStatus,
    Frequency,
    ItemType,
    PaymentMode, useCreateBlogMutation,
    useGetAuthUserQuery, useSaveBlogDraftMutation, useUpdateBlogMutation
} from "@/state";

export const expenseSchema = z.object({
    expenseName: z.string().min(1, 'Expense name is required'),
    amount: z.number().min(0, 'Amount must be positive'),
    currency: z.string().min(1, 'Currency is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    agentName: z.string().min(1, 'Agent name is required'),
    kraPin: z.string().regex(/^[A-Za-z0-9]{11}$/, 'KRA PIN must be 11 characters').optional(),
    institutionName: z.string().min(1, 'Institution name is required'),
    expenseDetails: z.string().min(1, 'Details are required').max(1000, 'Details must be 1000 characters or less'),
    reasonForPayment: z.string().optional(),
    frequency: z.enum(Object.values(Frequency) as [string, ...string[]]),
    paymentMode: z.enum(Object.values(PaymentMode) as [string, ...string[]]),
    paymentModeDescription: z.string().optional(),
    itemType: z.enum(Object.values(ItemType) as [string, ...string[]]),
    accountType: z.enum(Object.values(AccountType) as [string, ...string[]]),

    // Fix these two lines:
    paymentAccountType: z.enum(['BANK', 'CASH']).optional(), // Remove MOBILE/OTHER if not used
    expenseStatus: z.enum(Object.values(ExpenseStatus) as [string, ...string[]]).optional(), // Make optional

    bankAccountId: z.number().optional(),
    cashAccountId: z.number().optional(),
}).refine(
    (data) => {
        if (data.paymentAccountType === 'BANK') return !!data.bankAccountId;
        if (data.paymentAccountType === 'CASH') return !!data.cashAccountId;
        return true;
    },
    {
        message: 'Select an account for the chosen payment type',
        path: ['paymentAccountType'],
    }
);

export type ExpenseFormData = z.infer<typeof expenseSchema>;

export const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

export const NONE_VALUE = "NONE";

export const clientExpenseSchema = z.object({
    candidateName: z.string().min(1, "Candidate name is required"),
    clientListId: z.number().min(1, "Please select a client"),
    clientName: z.string().optional(),
    institutionName: z.string().min(1, "Institution name required"),
    paymentMode: z.enum(Object.values(PaymentMode) as [string, ...string[]]),
    paymentModeDescription: z.string().optional(),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    currency: z.string().min(1),
    expenseCheck: z
        .enum([...Object.values(ExpenseCheck), NONE_VALUE] as any)
        .optional()
        .transform((v) => (v === NONE_VALUE ? undefined : v)),
    totalAmountPaid: z.number().min(0.01).optional(),
});

export type ClientExpenseFormData = z.infer<typeof clientExpenseSchema>;

export const blogSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
    content: z.string().min(1, 'Content is required'),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).default([]),   // ✅ always an array
    published: z.boolean(),
    videoUrl: z.string().url().optional().or(z.literal('')),
    coverImage: z.any().optional(),
    authorId: z.number().min(1, 'Author is required'),
});


export type BlogFormData = z.infer<typeof blogSchema>;
