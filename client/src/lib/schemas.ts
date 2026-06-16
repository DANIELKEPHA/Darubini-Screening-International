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

export const expenseFormSchema = z.object({
    expenseName: z.string().min(1),
    amount: z.number().min(0),
    kraPin: z.string()
        .regex(/^[A-Za-z0-9]{11}$/)
        .optional(),
    institutionName: z.string().min(1),
    expenseDetails: z.string().min(1).max(1000),
    reasonForPayment: z.string().optional(),
    frequency: z.enum(Object.values(Frequency) as [string, ...string[]]),
    paymentMode: z.enum(Object.values(PaymentMode) as [string, ...string[]]),
    paymentModeDescription: z.string().optional(),
    itemType: z.enum(Object.values(ItemType) as [string, ...string[]]),
    accountType: z.enum(Object.values(AccountType) as [string, ...string[]]),
    expenseStatus: z
        .enum(Object.values(ExpenseStatus) as [string, ...string[]])
        .optional(),
});

export const createExpenseSchema = expenseFormSchema.extend({
    currency: z.string(),
    date: z.string(),
    agentName: z.string(),
    paymentAccountType: z.enum(['BANK', 'CASH']),
    bankAccountId: z.number().optional(),
    cashAccountId: z.number().optional(),
}).refine(
    (data) => {
        if (data.paymentAccountType === 'BANK') {
            return !!data.bankAccountId;
        }

        if (data.paymentAccountType === 'CASH') {
            return !!data.cashAccountId;
        }

        return true;
    },
    {
        message: 'Select an account for the chosen payment type',
        path: ['paymentAccountType'],
    }
);

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;

export const settingsSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),

    idNumber: z.string().optional(),

    supervisor: z.string().optional(),
    bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),

    dateOfHire: z.string().optional(),
    contractStartDate: z.string().optional(),
    contractEndDate: z.string().optional(),
    contractType: z.enum(["Full-time", "Part-time", "Contractual", "Permanent", ""]).optional(),
    contractPeriod: z.string().optional(),
    department: z.string().optional(),

    dateOfBirth: z.string().optional(),
    gender: z.enum(["Male", "Female", "Other", ""]).optional(),
    nationality: z.string().optional(),
    language: z.string().optional(),

    profilePicture: z.any().optional(),
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
