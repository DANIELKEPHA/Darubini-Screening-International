import {cleanParams, createNewUserInDatabase, getErrorMessage, withToast} from "@/lib/utils";
import {
    $Enums,
    Accounts,
    Admin, Author, Blog, BreakType,
    ChatMessage,
    ChatRoom,
    Contact,
    EmailCampaign,
    EmailList, GuestUser, OperationalExpense, ProofFile, Staff, Supplier,
    User, ClientList, StickyNoteShare,
} from "@/types/prismaTypes";
import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { toast } from "sonner";
import {
    AuditLog,
    BankAccount,
    CashAccount,
    CashAccountsResponse,
    Currency,
    OperationalExpenseFilters,
    PaymentMode,
    PaymentStatus,
    Transaction,
    TransactionFilters,
    TransactionsResponse,
    Attendance,
    AttendanceFilter,
    FrequentSessionsResponse,
    AttendanceSummary,
    AttendanceTrends,
    LateCheckIns,
    AutoCheckoutReport,
    BreakAnalytics,
    UserActivityStatus,
    AttendanceReportResponse, ClientExpense,
    AttendanceResponse, ClientExpenseFilters, Invoice, InvoiceItem, ClientExpensesResponse, ExpenseStatus, StickyNote,
    StickyNoteInput, DepositResponse, DailyBalanceResponse, LeaveRequest, LeaveDecision, LeaveBalance, PaginationMeta,
    LeaveLedger, LeaveBalanceResponse, LeavePolicy,
} from "@/state/types";
import ExpenseType = $Enums.ExpenseType;
import Decimal from "decimal.js";

type UserRole = "admin" | "user" | "accounts" | "staff";

const publicBaseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "",
});

export const api = createApi({

    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "",
        prepareHeaders: async (headers) => {
            try {
                const session = await fetchAuthSession();
                const { idToken } = session.tokens ?? {};
                if (idToken) {
                    headers.set("Authorization", `Bearer ${idToken.toString()}`);

                } else {
                    console.warn("fetchBaseQuery: No idToken found in session");
                }
            } catch (error) {
                console.error("fetchBaseQuery: Failed to fetch auth session:", error);
            }
            return headers;
        },
    }),
    reducerPath: "api",
    tagTypes: [
        "Admins",
        "User",
        "Accounts",
        "Staff",
        "Contacts",
        "ChatRooms",
        "ChatMessages",
        "EmailLists",
        "EmailCampaigns",
        "Blogs",
        "OperationalExpenses",
        "Suppliers",
        "ProofFiles",
        "ClientExpenses",
        "Quotations",
        "BankAccounts",
        "Transactions",
        "AuditLogs",
        "CashAccount",
        "CashAccountDailyBalance",
        "MobileAccount",
        'Authors',
        "Attendance",
        'Leave',
        'LeaveBalance',
        "LeavePolicy",
        "UserLeaveData",
        'LeaveSummary',
        "AppSettings",
        "Clients",
        "Invoices",
        "StickyNotes",
        "StickyNoteShare",
    ],
    endpoints: (build) => ({
        getAuthUser: build.query<Users | null, void>({
            queryFn: async (_, _queryApi, _extraOptions, fetchWithBQ) => {
                try {
                    const session = await fetchAuthSession();
                    const { idToken } = session.tokens ?? {};

                    if (!idToken) {
                        return { data: null };
                    }

                    const user = await getCurrentUser();
                    const userRole = idToken.payload["custom:role"] as UserRole;

                    const validRoles: UserRole[] = ["admin", "user", "accounts", "staff"];
                    if (!validRoles.includes(userRole)) {
                        throw new Error(`Invalid user role: ${userRole}`);
                    }

                    let endpoint: string;
                    switch (userRole) {
                        case "admin":
                            endpoint = `/admin/${user.userId}`;
                            break;
                        case "user":
                            endpoint = `/users/${user.userId}`;
                            break;
                        case "accounts":
                            endpoint = `/accounts/${user.userId}`;
                            break;
                        case "staff":
                            endpoint = `/staff/${user.userId}`;
                            break;
                        default:
                            throw new Error(`Unsupported user role: ${userRole}`);
                    }

                    let userDetailsResponse = await fetchWithBQ(endpoint);

                    if (userDetailsResponse.error && userDetailsResponse.error.status === 404) {
                        userDetailsResponse = await withToast(
                            createNewUserInDatabase(user, idToken, userRole, fetchWithBQ),
                            {
                                success: "User created successfully in database",
                                error: "Failed to create user in database",
                            }
                        );
                    }

                    if (userDetailsResponse.error) {
                        throw new Error(getErrorMessage(userDetailsResponse.error));
                    }

                    return {
                        data: {
                            cognitoInfo: { ...user },
                            userInfo: userDetailsResponse.data as any,
                            userRole,
                        },
                    };
                } catch (error: any) {
                    console.error("getAuthUser: Failed to fetch user data:", error);
                    return {
                        error: {
                            status: "CUSTOM_ERROR",
                            error: error.message || "Could not fetch user data",
                        },
                    };
                }
            },
            providesTags: (result) => {
                if (!result) return [];
                const userId = result.cognitoInfo.userId;
                return [{ type: result.userRole === "admin" ? "Admins" : "User", id: userId }];
            },
        }),

       getUser: build.query<User, string>({
            query: (cognitoId) => `users/${cognitoId}`,
            providesTags: (result: User | undefined) => [{ type: "User", id: result?.id }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load user profile.",
                });
            },
        }),

        getAdmin: build.query<Admin, string>({
            query: (cognitoId) => `/admin/${cognitoId}`,
            providesTags: (result) => [{ type: "Admins", id: result?.cognitoId }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load admin profile.",
                });
            },
        }),

        updateAdmin: build.mutation<
            Admin,
            {
                cognitoId: string;
                profilePicture?: File | string;
            } & Partial<Admin>
        >({
            query: ({ cognitoId, ...updatedData }) => {
                if (updatedData.profilePicture instanceof File) {
                    const formData = new FormData();

                    // Append all text fields
                    Object.entries(updatedData).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            if (value instanceof File) {
                                formData.append(key, value);
                            } else if (value instanceof Date) {
                                formData.append(key, value.toISOString());
                            } else {
                                formData.append(key, String(value));
                            }
                        }
                    });

                    return {
                        url: `/admin/${cognitoId}`,
                        method: "PUT",
                        body: formData,
                        formData: true,
                    };
                }

                // Regular JSON update
                return {
                    url: `/admin/${cognitoId}`,
                    method: "PUT",
                    body: updatedData,
                };
            },
            invalidatesTags: (result, error, { cognitoId }) => [
                { type: "Admins", id: cognitoId },
            ],
            async onQueryStarted({ cognitoId, ...updatedData }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getAdmin", cognitoId, (draft: Admin) => {
                        const { profilePicture, ...dataWithoutFile } = updatedData;
                        Object.assign(draft, dataWithoutFile);

                        if (profilePicture instanceof File) {
                            draft.profilePicture = URL.createObjectURL(profilePicture);
                        }
                    })
                );

                try {
                    await queryFulfilled;
                    toast.success("Profile updated successfully");
                } catch {
                    patchResult.undo();
                    toast.error("Failed to update profile. Changes reverted.");
                }
            },
        }),

        getUserByCognitoId: build.query<
            Accounts | Staff | Admin | User,
            { cognitoId: string; role: string }
        >({
            query: ({ cognitoId, role }) =>
                `/${role.toLowerCase()}/${cognitoId}`,

            providesTags: (result) =>
                result
                    ? [{ type: "User", id: result.cognitoId }]
                    : [{ type: "User" }],

            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load user details.",
                });
            },
        }),

        updateUser: build.mutation<
            User,
            {
                cognitoId: string;
                role: "admin" | "staff" | "accounts" | "user";
                profilePicture?: File | string;
            } & Partial<User>
        >({
            query: ({ cognitoId, role, ...data }) => {
                // HANDLE FILE UPLOAD
                if (data.profilePicture instanceof File) {
                    const formData = new FormData();

                    Object.entries(data).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            if (value instanceof File) {
                                formData.append(key, value);
                            } else {
                                formData.append(key, String(value));
                            }
                        }
                    });

                    return {
                        url: `/${role}/${cognitoId}`,
                        method: "PUT",
                        body: formData,
                        formData: true,
                    };
                }

                // NORMAL JSON UPDATE
                return {
                    url: `/${role}/${cognitoId}`,
                    method: "PUT",
                    body: data,
                };
            },

            invalidatesTags: (result, error, { cognitoId }) => [
                { type: "User", id: cognitoId },
            ],

            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                    toast.success("User updated successfully");
                } catch {
                    toast.error("Failed to update user");
                }
            },
        }),

        createAdmin: build.mutation<
            Admin,
            {
                name: string;
                email: string;
                phoneNumber?: string;
                idNumber?: string;
                supervisor?: string;
                bio?: string;
                dateOfHire?: string | Date;
                contractStartDate?: string | Date;
                contractEndDate?: string | Date;
                contractType?: string;
                contractPeriod?: string;
                department?: string;
                dateOfBirth?: string | Date;
                gender?: string;
                nationality?: string;
                language?: string;
                profilePicture?: File | string;
            }
        >({
            query: (data) => {
                if (data.profilePicture instanceof File) {
                    const formData = new FormData();

                    Object.entries(data).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            if (value instanceof File) {
                                formData.append(key, value);
                            } else if (value instanceof Date) {
                                formData.append(key, value.toISOString());
                            } else {
                                formData.append(key, String(value));
                            }
                        }
                    });

                    return {
                        url: `/admin`,
                        method: "POST",
                        body: formData,
                        formData: true,
                    };
                }

                return {
                    url: `/admin`,
                    method: "POST",
                    body: data,
                };
            },
            invalidatesTags: [{ type: "Admins", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: "Creating admin...",
                    success: "Admin created successfully",
                    error: "Failed to create admin",
                });
            },
        }),

        updateAdminSettings: build.mutation<
            Admin,
            {
                cognitoId: string;
                profilePicture?: File;
            } & Partial<Admin>
        >({
            query: ({ cognitoId, ...updatedData }) => {
                if (updatedData.profilePicture instanceof File) {
                    const formData = new FormData();

                    Object.entries(updatedData).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            if (value instanceof File) {
                                formData.append(key, value);
                            } else if (value instanceof Date) {
                                formData.append(key, value.toISOString());
                            } else {
                                formData.append(key, String(value));
                            }
                        }
                    });

                    return {
                        url: `/admin/${cognitoId}`,
                        method: "PUT",
                        body: formData,
                        formData: true,
                    };
                }

                return {
                    url: `/admin/${cognitoId}`,
                    method: "PUT",
                    body: updatedData,
                };
            },
            invalidatesTags: (result, error, { cognitoId }) => [
                { type: "Admins", id: cognitoId },
                { type: "User" },
            ],
            async onQueryStarted({ cognitoId, ...updatedData }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getAuthUser", undefined, (draft: any) => {
                        if (draft?.userInfo) {
                            const { profilePicture, ...rest } = updatedData;
                            Object.assign(draft.userInfo, rest);

                            if (profilePicture instanceof File) {
                                draft.userInfo.profilePicture = URL.createObjectURL(profilePicture);
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                    toast.success("Profile updated successfully");
                } catch {
                    patchResult.undo();
                    toast.error("Failed to update profile.");
                }
            },
        }),

        getAllUsers: build.query<any[], void>({
            query: () => "/admin/all-users",

            transformResponse: (response: any) => {
                if (Array.isArray(response)) return response;
                if (Array.isArray(response?.data)) return response.data;
                return [];
            },
        }),

        getAccounts: build.query<Accounts, string>({
            query: (cognitoId) => `/accounts/${cognitoId}`,
            providesTags: (result) => [{ type: "Accounts", id: result?.cognitoId }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load accounts profile.",
                });
            },
        }),

        createAccounts: build.mutation<
            Accounts,
            {
                name: string;
                email: string;
                phoneNumber?: string;
                idNumber?: string;
                supervisor?: string;
                bio?: string;
                dateOfHire?: string | Date;
                contractStartDate?: string | Date;
                contractEndDate?: string | Date;
                contractType?: string;
                contractPeriod?: string;
                department?: string;
                dateOfBirth?: string | Date;
                gender?: string;
                nationality?: string;
                language?: string;
                profilePicture?: File | string;
            }
        >({
            query: (data) => {
                if (data.profilePicture instanceof File) {
                    const formData = new FormData();

                    Object.entries(data).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            if (value instanceof File) {
                                formData.append(key, value);
                            } else if (value instanceof Date) {
                                formData.append(key, value.toISOString());
                            } else {
                                formData.append(key, String(value));
                            }
                        }
                    });

                    return {
                        url: `/accounts`,
                        method: "POST",
                        body: formData,
                        formData: true,
                    };
                }

                // Regular JSON
                return {
                    url: `/accounts`,
                    method: "POST",
                    body: data,
                };
            },
            invalidatesTags: [{ type: "Accounts", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: "Creating accounts user...",
                    success: "Accounts user created successfully",
                    error: "Failed to create accounts user",
                });
            },
        }),

        updateAccounts: build.mutation<
            Accounts,
            { cognitoId: string; profilePicture?: File | string } & Partial<Accounts>
        >({
            query: ({ cognitoId, ...updatedData }) => {
                if (updatedData.profilePicture instanceof File) {
                    const formData = new FormData();

                    Object.entries(updatedData).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            if (value instanceof File) {
                                formData.append(key, value);
                            } else if (value instanceof Date) {
                                formData.append(key, value.toISOString());
                            } else {
                                formData.append(key, String(value));
                            }
                        }
                    });

                    return {
                        url: `/accounts/${cognitoId}`,
                        method: "PUT",
                        body: formData,
                        formData: true,
                    };
                }

                // Regular JSON update
                return {
                    url: `/accounts/${cognitoId}`,
                    method: "PUT",
                    body: updatedData,
                };
            },
            invalidatesTags: (result, error, { cognitoId }) => [
                { type: "Accounts", id: cognitoId },
            ],
            async onQueryStarted({ cognitoId, ...updatedData }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getAccounts", cognitoId, (draft: Accounts) => {
                        const { profilePicture, ...dataWithoutFile } = updatedData;
                        Object.assign(draft, dataWithoutFile);

                        if (profilePicture instanceof File) {
                            draft.profilePicture = URL.createObjectURL(profilePicture);
                        }
                    })
                );

                try {
                    await queryFulfilled;
                    toast.success("Profile updated successfully");
                } catch {
                    patchResult.undo();
                    toast.error("Failed to update profile. Changes reverted.");
                }
            },
        }),

        updateAccountsSettings: build.mutation<
            Accounts,
            { cognitoId: string; profilePicture?: File } & Partial<Accounts>
        >({
            query: ({ cognitoId, ...updatedData }) => {
                if (updatedData.profilePicture instanceof File) {
                    const formData = new FormData();

                    Object.entries(updatedData).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            if (value instanceof File) {
                                formData.append(key, value);
                            } else if (value instanceof Date) {
                                formData.append(key, value.toISOString());
                            } else {
                                formData.append(key, String(value));
                            }
                        }
                    });

                    return {
                        url: `/accounts/${cognitoId}`,
                        method: "PUT",
                        body: formData,
                        formData: true,
                    };
                }

                return {
                    url: `/accounts/${cognitoId}`,
                    method: "PUT",
                    body: updatedData,
                };
            },
            invalidatesTags: (result, error, { cognitoId }) => [
                { type: "Accounts", id: cognitoId },
                { type: "User" },
            ],
            async onQueryStarted({ cognitoId, ...updatedData }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getAuthUser", undefined, (draft: any) => {
                        if (draft?.userInfo && draft.userRole === "ACCOUNTS") {
                            const { profilePicture, ...rest } = updatedData;
                            Object.assign(draft.userInfo, rest);

                            if (profilePicture instanceof File) {
                                draft.userInfo.profilePicture = URL.createObjectURL(profilePicture);
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                    toast.success("Accounts settings updated successfully");
                } catch {
                    patchResult.undo();
                    toast.error("Failed to update accounts settings.");
                }
            },
        }),

        getStaff: build.query<Staff, string>({
            query: (cognitoId) => `/staff/${cognitoId}`,
            providesTags: (result) => [{ type: "Staff", id: result?.cognitoId }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load staff profile.",
                });
            },
        }),

        createStaff: build.mutation<
            Staff,
            {
                name: string;
                email: string;
                phoneNumber?: string;
                idNumber?: string;
                supervisor?: string;
                bio?: string;
                dateOfHire?: string | Date;
                contractStartDate?: string | Date;
                contractEndDate?: string | Date;
                contractType?: string;
                contractPeriod?: string;
                department?: string;
                dateOfBirth?: string | Date;
                gender?: string;
                nationality?: string;
                language?: string;
                profilePicture?: File | string;
            }
        >({
            query: (data) => {
                if (data.profilePicture instanceof File) {
                    const formData = new FormData();

                    Object.entries(data).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            if (value instanceof File) {
                                formData.append(key, value);
                            } else if (value instanceof Date) {
                                formData.append(key, value.toISOString());
                            } else {
                                formData.append(key, String(value));
                            }
                        }
                    });

                    return {
                        url: `/staff`,
                        method: "POST",
                        body: formData,
                        formData: true,
                    };
                }

                // Regular JSON
                return {
                    url: `/staff`,
                    method: "POST",
                    body: data,
                };
            },
            invalidatesTags: [{ type: "Staff", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: "Creating staff user...",
                    success: "Staff user created successfully",
                    error: "Failed to create staff user",
                });
            },
        }),

        updateStaff: build.mutation<
            Staff,
            { cognitoId: string; profilePicture?: File | string } & Partial<Staff>
        >({
            query: ({ cognitoId, ...updatedData }) => {
                if (updatedData.profilePicture instanceof File) {
                    const formData = new FormData();

                    Object.entries(updatedData).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            if (value instanceof File) {
                                formData.append(key, value);
                            } else if (value instanceof Date) {
                                formData.append(key, value.toISOString());
                            } else {
                                formData.append(key, String(value));
                            }
                        }
                    });

                    return {
                        url: `/staff/${cognitoId}`,
                        method: "PUT",
                        body: formData,
                        formData: true,
                    };
                }

                // Regular JSON update
                return {
                    url: `/staff/${cognitoId}`,
                    method: "PUT",
                    body: updatedData,
                };
            },
            invalidatesTags: (result, error, { cognitoId }) => [
                { type: "Staff", id: cognitoId },
            ],
            async onQueryStarted({ cognitoId, ...updatedData }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getStaff", cognitoId, (draft: Staff) => {
                        const { profilePicture, ...dataWithoutFile } = updatedData;
                        Object.assign(draft, dataWithoutFile);

                        if (profilePicture instanceof File) {
                            draft.profilePicture = URL.createObjectURL(profilePicture);
                        }
                    })
                );

                try {
                    await queryFulfilled;
                    toast.success("Profile updated successfully");
                } catch {
                    patchResult.undo();
                    toast.error("Failed to update profile. Changes reverted.");
                }
            },
        }),

        updateStaffSettings: build.mutation<
            Staff,
            { cognitoId: string; profilePicture?: File } & Partial<Staff>
        >({
            query: ({ cognitoId, ...updatedData }) => {
                if (updatedData.profilePicture instanceof File) {
                    const formData = new FormData();

                    Object.entries(updatedData).forEach(([key, value]) => {
                        if (value !== undefined && value !== null) {
                            if (value instanceof File) {
                                formData.append(key, value);
                            } else if (value instanceof Date) {
                                formData.append(key, value.toISOString());
                            } else {
                                formData.append(key, String(value));
                            }
                        }
                    });

                    return {
                        url: `/staff/${cognitoId}`,
                        method: "PUT",
                        body: formData,
                        formData: true,
                    };
                }

                return {
                    url: `/staff/${cognitoId}`,
                    method: "PUT",
                    body: updatedData,
                };
            },
            invalidatesTags: (result, error, { cognitoId }) => [
                { type: "Staff", id: cognitoId },
                { type: "User" },
            ],
            async onQueryStarted({ cognitoId, ...updatedData }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getAuthUser", undefined, (draft: any) => {
                        if (draft?.userInfo && draft.userRole === "STAFF") {
                            const { profilePicture, ...rest } = updatedData;
                            Object.assign(draft.userInfo, rest);

                            if (profilePicture instanceof File) {
                                draft.userInfo.profilePicture = URL.createObjectURL(profilePicture);
                            }
                        }
                    })
                );

                try {
                    await queryFulfilled;
                    toast.success("Staff settings updated successfully");
                } catch {
                    patchResult.undo();
                    toast.error("Failed to update staff settings.");
                }
            },
        }),

        getChatRooms: build.query<
            { data: (ChatRoom & { guestUser?: { id: number; name: string; email: string }; user?: { name: string } })[]; page: number; limit: number; totalPages: number; total: number },
            { page?: number; limit?: number }
        >({
            query: ({ page = 1, limit = 20 }) => ({
                url: `chat`,
                params: { page, limit },
            }),
            providesTags: (result: { data: (ChatRoom & { guestUser?: { id: number; name: string; email: string }; user?: { name: string } })[] } | undefined) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: "ChatRooms" as const, id })),
                        { type: "ChatRooms", id: "LIST" },
                    ]
                    : [{ type: "ChatRooms", id: "LIST" }],
        }),

        createChatRoom: build.mutation<
            ChatRoom & { guestUser?: { id: number; name: string; email: string }; user?: { name: string } },
            { name?: string; email?: string; phone?: string }
        >({
            query: (guestInfo) => ({
                url: `chat`,
                method: "POST",
                body: guestInfo,
            }),
            invalidatesTags: [{ type: "ChatRooms", id: "LIST" }],
            async onQueryStarted(guestInfo: { name?: string; email?: string; phone?: string }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getChatRooms", { page: 1, limit: 20 }, (draft: { data: (ChatRoom & { guestUser?: { id: number; name: string; email: string }; user?: { name: string } })[]; total: number }) => {
                        draft.data.push({ id: Date.now(), ...guestInfo, guestUser: { id: Date.now(), name: guestInfo.name, email: guestInfo.email } } as any);
                        draft.total += 1;
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                    toast.error("Failed to create chat room. Reverting changes.");
                }
            },
        }),

        getChatMessages: build.query<
            { data: ChatMessage[]; page: number; limit: number; totalPages: number; total: number },
            { roomId: number; page?: number; limit?: number }
        >({
            query: ({ roomId, page = 1, limit = 50 }) => ({
                url: `chat/${roomId}/messages`,
                params: { page, limit },
            }),
            providesTags: (result: { data: ChatMessage[] } | undefined, error, arg: { roomId: number }) => [
                { type: "ChatMessages", id: arg.roomId },
            ],
        }),

        sendChatMessage: build.mutation<
            ChatMessage,
            { roomId: number; content: string }
        >({
            query: ({ roomId, content }) => ({
                url: `chat/${roomId}/messages`,
                method: "POST",
                body: { content },
            }),
            invalidatesTags: (result: ChatMessage | undefined, error, arg: { roomId: number }) => [
                { type: "ChatMessages", id: arg.roomId },
            ],
            async onQueryStarted({ roomId, content }: { roomId: number; content: string }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getChatMessages", { roomId, page: 1, limit: 50 }, (draft: { data: ChatMessage[]; total: number }) => {
                        draft.data.push({ id: Date.now(), roomId, content, senderId: "currentUser", senderType: "USER", createdAt: new Date().toISOString(), read: false } as any);
                        draft.total += 1;
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                    toast.error("Failed to send message. Reverting changes.");
                }
            },
        }),

        markChatMessageRead: build.mutation<
            ChatMessage,
            { messageId: number }
        >({
            query: ({ messageId }) => ({
                url: `chat/messages/${messageId}/read`,
                method: "GET", // Changed from PATCH to GET
            }),
            invalidatesTags: (result: ChatMessage | undefined, error, arg: { messageId: number }) => [
                { type: "ChatMessages", id: result?.roomId },
            ],
            async onQueryStarted({ messageId }: { messageId: number }, { dispatch, queryFulfilled }) {
                let roomId: number | undefined;
                const allMessages = dispatch(api.endpoints.getChatMessages.initiate({ roomId: 0, page: 1, limit: 50 }, { forceRefetch: false }));
                allMessages.unsubscribe();
                const messagesData = await allMessages;
                if (messagesData.data) {
                    const message = messagesData.data.data.find((m: ChatMessage) => m.id === messageId);
                    roomId = message?.roomId;
                }

                if (roomId) {
                    const patchResult = dispatch(
                        api.util.updateQueryData("getChatMessages", { roomId, page: 1, limit: 50 }, (draft: { data: ChatMessage[] }) => {
                            const msg = draft.data.find((m: ChatMessage) => m.id === messageId);
                            if (msg) msg.read = true;
                        })
                    );
                    try {
                        await queryFulfilled;
                    } catch {
                        patchResult.undo();
                        toast.error("Failed to mark message as read. Reverting changes.");
                    }
                } else {
                    console.warn("Could not find roomId for messageId:", messageId);
                    dispatch(api.util.invalidateTags([{ type: "ChatMessages", id: "LIST" }]));
                }
            },
        }),

        createGuestUser: build.mutation<
            { id: number },
            { name: string; email: string; phone?: string }
        >({
            query: (guestInfo) => ({
                url: `chat/guest`,
                method: "POST",
                body: guestInfo,
            }),
            invalidatesTags: ["ChatRooms"],
            async onQueryStarted(guestInfo: { name: string; email: string; phone?: string }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getChatRooms", { page: 1, limit: 20 }, (draft: { data: (ChatRoom & { guestUser?: { id: number; name: string; email: string } })[]; total: number }) => {
                        draft.data.push({ id: Date.now(), guestUser: { id: Date.now(), ...guestInfo } } as any);
                        draft.total += 1;
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                    toast.error("Failed to create guest user. Reverting changes.");
                }
            },
        }),

        markChatRoomRead: build.mutation<
            ChatRoom,
            { roomId: number; read: boolean }
        >({
            query: ({ roomId, read }) => ({
                url: `chat/${roomId}`,
                method: "PATCH",
                body: { read },
            }),
            invalidatesTags: (result: ChatRoom | undefined, error, arg: { roomId: number }) => [
                { type: "ChatRooms", id: arg.roomId },
            ],
            async onQueryStarted({ roomId, read }: { roomId: number; read: boolean }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getChatRooms", { page: 1, limit: 20 }, (draft: { data: (ChatRoom & { guestUser?: { id: number; name: string; email: string } })[] }) => {
                        const room = draft.data.find((r: ChatRoom) => r.id === roomId);
                        if (room) room.unreadMessages = read ? 0 : room.unreadMessages;
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                    toast.error("Failed to mark chat room as read. Reverting changes.");
                }
            },
        }),

        createEmailList: build.mutation<
            EmailList,
            { name: string; userIds?: number[]; guestUserIds?: number[] }
        >({
            query: (body) => ({
                url: `email/lists`,
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "EmailLists", id: "LIST" }],
            async onQueryStarted(body: { name: string; userIds?: number[]; guestUserIds?: number[] }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getEmailLists", { page: 1, limit: 10 }, (draft: EmailList[]) => {
                        draft.push({ id: Date.now(), name: body.name, users: [], guestUsers: [] } as any);
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                    toast.error("Failed to create email list. Reverting changes.");
                }
            },
        }),

        getEmailLists: build.query<
            EmailList[],
            { page?: number; limit?: number }
        >({
            query: ({ page = 1, limit = 10 }) => ({
                url: `email/lists`,
                params: cleanParams({ page: page.toString(), limit: limit.toString() }),
            }),
            providesTags: (result: EmailList[] | undefined) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: "EmailLists" as const, id })),
                        { type: "EmailLists", id: "LIST" },
                    ]
                    : [{ type: "EmailLists", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch email lists.",
                });
            },
        }),

        createEmailCampaign: build.mutation<EmailCampaign, FormData>({
            query: (formData) => ({
                url: `email/campaigns`,
                method: "POST",
                body: formData,
                headers: {
                    // Let the browser set Content-Type to multipart/form-data
                },
            }),
            invalidatesTags: [{ type: "EmailCampaigns", id: "LIST" }],
            async onQueryStarted(formData, { dispatch, queryFulfilled }) {
                const optimisticId = Date.now();
                const patchResult = dispatch(
                    api.util.updateQueryData("getCampaigns", { page: 1, limit: 10 }, (draft) => {
                        const name = formData.get("name") as string;
                        const subject = formData.get("subject") as string;
                        const htmlContent = formData.get("htmlContent") as string;
                        const emailListId = Number(formData.get("emailListId"));
                        const scheduledAt = formData.get("scheduledAt") as string | null;

                        draft.data.unshift({
                            id: optimisticId,
                            name,
                            subject,
                            htmlContent,
                            emailListId,
                            scheduledAt: scheduledAt ?? undefined,
                            status: scheduledAt ? "SCHEDULED" : "DRAFT",
                            attachments: [], // Optimistic UI starts with empty attachments
                            brevoCampaignId: 0, // Temporary
                            adminCognitoId: "",
                            emailList: {},
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        } as EmailCampaign);

                        draft.total += 1;
                    })
                );

                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                    toast.error("Failed to create email campaign. Reverting changes.");
                }
            },
        }),

        updateEmailCampaign: build.mutation<
            EmailCampaign,
            { id: number; formData: FormData }
        >({
            query: ({ id, formData }) => ({
                url: `email/campaigns/${id}`,
                method: "PUT",
                body: formData,
                headers: {
                    // Let the browser set Content-Type to multipart/form-data
                },
            }),
            invalidatesTags: (result: EmailCampaign | undefined, error, arg: { id: number }) => [
                { type: "EmailCampaigns", id: arg.id },
                { type: "EmailCampaigns", id: "LIST" },
            ],
            async onQueryStarted({ id, formData }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getCampaigns", { page: 1, limit: 10 }, (draft: { data: EmailCampaign[] }) => {
                        const campaign = draft.data.find((c) => c.id === id);
                        if (campaign) {
                            const name = formData.get("name") as string;
                            const subject = formData.get("subject") as string;
                            const htmlContent = formData.get("htmlContent") as string;
                            const emailListId = formData.get("emailListId") ? Number(formData.get("emailListId")) : undefined;
                            const scheduledAt = formData.get("scheduledAt") as string | null;

                            if (name) campaign.name = name;
                            if (subject) campaign.subject = subject;
                            if (htmlContent) campaign.htmlContent = htmlContent;
                            if (emailListId) campaign.emailListId = emailListId;
                            if (scheduledAt) {
                                campaign.scheduledAt = scheduledAt;
                                campaign.status = campaign.status !== "SENT" ? "SCHEDULED" : campaign.status;
                            }
                            // Note: Attachments are not updated optimistically due to file upload complexity
                        }
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                    toast.error("Failed to update campaign. Reverting changes.");
                }
            },
        }),

        addEmailToList: build.mutation<EmailList, { listId: number; formData: FormData }>({
            query: ({ listId, formData }) => ({
                url: `email/lists/${listId}/contacts`,
                method: "POST",
                body: formData,
                headers: {
                    // Let the browser set Content-Type to multipart/form-data
                },
            }),
            invalidatesTags: (result: EmailList | undefined, error, arg: { listId: number }) => [
                { type: "EmailLists", id: arg.listId },
                { type: "EmailLists", id: "LIST" },
            ],
            async onQueryStarted({ listId, formData }, { dispatch, queryFulfilled }) {
                const email = formData.get("email") as string | null;
                const name = formData.get("name") as string | null;
                const csvFile = formData.get("csvFile") as File | null;

                let patchResult;
                if (email && !csvFile) {
                    patchResult = dispatch(
                        api.util.updateQueryData("getEmailLists", { page: 1, limit: 10 }, (draft: EmailList[]) => {
                            const list = draft.find((l) => l.id === listId);
                            if (list) {
                                list.guestUsers = [
                                    ...(list.guestUsers || []),
                                    {
                                        id: Date.now(),
                                        email,
                                        name: name || "Unknown",
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString(),
                                    } as GuestUser,
                                ];
                            }
                        })
                    );
                }

                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        api.util.updateQueryData("getEmailLists", { page: 1, limit: 10 }, (draft: EmailList[]) => {
                            const listIndex = draft.findIndex((l) => l.id === listId);
                            if (listIndex !== -1) {
                                draft[listIndex] = data;
                            }
                        })
                    );
                    toast.success(csvFile ? "Emails added to list successfully" : "Email added to list successfully");
                } catch (error: any) {
                    if (patchResult) {
                        patchResult.undo();
                    }
                    console.error("addEmailToList error:", {
                        status: error.status,
                        data: error.data,
                        endpoint: `POST /email/lists/${listId}/contacts`, // Updated endpoint in error log
                    });
                    const errorMessage =
                        error.status === 404
                            ? "Email list endpoint not found. Please check the backend configuration."
                            : error.data?.message || "Failed to add email(s) to list";
                    toast.error(errorMessage, {
                        description: error.data?.details?.skippedEmails?.join(", "),
                    });
                }
            },
        }),

        sendEmailCampaign: build.mutation<
            { message: string },
            { id: number }
        >({
            query: ({ id }) => ({
                url: `email/campaigns/${id}/send`,
                method: "POST",
            }),
            invalidatesTags: (result: { message: string } | undefined, error, arg: { id: number }) => [
                { type: "EmailCampaigns", id: arg.id },
                { type: "EmailCampaigns", id: "LIST" },
            ],
            async onQueryStarted({ id }: { id: number }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getCampaigns", { page: 1, limit: 10 }, (draft: { data: EmailCampaign[] }) => {
                        const campaign = draft.data.find((c) => c.id === id);
                        if (campaign) campaign.status = "SENT";
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                    toast.error("Failed to send email campaign. Reverting changes.");
                }
            },
        }),

        getCampaignAnalytics: build.query<
            {
                totalSends: number;
                delivered: number;
                openRate: number;
                clickRate: number;
                bounceRate: number;
                brevoStats: any;
            },
            { id: number; range: string }
        >({
            query: ({ id, range }) => `email/campaigns/${id}/analytics?range=${range}`,
            providesTags: (result: { totalSends: number; delivered: number; openRate: number; clickRate: number; bounceRate: number; brevoStats: any } | undefined, error, arg: { id: number }) => [
                { type: "EmailCampaigns", id: arg.id },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch campaign analytics.",
                });
            },
        }),

        getAllCampaigns: build.query<EmailCampaign[], void>({
            query: () => "/email/campaigns",
            providesTags: (result: EmailCampaign[] | undefined) =>
                result
                    ? [...result.map(({ id }) => ({ type: "EmailCampaigns" as const, id })), { type: "EmailCampaigns", id: "LIST" }]
                    : [{ type: "EmailCampaigns", id: "LIST" }],
        }),

        getCampaigns: build.query<
            { data: EmailCampaign[]; page: number; limit: number; totalPages: number; total: number },
            { page?: number; limit?: number; search?: string }
        >({
            query: ({ page = 1, limit = 10, search }) => ({
                url: `email/campaigns`,
                params: cleanParams({ page: page.toString(), limit: limit.toString(), search }),
            }),
            providesTags: (result: { data: EmailCampaign[] } | undefined) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: "EmailCampaigns" as const, id })),
                        { type: "EmailCampaigns", id: "LIST" },
                    ]
                    : [{ type: "EmailCampaigns", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch email campaigns.",
                });
            },
        }),

        scheduleCampaign: build.mutation<
            EmailCampaign,
            { campaignId: number; scheduleAt: string }
        >({
            query: ({ campaignId, scheduleAt }) => ({
                url: `email/campaigns/${campaignId}/schedule`,
                method: "POST",
                body: { scheduleAt },
            }),
            invalidatesTags: (result: EmailCampaign | undefined, error, arg: { campaignId: number }) => [
                { type: "EmailCampaigns", id: arg.campaignId },
                { type: "EmailCampaigns", id: "LIST" },
            ],
            async onQueryStarted({ campaignId, scheduleAt }: { campaignId: number; scheduleAt: string }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getCampaigns", { page: 1, limit: 10 }, (draft: { data: EmailCampaign[] }) => {
                        const campaign = draft.data.find((c) => c.id === campaignId);
                        if (campaign) {
                            campaign.scheduledAt = new Date(scheduleAt);
                            campaign.status = "SCHEDULED";
                        }
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                    toast.error("Failed to schedule campaign. Reverting changes.");
                }
            },
        }),

        createContact: build.mutation<Contact, Partial<Contact>>({
            query: (body) => ({
                url: `contacts`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Contacts"],
            async onQueryStarted(body: Partial<Contact>, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getContacts", { page: 1, limit: 10 }, (draft: Contact[]) => {
                        draft.push({ id: Date.now(), ...body } as any);
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                    toast.error("Failed to create contact. Reverting changes.");
                }
            },
        }),

        getContacts: build.query<
            Contact[],
            { page?: number; limit?: number; search?: string }
        >({
            query: ({ page = 1, limit = 10, search }) => {
                const params = cleanParams({
                    page: page.toString(),
                    limit: page.toString(),
                    search,
                });
                return { url: "contacts", params };
            },
            providesTags: (result: Contact[] | undefined) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: "Contacts" as const, id })),
                        { type: "Contacts", id: "LIST" },
                    ]
                    : [{ type: "Contacts", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch contacts.",
                });
            },
        }),

        getContact: build.query<Contact, number>({
            query: (id) => `contacts/${id}`,
            providesTags: (result: Contact | undefined, error, id: number) => [{ type: "Contacts", id }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch contact details.",
                });
            },
        }),

        deleteContact: build.mutation<void, number>({
            query: (id) => ({
                url: `contacts/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Contacts"],
            async onQueryStarted(id: number, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getContacts", { page: 1, limit: 10 }, (draft: Contact[]) => {
                        const index = draft.findIndex((c) => c.id === id);
                        if (index !== -1) draft.splice(index, 1);
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                    toast.error("Failed to delete contact. Reverting changes.");
                }
            },
        }),

        getBlogs: build.query<
            { data: Blog[]; page: number; limit: number; totalPages: number; total: number },
            { page?: number; limit?: number; search?: string; published?: boolean }
        >({
            query: ({ page = 1, limit = 10, search, published }) => ({
                url: `blogs`,
                params: cleanParams({
                    page: page.toString(),
                    limit: limit.toString(),
                    search,
                    published: published !== undefined ? published.toString() : undefined,
                }),
            }),
            providesTags: (result) =>
                result?.data
                    ? [...result.data.map(({ id }) => ({ type: "Blogs" as const, id })), { type: "Blogs", id: "LIST" }]
                    : [{ type: "Blogs", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, { error: "Failed to fetch blogs." });
            },
        }),

        getPublicBlogs: build.query<
            { data: Blog[]; page: number; limit: number; totalPages: number; total: number },
            { page?: number; limit?: number; search?: string; tag?: string; authorId?: number }
        >({
            query: ({ page = 1, limit = 10, search, tag, authorId }) => ({
                url: `blogs/public`,
                params: cleanParams({
                    page: page.toString(),
                    limit: limit.toString(),
                    search,
                    tag,
                    authorId: authorId?.toString(),
                }),
            }),
            providesTags: (result) =>
                result?.data
                    ? [...result.data.map(({ id }) => ({ type: "Blogs" as const, id })), { type: "Blogs", id: "PUBLIC_LIST" }]
                    : [{ type: "Blogs", id: "PUBLIC_LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, { error: "Failed to fetch public blogs." });
            },
        }),

        getBlogBySlug: build.query<Blog, string>({
            query: (slug) => `blogs/${slug}`,
            providesTags: (result) => [{ type: "Blogs", id: result?.id }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, { error: "Failed to fetch blog." });
            },
        }),

        createBlog: build.mutation<Blog, FormData>({
            query: (formData) => ({
                url: `blogs`,
                method: "POST",
                body: formData,
            }),
            invalidatesTags: [{ type: "Blogs", id: "LIST" }, { type: "Blogs", id: "PUBLIC_LIST" }],
            async onQueryStarted(formData, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getBlogs", { page: 1, limit: 10 }, (draft) => {
                        const title = formData.get("title") as string;
                        const content = formData.get("content") as string;
                        const tags = formData.get("tags") ? JSON.parse(formData.get("tags") as string) : [];
                        const published = formData.get("published") === "true";
                        const videoUrl = formData.get("videoUrl") as string | undefined;
                        const authorId = formData.get("authorId") ? parseInt(formData.get("authorId") as string) : undefined;
                        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

                        draft.data.unshift({
                            id: Date.now(),
                            title,
                            slug,
                            content,
                            tags,
                            published,
                            videoUrl,
                            coverImage: undefined,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            adminCognitoId: "",
                            authorId,
                            author: {} as any,
                        });
                        draft.total += 1;
                    })
                );
                try {
                    const { data: newBlog } = await queryFulfilled;
                    dispatch(
                        api.util.updateQueryData("getBlogs", { page: 1, limit: 10 }, (draft) => {
                            const optimisticBlog = draft.data.find((b: Blog) => b.id === Date.now());
                            if (optimisticBlog) Object.assign(optimisticBlog, newBlog);
                        })
                    );
                    if (newBlog.published) {
                        dispatch(
                            api.util.updateQueryData("getPublicBlogs", { page: 1, limit: 10 }, (draft) => {
                                draft.data.unshift(newBlog);
                                draft.total += 1;
                            })
                        );
                    }
                } catch {
                    patchResult.undo();
                    toast.error("Failed to create blog. Reverting changes.");
                }
            },
        }),

        updateBlog: build.mutation<Blog, { id: number; formData: FormData }>({
            query: ({ id, formData }) => ({
                url: `blogs/${id}`,
                method: "PUT",
                body: formData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Blogs", id },
                { type: "Blogs", id: "LIST" },
                { type: "Blogs", id: "PUBLIC_LIST" },
            ],
            async onQueryStarted({ id, formData }, { dispatch, queryFulfilled }) {
                const slug = formData.get("slug") as string || "";
                const previousBlogResult = dispatch(
                    api.endpoints.getBlogBySlug.initiate(slug, { subscribe: false, forceRefetch: false })
                );
                const previousBlog = (await previousBlogResult).data as Blog | undefined;
                previousBlogResult.unsubscribe();

                const patchResults = [];
                patchResults.push(
                    dispatch(
                        api.util.updateQueryData("getBlogs", { page: 1, limit: 10 }, (draft) => {
                            const blog = draft.data.find((b: Blog) => b.id === id);
                            if (blog) {
                                const title = formData.get("title") as string;
                                const content = formData.get("content") as string;
                                const tags = formData.get("tags") ? JSON.parse(formData.get("tags") as string) : blog.tags;
                                const published = formData.get("published") !== null ? formData.get("published") === "true" : blog.published;
                                const videoUrl = formData.get("videoUrl") as string | undefined;
                                const authorId = formData.get("authorId") ? parseInt(formData.get("authorId") as string) : blog.authorId;

                                if (title) blog.title = title;
                                if (content) blog.content = content;
                                if (tags) blog.tags = tags;
                                if (published !== undefined) blog.published = published;
                                if (videoUrl !== undefined) blog.videoUrl = videoUrl;
                                if (authorId !== undefined) blog.authorId = authorId;
                            }
                        })
                    )
                );
                patchResults.push(
                    dispatch(
                        api.util.updateQueryData("getBlogBySlug", slug, (draft) => {
                            const title = formData.get("title") as string;
                            const content = formData.get("content") as string;
                            const tags = formData.get("tags") ? JSON.parse(formData.get("tags") as string) : draft.tags;
                            const published = formData.get("published") !== null ? formData.get("published") === "true" : draft.published;
                            const videoUrl = formData.get("videoUrl") as string | undefined;
                            const authorId = formData.get("authorId") ? parseInt(formData.get("authorId") as string) : draft.authorId;

                            if (title) draft.title = title;
                            if (content) draft.content = content;
                            if (tags) draft.tags = tags;
                            if (published !== undefined) draft.published = published;
                            if (videoUrl !== undefined) draft.videoUrl = videoUrl;
                            if (authorId !== undefined) draft.authorId = authorId;
                        })
                    )
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResults.forEach((patch) => patch.undo());
                    toast.error("Failed to update blog. Reverting changes.");
                }
            },
        }),

        deleteBlog: build.mutation<void, number>({
            query: (id) => ({
                url: `blogs/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "Blogs", id },
                { type: "Blogs", id: "LIST" },
                { type: "Blogs", id: "PUBLIC_LIST" },
            ],
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                const patchResults = [];
                patchResults.push(
                    dispatch(
                        api.util.updateQueryData("getBlogs", { page: 1, limit: 10 }, (draft) => {
                            const index = draft.data.findIndex((b: Blog) => b.id === id);
                            if (index !== -1) {
                                draft.data.splice(index, 1);
                                draft.total -= 1;
                            }
                        })
                    )
                );
                patchResults.push(
                    dispatch(
                        api.util.updateQueryData("getPublicBlogs", { page: 1, limit: 10 }, (draft) => {
                            const index = draft.data.findIndex((b: Blog) => b.id === id);
                            if (index !== -1) {
                                draft.data.splice(index, 1);
                                draft.total -= 1;
                            }
                        })
                    )
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResults.forEach((patch) => patch.undo());
                    toast.error("Failed to delete blog. Reverting changes.");
                }
            },
        }),

        publishBlog: build.mutation<Blog, { id: number; published: boolean }>({
            query: ({ id, published }) => ({
                url: `blogs/${id}/publish`,
                method: "PATCH",
                body: { published },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Blogs", id },
                { type: "Blogs", id: "LIST" },
                { type: "Blogs", id: "PUBLIC_LIST" },
            ],
            async onQueryStarted({ id, published }, { dispatch, queryFulfilled }) {
                const patchResults = [];
                patchResults.push(
                    dispatch(
                        api.util.updateQueryData("getBlogs", { page: 1, limit: 10 }, (draft) => {
                            const blog = draft.data.find((b: Blog) => b.id === id);
                            if (blog) {
                                blog.published = published;
                            }
                        })
                    )
                );
                if (published) {
                    patchResults.push(
                        dispatch(
                            api.util.updateQueryData("getPublicBlogs", { page: 1, limit: 10 }, (draft) => {
                                const blog = draft.data.find((b: Blog) => b.id === id);
                                if (!blog) {
                                    dispatch(api.endpoints.getBlogBySlug.initiate(id.toString(), { subscribe: false }))
                                        .then((result) => {
                                            if (result.data) {
                                                draft.data.unshift(result.data);
                                                draft.total += 1;
                                            }
                                        });
                                }
                            })
                        )
                    );
                } else {
                    patchResults.push(
                        dispatch(
                            api.util.updateQueryData("getPublicBlogs", { page: 1, limit: 10 }, (draft) => {
                                const index = draft.data.findIndex((b: Blog) => b.id === id);
                                if (index !== -1) {
                                    draft.data.splice(index, 1);
                                    draft.total -= 1;
                                }
                            })
                        )
                    );
                }
                try {
                    await queryFulfilled;
                } catch {
                    patchResults.forEach((patch) => patch.undo());
                    toast.error(`Failed to ${published ? 'publish' : 'unpublish'} blog. Reverting changes.`);
                }
            },
        }),

        saveBlogDraft: build.mutation<
            Blog,
            {
                id?: number;
                title?: string;
                slug?: string;
                content?: string;
                excerpt?: string;
                tags?: string;
                published?: boolean;
                videoUrl?: string;
                authorId?: number;
                coverImage?: string;
            }
        >({
            query: ({ id, ...body }) => ({
                url: id ? `blogs/${id}/draft` : `blogs/draft`,
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Blogs", id: "LIST" }],
            async onQueryStarted({ id, ...body }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getBlogs", { page: 1, limit: 10 }, (draft) => {
                        if (id) {
                            const blog = draft.data.find((b: Blog) => b.id === id);
                            if (blog) {
                                if (body.title) blog.title = body.title;
                                if (body.slug) blog.slug = body.slug;
                                if (body.content) blog.content = body.content;
                                if (body.excerpt) blog.excerpt = body.excerpt;
                                if (body.tags) blog.tags = body.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag);
                                if (body.published !== undefined) blog.published = body.published;
                                if (body.videoUrl !== undefined) blog.videoUrl = body.videoUrl;
                                if (body.authorId !== undefined) blog.authorId = body.authorId;
                            }
                        } else {
                            const title = body.title || "Untitled Draft";
                            const slug = body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                            draft.data.unshift({
                                id: Date.now(),
                                title,
                                slug,
                                content: body.content || "",
                                tags: body.tags ? body.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag) : [],
                                published: body.published ?? false,
                                videoUrl: body.videoUrl,
                                coverImage: undefined,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                adminCognitoId: "",
                                authorId: body.authorId,
                                author: {} as any,
                            });
                            draft.total += 1;
                        }
                    })
                );
                try {
                    const { data: newBlog } = await queryFulfilled;
                    dispatch(
                        api.util.updateQueryData("getBlogs", { page: 1, limit: 10 }, (draft) => {
                            if (id) {
                                const blog = draft.data.find((b: Blog) => b.id === id);
                                if (blog) Object.assign(blog, newBlog);
                            } else {
                                const optimisticBlog = draft.data.find((b: Blog) => b.id === Date.now());
                                if (optimisticBlog) Object.assign(optimisticBlog, newBlog);
                            }
                        })
                    );
                } catch {
                    patchResult.undo();
                    toast.error("Failed to save blog draft. Reverting changes.");
                }
            },
        }),

        getAuthors: build.query<Author[], void>({
            query: () => "authors",
            providesTags: ["Authors"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, { error: "Failed to fetch authors." });
            },
        }),

        getAuthorById: build.query<Author, number>({
            query: (id) => `authors/${id}`,
            providesTags: (result) => [{ type: "Authors", id: result?.id }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, { error: "Failed to fetch author details." });
            },
        }),

        getBlogsByAuthor: build.query<
            { data: Blog[]; page: number; limit: number; totalPages: number; total: number },
            { authorId: number; page?: number; limit?: number; search?: string; tag?: string }
        >({
            query: ({ authorId, page = 1, limit = 10, search, tag }) => ({
                url: `blogs/public`,
                params: cleanParams({
                    page: page.toString(),
                    limit: limit.toString(),
                    search,
                    tag,
                    authorId: authorId.toString(),
                }),
            }),
            providesTags: (result) =>
                result?.data
                    ? [...result.data.map(({ id }) => ({ type: "Blogs" as const, id })), { type: "Blogs", id: "PUBLIC_LIST" }]
                    : [{ type: "Blogs", id: "PUBLIC_LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, { error: "Failed to fetch blogs by author." });
            },
        }),

        createAuthor: build.mutation<Author, FormData>({
            query: (formData) => ({
                url: "authors",
                method: "POST",
                body: formData,
            }),
            invalidatesTags: ["Authors"],
            async onQueryStarted(formData, { dispatch, queryFulfilled }) {
                try {
                    const { data: newAuthor } = await queryFulfilled;
                    dispatch(
                        api.util.updateQueryData("getAuthors", undefined, (draft) => {
                            draft.push(newAuthor);
                        })
                    );
                    toast.success("Author created successfully");
                } catch {
                    toast.error("Failed to create author");
                }
            },
        }),

        getClientExpenses: build.query<ClientExpensesResponse, ClientExpenseFilters>({
            query: (filters) => {
                const {
                    page = 1,
                    limit = 15,
                    tab = "approved",
                    period,
                    search,
                    agentName,
                    candidateName,
                    expenseCheck,
                    paymentMode,
                    cashAccountId,
                    bankAccountId,
                    mobileAccountId,
                    otherAccountId,
                } = filters;

                return {
                    url: "client-expenses",
                    params: cleanParams({
                        page: page.toString(),
                        limit: limit.toString(),
                        tab,
                        period,
                        search,
                        agentName,
                        candidateName,
                        expenseCheck,
                        paymentMode,
                        cashAccountId: cashAccountId !== undefined ? cashAccountId.toString() : undefined,
                        bankAccountId: bankAccountId !== undefined ? bankAccountId.toString() : undefined,
                        mobileAccountId: mobileAccountId !== undefined ? mobileAccountId.toString() : undefined,
                        otherAccountId: otherAccountId !== undefined ? otherAccountId.toString() : undefined,
                    }),
                };
            },

            providesTags: (result) => {
                if (!result || !Array.isArray(result.expenses)) {
                    // Safe fallback to LIST tag only
                    return [{ type: "ClientExpenses", id: "LIST" }];
                }

                return [
                    ...result.expenses.map((expense) => ({
                        type: "ClientExpenses" as const,
                        id: expense.id,
                    })),
                    { type: "ClientExpenses", id: "LIST" },
                ];
            },

            async onQueryStarted(_arg, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch client expenses.",
                });
            },
        }),

        getClientExpense: build.query<ClientExpense, number>({
            query: (id) => `client-expenses/${id}`,
            providesTags: (_result, _error, id) => [
                { type: 'ClientExpenses', id },
                { type: 'ClientExpenses', id: 'LIST' },
            ],
            async onQueryStarted(_arg, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: 'Failed to fetch client expense.',
                });
            },
        }),

        createClientExpense: build.mutation<
            ClientExpense,
            Partial<ClientExpense> & { expenseStatus: ExpenseStatus }
        >({
            query: (body) => ({
                url: "client-expenses",
                method: "POST",
                body: {
                    ...body,
                    expenseStatus: body.expenseStatus, // DRAFT or PENDING
                },
            }),
            invalidatesTags: [{ type: "ClientExpenses", id: "LIST" }],
        }),

        updateClientExpense: build.mutation<
            ClientExpense,
            { id: number; data: Partial<ClientExpense> & { expenseStatus?: ExpenseStatus } }
        >({
            query: ({ id, data }) => ({
                url: `client-expenses/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "ClientExpenses", id },
                { type: "ClientExpenses", id: "LIST" },
            ],
        }),

        cancelClientExpense: build.mutation<ClientExpense, number>({
            query: (id) => ({
                url: `client-expenses/${id}/cancel`,
                method: "POST",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "ClientExpenses", id },
                { type: "ClientExpenses", id: "LIST" },
            ],
        }),

        reverseAndEditClientExpense: build.mutation<
            ClientExpense,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `client-expenses/${id}/reverse-and-edit`,
                method: "POST",
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "ClientExpenses", id },
                { type: "ClientExpenses", id: "LIST" },
                { type: "AuditLogs", id: "LIST" },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Expense reversed and new draft created successfully",
                    error: "Failed to reverse and edit expense",
                });
            },
        }),

        approveClientExpense: build.mutation<
            ClientExpense,
            {
                id: number;
                // Current way (Cash only)
                cashAccountId?: number;
                mobileAccountId?: number;
                // Future-proof way (when you add more)
                accountId?: number;
                accountType?: "cash" | "mobile" | "bank" | "other";
            }
        >({
            query: ({ id, cashAccountId, mobileAccountId, accountId, accountType }) => ({
                url: `client-expenses/${id}/approve`,
                method: "POST",
                body: {
                    // Old: cashAccountId → treat as cash
                    ...(cashAccountId && { accountId: cashAccountId, accountType: "cash" }),
                    // New: mobileAccountId → treat as mobile
                    ...(mobileAccountId && { accountId: mobileAccountId, accountType: "mobile" }),
                    // Future: explicit type
                    ...(accountId && accountType && { accountId, accountType }),
                },
            }),
            invalidatesTags: (_r, _e, { id }) => [
                { type: "ClientExpenses", id },
                { type: "ClientExpenses", id: "LIST" },
                { type: "CashAccount", id: "LIST" },
                { type: "MobileAccount", id: "LIST" },
            ],
        }),

        downloadClientExpensePdf: build.mutation<
            { url: string; fileName: string },
            number
        >({
            query: (id) => ({
                url: `client-expenses/${id}/download-pdf`,
                method: "GET",
                responseHandler: async (response) => {
                    if (!response.ok) {
                        const err = await response.json().catch(() => ({}));
                        throw new Error(err.message || "Failed to download PDF");
                    }
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    return { url, fileName: `client-expense-${id}.pdf` };
                },
                cache: "no-cache",
            }),
            async onQueryStarted(id, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;

                    // Auto-trigger download
                    const link = document.createElement("a");
                    link.href = data.url;
                    link.download = data.fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(data.url);

                    toast.success("PDF downloaded successfully!");
                } catch (err: any) {
                    toast.error(err?.error?.message || "Failed to download PDF");
                }
            },
        }),

        downloadClientExpensesXlsx: build.mutation<
            { url: string; fileName: string },
            ClientExpenseFilters
        >({
            query: (filters) => {
                const {
                    page = 1,
                    limit = 15,
                    tab = "approved",
                    period,
                    search,
                    agentName,
                    candidateName,
                    expenseCheck,
                    paymentMode,
                } = filters;

                return {
                    url: "client-expenses/export/xlsx",
                    method: "GET",
                    params: cleanParams({
                        page: page.toString(),
                        limit: limit.toString(),
                        tab,
                        period,
                        search,
                        agentName,
                        candidateName,
                        expenseCheck,
                        paymentMode,
                    }),
                    responseHandler: async (response) => {
                        if (!response.ok) {
                            const err = await response.json().catch(() => ({}));
                            throw new Error(err.message || "Failed to download Excel file");
                        }

                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);

                        // Generate a nice filename with current date
                        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
                        const fileName = `client-expenses-${today}.xlsx`;

                        return { url, fileName };
                    },
                    cache: "no-cache",
                };
            },

            async onQueryStarted(_arg, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;

                    // Auto-trigger download
                    const link = document.createElement("a");
                    link.href = data.url;
                    link.download = data.fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Clean up object URL
                    window.URL.revokeObjectURL(data.url);

                    toast.success("Excel file downloaded successfully!");
                } catch (err: any) {
                    toast.error(err?.error?.message || "Failed to download Excel file");
                }
            },
        }),

        rejectClientExpense: build.mutation<ClientExpense, { id: number; data: any }>({
            query: ({ id, data }) => ({
                url: `client-expenses/${id}/reject`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "ClientExpenses", id },
                { type: "ClientExpenses", id: "LIST" },
            ],
        }),

        createDraftOperationalExpense: build.mutation<
            OperationalExpense,
            Partial<OperationalExpense>
        >({
            query: (body) => ({
                url: `operational-expenses/draft`,
                method: "POST",
                body: {
                    ...body,
                    expenseStatus: "DRAFT",
                },
            }),
            invalidatesTags: [{ type: "OperationalExpenses", id: "LIST" }],
            async onQueryStarted(body, { dispatch, queryFulfilled }) {
                const optimisticId = Date.now();
                const patchResult = dispatch(
                    api.util.updateQueryData(
                        "getOperationalExpenses",
                        { page: 1, limit: 10, includeDrafts: true },
                        (draft) => {
                            draft.expenses.unshift({
                                id: optimisticId,
                                ...body,
                                amount: Number(body.amount) || 0,
                                totalAmountPaid: Number(body.totalAmountPaid) || 0,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                lpoStatus: body.lpoStatus || "DRAFT",
                                paymentStatus: "PENDING",
                                expenseStatus: "DRAFT",
                            } as OperationalExpense);
                            draft.total += 1;
                        }
                    )
                );
                try {
                    const { data: newExpense } = await queryFulfilled;
                    dispatch(
                        api.util.updateQueryData(
                            "getOperationalExpenses",
                            { page: 1, limit: 10, includeDrafts: true },
                            (draft) => {
                                const optimisticExpense = draft.expenses.find(
                                    (e: OperationalExpense) => e.id === optimisticId
                                );
                                if (optimisticExpense) Object.assign(optimisticExpense, newExpense);
                            }
                        )
                    );
                    toast.success("Draft saved successfully");
                } catch {
                    patchResult.undo();
                    toast.error("Failed to create draft operational expense. Reverting changes.");
                }
            },
        }),

        getOperationalExpenses: build.query<
            {
                expenses: OperationalExpense[];
                page: number;
                limit: number;
                totalPages: number;
                total: number;
            },
            OperationalExpenseFilters
        >({
            query: ({
                        page = 1,
                        limit = 10,
                        period,
                        agentName,
                        kraPin,
                        expenseName,
                        expenseDescription,
                        frequency,
                        paymentMode,
                        search,
                        includeDrafts,
                        cashAccountId,
                        bankAccountId,
                        mobileAccountId,
                    }) => ({
                url: `operational-expenses`,
                params: cleanParams({
                    page: page.toString(),
                    limit: limit.toString(),
                    period,
                    agentName,
                    kraPin,
                    expenseName,
                    expenseDescription,
                    frequency,
                    paymentMode,
                    search,
                    includeDrafts: includeDrafts !== undefined ? String(includeDrafts) : undefined,
                    cashAccountId: cashAccountId !== undefined ? cashAccountId.toString() : undefined,
                    bankAccountId: bankAccountId !== undefined ? bankAccountId.toString() : undefined,
                    mobileAccountId: mobileAccountId !== undefined ? mobileAccountId.toString() : undefined,
                }),
            }),
            providesTags: (result) =>
                result?.expenses
                    ? [
                        ...result.expenses.map(({ id }) => ({
                            type: "OperationalExpenses" as const,
                            id,
                        })),
                        { type: "OperationalExpenses", id: "LIST" },
                    ]
                    : [{ type: "OperationalExpenses", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch operational expenses.",
                });
            },
        }),
       
        getOperationalExpense: build.query<OperationalExpense, number>({
            query: (id) => `operational-expenses/${id}`,
            providesTags: (result: OperationalExpense | undefined) => [
                { type: "OperationalExpenses", id: result?.id },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch operational expense.",
                });
            },
        }),

        createOperationalExpense: build.mutation<
            OperationalExpense,
            Partial<OperationalExpense> & { isDraft?: boolean }
        >({
            query: (body) => ({
                url: `operational-expenses`,
                method: 'POST',
                body: {
                    ...body,
                    expenseStatus: body.isDraft ? 'DRAFT' : 'PENDING',
                },
            }),
            invalidatesTags: [{ type: 'OperationalExpenses', id: 'LIST' }],
            async onQueryStarted(body, { dispatch, queryFulfilled }) {
                const optimisticId = Date.now();
                const patchResult = dispatch(
                    api.util.updateQueryData(
                        'getOperationalExpenses',
                        { page: 1, limit: 10, includeDrafts: body.isDraft ?? false },
                        (draft) => {
                            draft.expenses.unshift({
                                id: optimisticId,
                                ...body,
                                amount: Number(body.amount) || 0,
                                totalAmountPaid: Number(body.totalAmountPaid) || 0,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                lpoStatus: body.lpoStatus || 'DRAFT',
                                paymentStatus: 'PENDING',
                                expenseStatus: body.isDraft ? 'DRAFT' : 'PENDING',
                                itemType: body.itemType,
                                accountType: body.accountType,
                            } as OperationalExpense);
                            draft.total += 1;
                        }
                    )
                );
                try {
                    const { data: newExpense } = await queryFulfilled;
                    dispatch(
                        api.util.updateQueryData(
                            'getOperationalExpenses',
                            { page: 1, limit: 10, includeDrafts: body.isDraft ?? false},
                            (draft) => {
                                const optimisticExpense = draft.expenses.find(
                                    (e: OperationalExpense) => e.id === optimisticId
                                );
                                if (optimisticExpense) Object.assign(optimisticExpense, newExpense);
                            }
                        )
                    );
                    toast.success('Expense created successfully');
                } catch {
                    patchResult.undo();
                    toast.error('Failed to create operational expense');
                }
            },
        }),

        updateOperationalExpense: build.mutation<
            OperationalExpense,
            { id: number; data: Partial<OperationalExpense> & { isDraft?: boolean } }
        >({
            query: ({ id, data }) => ({
                url: `operational-expenses/${id}`,
                method: 'PUT',
                body: {
                    ...data,
                    expenseStatus:
                        data.isDraft !== undefined
                            ? data.isDraft
                                ? 'DRAFT'
                                : 'PENDING'
                            : data.expenseStatus,
                },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'OperationalExpenses', id },
                { type: 'OperationalExpenses', id: 'LIST' },
            ],
            async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData(
                        'getOperationalExpenses',
                        {
                            page: 1,
                            limit: 10,
                            includeDrafts: data.isDraft || data.expenseStatus === 'DRAFT',
                        },
                        (draft) => {
                            const expense = draft.expenses.find(
                                (e: OperationalExpense) => e.id === id
                            );
                            if (expense) {
                                Object.assign(expense, {
                                    ...data,
                                    amount:
                                        data.amount != null
                                            ? Number(data.amount)
                                            : expense.amount,
                                    totalAmountPaid:
                                        data.totalAmountPaid != null
                                            ? Number(data.totalAmountPaid)
                                            : expense.totalAmountPaid,
                                    expenseStatus:
                                        data.isDraft !== undefined
                                            ? data.isDraft
                                                ? 'DRAFT'
                                                : 'PENDING'
                                            : data.expenseStatus ||
                                            expense.expenseStatus,
                                    itemType: data.itemType,
                                    accountType: data.accountType,
                                });
                            }
                        }
                    )
                );
                try {
                    await queryFulfilled;
                    toast.success('Expense updated successfully');
                } catch {
                    patchResult.undo();
                    toast.error('Failed to update operational expense');
                }
            },
        }),

        reverseOperationalExpense: build.mutation<OperationalExpense, number>({
            query: (id) => ({
                url: `operational-expenses/${id}/reverse`,
                method: "POST",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "OperationalExpenses", id },
                { type: "OperationalExpenses", id: "LIST" },
            ],
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData(
                        "getOperationalExpenses",
                        { page: 1, limit: 10, includeDrafts: false },
                        (draft) => {
                            const expense = draft.expenses.find(
                                (e: OperationalExpense) => e.id === id
                            );
                            if (expense) {
                                expense.expenseStatus = "CANCELLED";
                            }
                        }
                    )
                );
                try {
                    await queryFulfilled;
                    toast.success("Expense reversed successfully");
                } catch (error: any) {
                    patchResult.undo();
                    console.error("Reverse expense error:", {
                        status: error.status,
                        data: error.data,
                        endpoint: `POST /operational-expenses/${id}/reverse`,
                    });
                    toast.error(error.data?.message || "Failed to reverse expense");
                }
            },
        }),

        reverseAndEditOperationalExpense: build.mutation<
            OperationalExpense,
            { id: number }
        >({
            query: ({ id }) => ({
                url: `operational-expenses/${id}/reverse-and-edit`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'OperationalExpenses', id },
                { type: 'OperationalExpenses', id: 'LIST' },
                { type: 'AuditLogs', id: 'LIST' },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: 'Expense reversed and new draft created successfully',
                    error: 'Failed to reverse and edit expense',
                });
            },
        }),

        sendToAccountsOperationalExpense: build.mutation<void, number>({
            query: (id) => ({
                url: `operational-expenses/${id}/send-to-accounts`,
                method: "POST",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "OperationalExpenses", id },
                { type: "OperationalExpenses", id: "LIST" },
            ],
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData(
                        "getOperationalExpenses",
                        { page: 1, limit: 10, includeDrafts: true },
                        (draft) => {
                            const expense = draft.expenses.find(
                                (e: OperationalExpense) => e.id === id
                            );
                            if (expense) {
                                expense.expenseStatus = "PENDING";
                            }
                        }
                    )
                );
                try {
                    await queryFulfilled;
                    toast.success("Expense sent to accounts successfully");
                } catch (error: any) {
                    patchResult.undo();
                    console.error("Send to accounts error:", {
                        status: error.status,
                        data: error.data,
                        endpoint: `POST /operational-expenses/${id}/send-to-accounts`,
                    });
                    toast.error(error.data?.message || "Failed to send expense to accounts");
                }
            },
        }),

        deleteOperationalExpense: build.mutation<void, number>({
            query: (id) => ({
                url: `operational-expenses/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "OperationalExpenses", id },
                { type: "OperationalExpenses", id: "LIST" },
            ],
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData(
                        "getOperationalExpenses",
                        { page: 1, limit: 10, includeDrafts: true },
                        (draft) => {
                            const index = draft.expenses.findIndex(
                                (e: OperationalExpense) => e.id === id
                            );
                            if (index !== -1) {
                                draft.expenses.splice(index, 1);
                                draft.total -= 1;
                            }
                        }
                    )
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                    toast.error("Failed to delete operational expense. Reverting changes.");
                }
            },
        }),

        approveOperationalExpense: build.mutation<
            OperationalExpense,
            { id: number; data: { bankAccountId?: number; cashAccountId?: number; mobileAccountId?: number; otherAccountId?: number } }
        >({
            query: ({ id, data }) => ({
                url: `operational-expenses/${id}/approve`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "OperationalExpenses", id },
                { type: "OperationalExpenses", id: "LIST" },
            ],
            async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData(
                        "getOperationalExpenses",
                        { page: 1, limit: 10, includeDrafts: false },
                        (draft) => {
                            const expense = draft.expenses.find((e: OperationalExpense) => e.id === id);
                            if (expense) {
                                expense.paymentStatus = "PAID";
                                expense.expenseStatus = "APPROVED";
                            }
                        }
                    )
                );
                try {
                    await queryFulfilled;
                } catch (error: any) {
                    patchResult.undo();
                    console.error("Approve expense error:", {
                        status: error.status,
                        data: error.data,
                        endpoint: `POST /operational-expenses/${id}/approve`,
                    });
                    toast.error(error.data?.message || "Failed to approve operational expense. Reverting changes.");
                }
            },
        }),

        downloadOperationalExpensePdf: build.mutation<{ url: string; fileName: string }, number>({
            query: (id) => ({
                url: `operational-expenses/${id}/download-pdf`,
                method: 'GET',
                responseHandler: async (response) => {
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to download Operational Expense PDF');
                    }
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    return { url, fileName: `expense-${id}.pdf` };
                },
                cache: 'no-cache',
            }),
            async onQueryStarted(id, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: 'PDF downloaded successfully',
                    error: (error: any) => error.message || 'Failed to download Operational Expense PDF',
                });
            },
        }),

        getCashAccounts: build.query<CashAccountsResponse, { page?: number; limit?: number }>({
            query: ({ page = 1, limit = 10 }) => ({
                url: 'cash-accounts',
                params: cleanParams({
                    page: page.toString(),
                    limit: limit.toString(),
                }),
            }),
            providesTags: (result) =>
                result?.accounts
                    ? [
                        ...result.accounts.map(({ id }) => ({ type: 'CashAccount' as const, id })),
                        { type: 'CashAccount', id: 'LIST' },
                    ]
                    : [{ type: 'CashAccount', id: 'LIST' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: 'Failed to fetch cash accounts',
                });
            },
            transformErrorResponse: (response) => {
                console.error('getCashAccounts API Error:', response);
                return response;
            },
        }),

        getCashAccount: build.query<CashAccount, number>({
            query: (id) => `cash-accounts/${id}`,
            providesTags: (result) => (result ? [{ type: 'CashAccount', id: result.id }] : []),
            async onQueryStarted(_, { queryFulfilled }) {
                await queryFulfilled;
            },
        }),

        createCashAccount: build.mutation<
            CashAccount,
            {
                name: string;
                currency: string;
                balance: number;
                accountNumber?: string;
                description?: string;
            }
        >({
            query: (body) => ({
                url: "cash-accounts",
                method: "POST",
                body,
            }),

            invalidatesTags: [{ type: "CashAccount", id: "LIST" }],

            async onQueryStarted(body, { dispatch, queryFulfilled }) {
                const optimisticId = -Date.now();

                // 🔵 Optimistic Update - Now includes ALL required fields from new interface
                const patchResult = dispatch(
                    api.util.updateQueryData(
                        "getCashAccounts",
                        { page: 1, limit: 10 },
                        (draft: { accounts: CashAccount[]; total: number; page: number; limit: number; totalPages: number }) => {
                            draft.accounts.unshift({
                                id: optimisticId,
                                accountName: body.name,
                                accountNumber: body.accountNumber || `CASH-${Date.now()}`,
                                currency: body.currency,
                                balance: body.balance.toString(),
                                description: body.description || null,

                                // === NEW ENTERPRISE FIELDS (Required by updated interface) ===
                                status: "ACTIVE",
                                isActive: true,
                                closedAt: null,
                                closedByAdminCognitoId: null,
                                closedByAccountsCognitoId: null,
                                closureReason: null,
                                closureNotes: null,

                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),

                                // Optional relation fields
                                createdByAdmin: undefined,
                                createdByAccounts: undefined,

                                // Optional computed fields
                                transactionCount: 0,
                                lastTransactionDate: null,
                            });
                            draft.total += 1;
                            draft.totalPages = Math.ceil(draft.total / draft.limit);
                        }
                    )
                );

                try {
                    const { data } = await queryFulfilled;

                    // 🟢 Replace optimistic item with real data from server
                    dispatch(
                        api.util.updateQueryData(
                            "getCashAccounts",
                            { page: 1, limit: 10 },
                            (draft) => {
                                const index = draft.accounts.findIndex((a) => a.id === optimisticId);
                                if (index !== -1 && data) {
                                    draft.accounts[index] = {
                                        ...data,
                                        // Ensure balance is string
                                        balance: data.balance?.toString() ?? body.balance.toString(),
                                        // Ensure all new fields exist (safety)
                                        status: data.status ?? "ACTIVE",
                                        isActive: data.isActive ?? true,
                                        closedAt: data.closedAt ?? null,
                                        closedByAdminCognitoId: data.closedByAdminCognitoId ?? null,
                                        closedByAccountsCognitoId: data.closedByAccountsCognitoId ?? null,
                                        closureReason: data.closureReason ?? null,
                                        closureNotes: data.closureNotes ?? null,
                                    };
                                }
                            }
                        )
                    );

                    toast.success("Cash account created successfully");
                } catch (error: any) {
                    // 🔴 Rollback optimistic update
                    patchResult.undo();

                    console.error("Create cash account failed:", {
                        fullError: error,
                        data: error?.data,
                        message: error?.data?.message || error?.error || error?.message,
                        status: error?.status,
                        body,
                    });

                    toast.error(error?.data?.message || "Failed to create cash account");
                }
            },
        }),

        updateCashAccount: build.mutation<
            CashAccount,
            { id: number; name?: string; currency?: string; accountNumber?: string; /* balance?: never - not allowed */ }
        >({
            query: ({ id, ...body }) => ({
                url: `cash-accounts/${id}`,
                method: "PUT",
                body,
            }),

            invalidatesTags: (result, error, { id }) => [
                { type: "CashAccount", id },        // single account
                { type: "CashAccount", id: "LIST" }, // list view
            ],

            async onQueryStarted({ id, ...body }, { dispatch, queryFulfilled }) {
                // 1. Optimistic update in the list
                const patchResult = dispatch(
                    api.util.updateQueryData(
                        "getCashAccounts",
                        { page: 1, limit: 10 },
                        (draft: { accounts: CashAccount[] }) => {
                            const account = draft.accounts.find((a) => a.id === id);
                            if (account) {
                                if (body.name) account.accountName = body.name;
                                if (body.currency) account.currency = body.currency;
                                if (body.accountNumber) account.accountNumber = body.accountNumber;
                                account.updatedAt = new Date().toISOString();
                                // Note: balance is NOT updated here because backend forbids direct edits
                            }
                        }
                    )
                );

                try {
                    const { data } = await queryFulfilled;

                    // 2. Update with real server data
                    dispatch(
                        api.util.updateQueryData(
                            "getCashAccounts",
                            { page: 1, limit: 10 },
                            (draft) => {
                                const account = draft.accounts.find((a) => a.id === id);
                                if (account && data) {
                                    Object.assign(account, {
                                        ...data,
                                        accountName: data.accountName ?? account.accountName,
                                        currency: data.currency ?? account.currency,
                                        accountNumber: data.accountNumber ?? account.accountNumber,
                                        updatedAt: data.updatedAt ?? account.updatedAt,
                                        // balance should come from server (though it shouldn't change)
                                        balance: data.balance?.toString() ?? account.balance,
                                    });
                                }
                            }
                        )
                    );

                    toast.success("Cash account updated successfully");
                } catch (error: any) {
                    patchResult.undo();

                    console.error("Update cash account failed:", {
                        error: error?.data?.message || error.message,
                        status: error?.status,
                        id,
                        body,
                    });

                    toast.error(error?.data?.message || "Failed to update cash account");
                }
            },
        }),

        depositToCashAccount: build.mutation<
            DepositResponse,
            {
                id: number;
                amount: number;
                description?: string;
                payee?: string;
                paymentMode?: string;
                date?: string;
                proofFileId?: number;
            }
        >({
            // The actual HTTP request
            query: ({ id, ...body }) => ({
                url: `cash-accounts/${id}/deposit`,
                method: 'POST',
                body,
            }),

            // Invalidate cache tags so related queries automatically refetch
            invalidatesTags: (result, error, arg) => [
                // Single account detail view
                { type: 'CashAccount', id: arg.id },

                // The paginated list of cash accounts (balance changed)
                { type: 'CashAccount', id: 'LIST' },

                // Optional – if you later have a daily balances or transactions query
                // { type: 'CashAccountDailyBalance', id: arg.id },
                // { type: 'Transaction', id: 'LIST' },
            ],

            // Optimistic update – show the new balance immediately before server responds
            async onQueryStarted(
                { id, amount },
                { dispatch, queryFulfilled }
            ) {

                const patchSingleResult = dispatch(
                    api.util.updateQueryData(
                        'getCashAccount',
                        id, // ✅ pass the number directly
                        (draft: CashAccount) => {
                            if (draft) {
                                const currentBalance = new Decimal(draft.balance || '0');
                                draft.balance = currentBalance.add(amount).toString();
                                draft.updatedAt = new Date().toISOString();
                            }
                        }
                    )
                );

                const patchListResult = dispatch(
                    api.util.updateQueryData(
                        'getCashAccounts',
                        // Use the same parameters your list query uses
                        // Adjust page/limit if your app uses different defaults
                        { page: 1, limit: 10 },
                        (draft: { accounts: CashAccount[]; total: number; page: number; limit: number; totalPages: number }) => {
                            const account = draft.accounts?.find((a) => a.id === id);
                            if (account) {
                                const currentBalance = new Decimal(account.balance || '0');
                                account.balance = currentBalance.add(amount).toString();
                                account.updatedAt = new Date().toISOString();
                            }
                        }
                    )
                );

                try {
                    // Wait for the real server response
                    await queryFulfilled;
                    // If successful → tags will be invalidated automatically and fresh data fetched
                } catch {
                    // Rollback optimistic updates if request fails
                    patchSingleResult.undo();
                    patchListResult.undo();
                }
            },

            // Optional: transform the response if you want to do extra processing
            // (usually not needed here)
            transformResponse: (response: DepositResponse) => response,
        }),

        closeCashAccount: build.mutation<
            any,
            { id: number; reason: string; notes?: string }
        >({
            query: ({ id, reason, notes }) => ({
                url: `cash-accounts/${id}/close`,
                method: "POST",
                body: { reason, notes },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "CashAccount", id },
                { type: "CashAccount", id: "LIST" },
            ],
            async onQueryStarted({ id, reason }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getCashAccounts", { page: 1, limit: 10 }, (draft) => {
                        const account = draft.accounts.find((a: any) => a.id === id);
                        if (account) {
                            account.status = "CLOSED";
                            account.isActive = false;
                            account.closedAt = new Date().toISOString();
                            account.closureReason = reason;
                        }
                    })
                );

                try {
                    await queryFulfilled;
                    toast.success("Cash account closed successfully");
                } catch (error: any) {
                    patchResult.undo();
                    console.error("Close cash account error:", {
                        status: error.status,
                        data: error.data,
                        endpoint: `POST /cash-accounts/${id}/close`,
                    });
                    toast.error(error.data?.message || "Failed to close cash account");
                }
            },
        }),

        deleteCashAccount: build.mutation<void, { id: number; reason: string }>({
            query: ({ id, reason }) => ({
                url: `cash-accounts/${id}`,
                method: "DELETE",
                body: { reason },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "CashAccount", id },
                { type: "CashAccount", id: "LIST" },
            ],
            async onQueryStarted({ id, reason }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData("getCashAccounts", { page: 1, limit: 10 }, (draft) => {
                        const index = draft.accounts.findIndex((a: any) => a.id === id);
                        if (index !== -1) {
                            draft.accounts.splice(index, 1);
                            draft.total -= 1;
                            draft.totalPages = Math.ceil(draft.total / draft.limit);
                        }
                    })
                );

                try {
                    await queryFulfilled;
                    toast.success("Cash account permanently deleted");
                } catch (error: any) {
                    patchResult.undo();
                    console.error("Permanent delete cash account error:", {
                        status: error.status,
                        data: error.data,
                        endpoint: `DELETE /cash-accounts/${id}`,
                    });
                    toast.error(error.data?.message || "Failed to permanently delete cash account");
                }
            },
        }),

        getDailyBalance: build.query<DailyBalanceResponse, { accountId: number; date?: string }>({
            query: ({ accountId, date }) => ({
                url: `cash-accounts/${accountId}/daily-balance`,
                params: date ? { date } : undefined,
            }),
            providesTags: (result, error, { accountId }) => [
                { type: 'CashAccountDailyBalance', id: accountId },
            ],
        }),

        getSuppliers: build.query<Supplier[], void>({
            query: () => "suppliers",
            providesTags: ["Suppliers"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch suppliers.",
                });
            },
        }),

        createSupplier: build.mutation<Supplier, { name: string; email?: string }>({
            query: (body) => ({
                url: "suppliers",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Suppliers"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: "Creating supplier...",
                    success: "Supplier created successfully",
                    error: "Failed to create supplier.",
                });
            },
        }),

        updateSupplier: build.mutation<Supplier, { id: number; name: string; email?: string | null; contactPerson?: string | null; phone?: string | null; address?: string | null; kraPin?: string | null }>({
            query: ({ id, ...body }) => ({
                url: `suppliers/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Suppliers"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: "Updating supplier...",
                    success: "Supplier updated successfully",
                    error: "Failed to update supplier.",
                });
            },
        }),

        getBankAccounts: build.query<BankAccount[], { page: number; limit: number }>({
            query: ({ page, limit }) => `banks-accounts?page=${page}&limit=${limit}`,
            transformResponse: (response: { accounts: BankAccount[] }) => response.accounts || [],
            providesTags: (result, error) => {
                if (error) {
                    console.error('getBankAccounts error:', { status: error.status, data: error.data });
                    return [{ type: 'BankAccounts', id: 'LIST' }];
                }
                if (!Array.isArray(result)) {
                    console.error('getBankAccounts: result is not an array:', result);
                    return [{ type: 'BankAccounts', id: 'LIST' }];
                }
                return [
                    ...result.map(({ id }) => ({ type: 'BankAccounts' as const, id })),
                    { type: 'BankAccounts', id: 'LIST' },
                ];
            },
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, { error: 'Failed to fetch banks accounts' });
            },
        }),

        createBankAccount: build.mutation<BankAccount, Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt' | 'createdByAdmin' | 'createdByAccounts'>>({
            query: (body) => ({
                url: 'bank-accounts',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'BankAccounts', id: 'LIST' }],
        }),

        updateBankAccount: build.mutation<BankAccount, { id: number } & Partial<BankAccount>>({
            query: ({ id, ...body }) => ({
                url: `bank-accounts/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'BankAccounts', id }, { type: 'BankAccounts', id: 'LIST' }],
        }),

        getTransactions: build.query<TransactionsResponse, TransactionFilters>({
            query: (params) => ({
                url: 'transactions',
                params: params ? Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null)) : undefined,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.transactions.map(({ id }) => ({ type: 'Transactions' as const, id })),
                        { type: 'Transactions', id: 'LIST' },
                    ]
                    : [{ type: 'Transactions', id: 'LIST' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, { error: 'Failed to fetch transactions' });
            },
        }),

        initiatePayment: build.mutation<
            { transaction: Transaction; paymentUrl: string },
            {
                amount: number;
                currency: string;
                payee: string;
                paymentMode: 'BANK_DEPOSIT' | 'VISA_CARD';
                expenseId?: number;
                bankAccountId: number;
                transactionId?: number;
                callback_url?: string;
                notification_id?: string;
            }
        >({
            query: (body) => ({
                url: 'payments',
                method: 'POST',
                body,
            }),
            invalidatesTags: [
                { type: 'Transactions', id: 'LIST' },
                { type: 'OperationalExpenses', id: 'LIST' },
                { type: 'BankAccounts', id: 'LIST' },
            ],
            async onQueryStarted(body, { dispatch, queryFulfilled }) {
                const optimisticId = body.transactionId || Date.now();
                const patchResult = dispatch(
                    api.util.updateQueryData('getTransactions', { page: 1, limit: 10 }, (draft) => {
                        draft.transactions.unshift({
                            id: optimisticId,
                            amount: body.amount.toString(), // Convert number to string
                            currency: body.currency,
                            payee: body.payee,
                            status: 'PENDING',
                            date: new Date().toISOString(),
                            expenseId: body.expenseId,
                            bankAccountId: body.bankAccountId,
                            checkoutRequestId: `TEMP_${optimisticId}`,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            paymentMode: body.paymentMode,
                            expense: null,
                            proofFile: null,
                            bankAccount: null,
                        } as Transaction);
                        draft.totalPages = Math.ceil((draft.transactions.length + 1) / 10);
                    })
                );
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        api.util.updateQueryData('getTransactions', { page: 1, limit: 10 }, (draft) => {
                            const optimisticTransaction = draft.transactions.find((t: Transaction) => t.id === optimisticId);
                            if (optimisticTransaction) {
                                // Ensure the API response amount is a string
                                const updatedTransaction = {
                                    ...data.transaction,
                                    amount: data.transaction.amount.toString(), // Convert API response amount to string
                                };
                                Object.assign(optimisticTransaction, updatedTransaction);
                            }
                        })
                    );
                    if (body.expenseId) {
                        dispatch(
                            api.util.updateQueryData('getOperationalExpenses',
                                { page: 1, limit: 10, includeDrafts: false }, (draft) => {
                                const expense = draft.expenses.find((e: OperationalExpense) => e.id === body.expenseId);
                                if (expense) {
                                    expense.paymentStatus = 'PENDING';
                                }
                            })
                        );
                    }
                    dispatch(
                        api.util.updateQueryData('getBankAccounts', { page: 1, limit: 10 }, (draft) => {
                            const account = draft.find((a: BankAccount) => a.id === body.bankAccountId);
                            if (account) {
                                account.balance = (Number(account.balance) - body.amount).toString();
                            }
                        })
                    );

                } catch (error: any) {
                    patchResult.undo();
                    toast.error(error.data?.message || 'Failed to initiate payment');
                }
            },
        }),

        reconcileTransaction: build.mutation<
            Transaction,
            { id: number; expenseId?: number }
        >({
            query: ({ id, expenseId }) => ({
                url: `transactions/${id}/reconcile`,
                method: "POST",
                body: { expenseId },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Transactions", id },
                { type: "Transactions", id: "LIST" },
                { type: "OperationalExpenses", id: "LIST" },
            ],
            async onQueryStarted({ id, expenseId }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData(
                        "getTransactions",
                        { page: 1, limit: 10 },
                        (draft) => {
                            const transaction = draft.transactions.find(
                                (t: Transaction) => t.id === id
                            );
                            if (transaction) {
                                if (expenseId) {
                                    transaction.expenseId = expenseId;
                                    transaction.status = PaymentStatus.PAID;
                                } else {
                                    transaction.expenseId = null;
                                }
                            }
                        }
                    )
                );
                try {
                    const { data: updatedTransaction } = await queryFulfilled;
                    dispatch(
                        api.util.updateQueryData(
                            "getTransactions",
                            { page: 1, limit: 10 },
                            (draft) => {
                                const transaction = draft.transactions.find((t: Transaction) => t.id === id);
                                if (transaction) {
                                    Object.assign(transaction, updatedTransaction);
                                }
                            }
                        )
                    );
                    if (expenseId) {
                        dispatch(
                            api.util.updateQueryData(
                                "getOperationalExpenses",
                                { page: 1, limit: 10, includeDrafts: false },
                                (draft) => {
                                    const expense = draft.expenses.find((e: OperationalExpense) => e.id === expenseId);
                                    if (expense) {
                                        expense.paymentStatus = "PAID";
                                        expense.totalAmountPaid = updatedTransaction.amount;
                                    }
                                }
                            )
                        );
                    }
                    toast.success("Transaction reconciled successfully");
                } catch (error: any) {
                    patchResult.undo();
                    console.error("Reconcile transaction error:", {
                        status: error.status,
                        data: error.data,
                        endpoint: `POST /transactions/${id}/reconcile`,
                    });
                    toast.error(error.data?.message || "Failed to reconcile transaction");
                }
            },
        }),

        getAuditLogs: build.query<
            {
                data: AuditLog[];
                page: number;
                limit: number;
                totalPages: number;
                total: number;
            },
            { entity: string; entityId?: string; page?: number; limit?: number }
        >({
            query: ({ entity, entityId, page = 1, limit = 10 }) => ({
                url: `audit-logs`,
                params: cleanParams({
                    entity,
                    ...(entityId && { entityId }), // Only include entityId if provided
                    page: page.toString(),
                    limit: limit.toString(),
                }),
            }),
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: "AuditLogs" as const, id })),
                        { type: "AuditLogs", id: "LIST" },
                    ]
                    : [{ type: "AuditLogs", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch audit logs.",
                });
            },
            transformErrorResponse: (response) => {
                console.error('Audit Logs API Error:', response);
                return response;
            },
        }),

        deleteSupplier: build.mutation<void, number>({
            query: (id) => ({
                url: `suppliers/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Suppliers"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: "Deleting supplier...",
                    success: "Supplier deleted successfully",
                    error: "Failed to delete supplier.",
                });
            },
        }),

        getCurrencies: build.query<Currency[], void>({
            query: () => ({
                url: 'https://restcountries.com/v3.1/all?fields=currencies',
            }),
            transformResponse: (response: { currencies: { [key: string]: { name: string; symbol: string } } }[]) => {
                // Create a Set to store unique currencies
                const uniqueCurrencies = new Set<string>();
                const currencies: Currency[] = [];

                // Iterate through each country's currencies
                response.forEach((country) => {
                    if (country.currencies) {
                        Object.entries(country.currencies).forEach(([code, { name }]) => {
                            if (!uniqueCurrencies.has(code)) {
                                uniqueCurrencies.add(code);
                                currencies.push({ code, name });
                            }
                        });
                    }
                });

                // Sort currencies by code for consistent dropdown order
                return currencies.sort((a, b) => a.code.localeCompare(b.code));
            },
        }),

        getAttendanceRecords: build.query<AttendanceResponse, {
            page?: number;
            limit?: number;
            startDate?: string;
            endDate?: string;
            userCognitoId?: string;
            staffCognitoId?: string;
            accountsCognitoId?: string;
            adminCognitoId?: string;
        }>({
            query: (params) => ({
                url: 'attendance',
                params: {
                    page: params.page,
                    limit: params.limit,
                    startDate: params.startDate,
                    endDate: params.endDate,
                    userCognitoId: params.userCognitoId,
                    staffCognitoId: params.staffCognitoId,
                    accountsCognitoId: params.accountsCognitoId,
                    adminCognitoId: params.adminCognitoId,
                },
            }),
            providesTags: [{ type: 'Attendance', id: 'LIST' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: 'Fetching attendance records...',
                    success: 'Attendance records fetched successfully',
                    error: (error: any) => error.data?.message || 'Failed to fetch attendance records',
                });
            },
        }),

        checkIn: build.mutation<
            Attendance & { message?: string },
            { latitude: number; longitude: number; breakType?: BreakType }
        >({
            query: (body) => ({
                url: "attendance/check-in",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Attendance", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    const result = await queryFulfilled;
                    const successMessage = result.data?.message || "Check-in successful";
                    await withToast(Promise.resolve({ data: result.data }), {
                        pending: "Checking in...",
                        success: successMessage,
                        error: (error: any) => error.data?.message || "Check-in failed",
                    });
                } catch (error: any) {
                    await withToast(Promise.reject(error), {
                        pending: "Checking in...",
                        success: "Check-in successful",
                        error: error.data?.message || "Check-in failed",
                    });
                }
            },
        }),

        checkOut: build.mutation<
            Attendance,
            { latitude: number; longitude: number; breakType?: BreakType }
        >({
            query: (body) => ({
                url: "attendance/check-out",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Attendance", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: "Checking out...",
                    success: "Check-out successful",
                    error: (error: any) => error.data?.message || "Check-out failed",
                });
            },
        }),

        getFrequentSessions: build.query<FrequentSessionsResponse, { startDate?: string; endDate?: string; threshold?: number }>({
            query: (params) => ({
                url: 'attendance/frequent-sessions',
                params: {
                    startDate: params.startDate,
                    endDate: params.endDate,
                    threshold: params.threshold,
                },
            }),
            providesTags: [{ type: 'Attendance', id: 'FREQUENT_SESSIONS' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: 'Fetching frequent sessions...',
                    success: 'Frequent sessions fetched successfully',
                    error: (error: any) => error.data?.message || 'Failed to fetch frequent sessions',
                });
            },
        }),

        getAttendanceSummary: build.query<AttendanceSummary, void>({
            query: () => 'attendance/summary',
            providesTags: [{ type: 'Attendance', id: 'SUMMARY' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: 'Fetching attendance summary...',
                    success: 'Attendance summary fetched successfully',
                    error: (error: any) => error.data?.message || 'Failed to fetch attendance summary',
                });
            },
        }),

        getAttendanceTrends: build.query<AttendanceTrends, { timeFrame?: 'day' | 'week' | 'month' }>({
            query: (params) => ({
                url: 'attendance/trends',
                params: { timeFrame: params.timeFrame },
            }),
            providesTags: [{ type: 'Attendance', id: 'TRENDS' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: 'Fetching attendance trends...',
                    success: 'Attendance trends fetched successfully',
                    error: (error: any) => error.data?.message || 'Failed to fetch attendance trends',
                });
            },
        }),

        getLateCheckIns: build.query<LateCheckIns, void>({
            query: () => 'attendance/late-check-ins',
            providesTags: [{ type: 'Attendance', id: 'LATE_CHECK_INS' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: 'Fetching late check-ins...',
                    success: 'Late check-ins fetched successfully',
                    error: (error: any) => error.data?.message || 'Failed to fetch late check-ins',
                });
            },
        }),

        getAutoCheckoutReport: build.query<AutoCheckoutReport, void>({
            query: () => 'attendance/auto-checkouts',
            providesTags: [{ type: 'Attendance', id: 'AUTO_CHECKOUTS' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: 'Fetching auto-checkout report...',
                    success: 'Auto-checkout report fetched successfully',
                    error: (error: any) => error.data?.message || 'Failed to fetch auto-checkout report',
                });
            },
        }),

        startBreak: build.mutation<
            Attendance,
            { breakType: BreakType; latitude: number; longitude: number }
        >({
            query: (body) => ({
                url: "attendance/start-break",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Attendance", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: "Starting break...",
                    success: "Break started successfully",
                    error: (error: any) => error.data?.message || "Failed to start break",
                });
            },
        }),

        endBreak: build.mutation<Attendance, { latitude: number; longitude: number }>({
            query: (body) => ({
                url: 'attendance/end-break',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Attendance', id: 'LIST' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: 'Ending break...',
                    success: 'Break ended successfully',
                    error: (error: any) => error.data?.message || 'Failed to end break',
                });
            },
        }),

        getBreakAnalytics: build.query<BreakAnalytics, void>({
            query: () => 'attendance/break-analytics',
            providesTags: [{ type: 'Attendance', id: 'BREAK_ANALYTICS' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: 'Fetching break analytics...',
                    success: 'Break analytics fetched successfully',
                    error: (error: any) => error.data?.message || 'Failed to fetch break analytics',
                });
            },
        }),

        getUserActivityStatus: build.query<UserActivityStatus, void>({
            query: () => 'attendance/user-activity-status',
            providesTags: [{ type: 'Attendance', id: 'USER_STATUS' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: 'Fetching user activity status...',
                    success: 'User activity status fetched successfully',
                    error: (error: any) => error.data?.message || 'Failed to fetch user activity status',
                });
            },
        }),

        generateAttendanceReport: build.query<AttendanceReportResponse, { timeFrame?: 'day' | 'week' | 'month' }>({
            query: (params) => ({
                url: 'attendance/attendance-report',
                params: { timeFrame: params.timeFrame },
            }),
            providesTags: [{ type: 'Attendance', id: 'REPORT' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: 'Generating attendance report...',
                    success: 'Attendance report generated successfully',
                    error: (error: any) => error.data?.message || 'Failed to generate attendance report',
                });
            },
        }),

        validateQRCode: build.mutation<
            { message: string; attendance: Attendance },
            { locationId: string; latitude: number; longitude: number; breakType?: BreakType }
        >({
            query: (body) => ({
                url: 'qr-code/scan',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Attendance', id: 'LIST' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: 'Processing QR code...',
                    success: 'Attendance recorded successfully',
                    error: (error: any) => error.data?.message || 'Failed to process QR code',
                });
            },
        }),

        generateQRCode: build.mutation<
            { qrCode: string; locationId: string },
            {}
        >({
            query: () => ({
                url: 'qr-code/generate-permanent',
                method: 'GET',
            }),
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: 'Generating QR code...',
                    success: 'QR code generated successfully',
                    error: (error: any) => error.data?.message || 'Failed to generate QR code',
                });
            },
        }),

        createOrUpdateLeavePolicies: build.mutation<
            {
                message: string;
                year: number;
                policies: LeavePolicy[];
            },
            {
                year: number;
                policies: {
                    role: "ADMIN" | "ACCOUNTS" | "STAFF";
                    annualLeaveDays?: number;
                    sickLeaveDays?: number;
                    compassionateDays?: number;
                    maternityDays?: number;
                    paternityDays?: number;
                    emergencyDays?: number;
                    studyLeaveDays?: number | null;
                    unpaidLeaveAllowed?: boolean;
                    workingDaysPerWeek?: number;
                    includeWeekends?: boolean;
                    excludeHolidays?: boolean;
                }[];
            }
        >({
            query: (body) => ({
                url: "leave-policies",
                method: "POST",
                body,
            }),

            invalidatesTags: ["LeavePolicy"],

            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: "Saving leave policies...",
                    success: "Leave policies saved successfully",
                    error: (err: any) =>
                        err?.data?.message || "Failed to save leave policies",
                });
            },
        }),

        getUserLeaveData: build.query<
            {
                user: {
                    id?: string;
                    cognitoId: string;
                    name: string;
                    email: string;
                    profilePicture?: string | null;
                } | null;

                balance: LeaveBalance | null;
                policy: any;
                requests: LeaveRequest[];
                accruals: any[];
                ledger: LeaveLedger[];

                summary: {
                    totalRequests: number;
                    pendingRequests: number;
                    approvedRequests: number;
                    rejectedRequests: number;
                };
            },
            string
        >({
            query: (cognitoId) => `leaves/user/${cognitoId}`,

            transformResponse: (response: any) => {
                const data = response?.data;

                return {
                    user: data?.user
                        ? {
                            id: data.user.id,
                            cognitoId: data.user.cognitoId,
                            name: data.user.name ?? "Unknown User",
                            email: data.user.email ?? "No email available",
                            profilePicture: data.user.profilePicture ?? null,
                        }
                        : null,

                    balance: data?.balance ?? null,
                    policy: data?.policy ?? null,

                    requests: data?.requests ?? [],
                    accruals: data?.accruals ?? [],
                    ledger: data?.ledger ?? [],

                    summary: data?.summary ?? {
                        totalRequests: 0,
                        pendingRequests: 0,
                        approvedRequests: 0,
                        rejectedRequests: 0,
                    },
                };
            },

            providesTags: (result, error, cognitoId) => [
                { type: "Leave", id: `USER_${cognitoId}` },
                { type: "LeaveBalance", id: `USER_${cognitoId}` },
                { type: "UserLeaveData", id: cognitoId },
            ],

            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: "Loading user leave data...",
                    success: "User leave data loaded successfully",
                    error: (error: any) =>
                        error.data?.message || "Failed to load user leave data",
                });
            },
        }),

        createLeaveRequest: build.mutation<
            {
                request: LeaveRequest;
                decision: LeaveDecision;
                message: string;
            },
            {
                leaveType: string;
                otherLeaveType?: string;
                startDate: string;
                endDate: string;
                reason?: string;
            }
        >({
            query: (body) => ({
                url: "leaves",
                method: "POST",
                body,
            }),

            invalidatesTags: [
                { type: "Leave", id: "LIST" },
                { type: "LeaveBalance" },
            ],

            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: "Submitting leave request...",
                    success: "Leave request submitted successfully",
                    error: (error: any) =>
                        error.data?.message || "Failed to submit leave request",
                });
            },
        }),

        getMyLeaveRequests: build.query<
            {
                data: LeaveRequest[];
                pagination: PaginationMeta;
            },
            {
                status?: string;
                leaveType?: string;
                page?: number;
                limit?: number;
            }
        >({
            query: (params) => ({
                url: "leaves/my-requests",
                params,
            }),

            providesTags: (result) => [
                { type: "Leave", id: "LIST" },
            ],

            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: "Fetching your leave requests...",
                    success: "Leave requests loaded successfully",
                    error: (error: any) =>
                        error.data?.message || "Failed to fetch leave requests",
                });
            },
        }),

        getLeaveRequests: build.query<
            {
                data: LeaveRequest[];
                pagination: PaginationMeta;
            },
            {
                status?: string;
                leaveType?: string;
                page?: number;
                limit?: number;
            }
        >({
            query: (params) => ({
                url: "leaves",
                params,
            }),

            providesTags: (result) => [
                { type: "Leave", id: "LIST" },
            ],

            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    pending: "Fetching all leave requests...",
                    success: "Leave requests fetched successfully",
                    error: (error: any) =>
                        error.data?.message || "Failed to fetch leave requests",
                });
            },
        }),

        previewLeaveDecision: build.mutation<
            LeaveDecision,
            {
                leaveType: string;
                startDate: string;
                endDate: string;
                reason?: string;
            }
        >({
            query: (body) => ({
                url: "leaves/preview",
                method: "POST",
                body,
            }),
        }),

        getLeaveBalance: build.query<LeaveBalanceResponse, void>({
            query: () => "leaves/balance",

            providesTags: [{ type: "LeaveBalance", id: "ME" }],

            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    console.error("Failed to load leave balance", error);
                }
            },
        }),

        getUserLeaveBalance: build.query<
            any,
            { cognitoId: string }
        >({
            query: ({ cognitoId }) =>
                `leaves/user/${cognitoId}/balance`,

            transformResponse: (res: any) => res.data,

            providesTags: (result, error, arg) => [
                { type: "LeaveBalance", id: arg.cognitoId }
            ],
        }),

        approveLeaveRequest: build.mutation<
            { message: string; data: any },
            {
                leaveRequestId: number;
                approvalId: number;
                comments?: string;
            }
        >({
            query: (body) => ({
                url: "leaves/approve",
                method: "POST",
                body,
            }),

            invalidatesTags: (result, error, arg) => [
                { type: "Leave", id: "LIST" },
                { type: "Leave", id: `REQUEST_${arg.leaveRequestId}` },
                { type: "LeaveBalance", id: "ME" },
            ],

            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error: any) {
                    console.error("Approve leave failed", error);
                }
            },
        }),

        rejectLeaveRequest: build.mutation<
            { message: string; data: any },
            {
                leaveRequestId: number;
                approvalId: number;
                comments?: string;
            }
        >({
            query: (body) => ({
                url: "leaves/reject",
                method: "POST",
                body,
            }),

            invalidatesTags: (result, error, arg) => [
                { type: "Leave", id: "LIST" },
                { type: "Leave", id: `REQUEST_${arg.leaveRequestId}` },
                { type: "LeaveBalance", id: "ME" },
            ],

            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error: any) {
                    console.error("Reject leave failed", error);
                }
            },
        }),

        invalidateLeaveBalance: build.mutation<void, void>({
            query: () => ({
                url: "leaves/balance/refresh",
                method: "POST",
            }),

            invalidatesTags: [{ type: "LeaveBalance", id: "ME" }],
        }),

        getPublicSignUpSettings: build.query<{ isSignUpEnabled: boolean }, void>({
            queryFn: async (_, _queryApi, _extraOptions, fetchWithBQ) => {
                try {
                    const response = await fetchWithBQ({ url: "settings/signup-settings" });
                    if (response.error) {
                        throw new Error(getErrorMessage(response.error));
                    }
                    return { data: response.data as { isSignUpEnabled: boolean } };
                } catch (error: any) {
                    console.error("getPublicSignUpSettings: Failed to fetch:", error);
                    return { error: { status: "CUSTOM_ERROR", error: error.message || "Could not fetch sign-up settings" } };
                }
            },
            providesTags: [{ type: "AppSettings", id: "SIGNUP_ENABLED" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch public sign-up settings",
                });
            },
        }),

        getSignUpEnabled: build.query<{ isSignUpEnabled: boolean }, void>({
            query: () => ({
                url: "settings/signup-enabled",
            }),
            providesTags: [{ type: "AppSettings", id: "SIGNUP_ENABLED" }],
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;

                } catch (error: any) {
                    console.error("getSignUpEnabled error:", error);
                    toast.error(error.data?.message || "Failed to fetch sign-up setting");
                }
            },
        }),

        updateSignUpEnabled: build.mutation<
            { isSignUpEnabled: boolean },
            { isSignUpEnabled: boolean }
        >({
            query: ({ isSignUpEnabled }) => ({
                url: "settings/signup-enabled",
                method: "PUT",
                body: { isSignUpEnabled },
            }),
            invalidatesTags: [
                { type: "AppSettings", id: "SIGNUP_ENABLED" },
                { type: "AuditLogs", id: "LIST" },
            ],
            async onQueryStarted({ isSignUpEnabled }, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;

                } catch (error: any) {
                    console.error("updateSignUpEnabled error:", error);
                    toast.error(error.data?.message || "Failed to update sign-up setting");
                }
            },
        }),

        getClients: build.query<
            {
                clients: ClientList[];
                page: number;
                limit: number;
                totalPages: number;
                total: number;
            },
            { page?: number; limit?: number; search?: string }
        >({
            query: ({ page = 1, limit = 10, search }) => ({
                url: 'clients',
                params: cleanParams({
                    page: page.toString(),
                    limit: limit.toString(),
                    search: search || undefined,
                }),
            }),
            providesTags: (result) =>
                result?.clients
                    ? [
                        ...result.clients.map(({ id }) => ({ type: 'Clients' as const, id })),
                        { type: 'Clients', id: 'LIST' },
                    ]
                    : [{ type: 'Clients', id: 'LIST' }],
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error: any) {
                    toast.error(error?.error?.data?.message || 'Failed to fetch clients');
                }
            },
        }),

        getClient: build.query<ClientList, number>({
            query: (id) => `clients/${id}`,
            providesTags: (result) =>
                result ? [{ type: 'Clients', id: result.id }] : [],

            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error: any) {
                    toast.error(error?.error?.data?.message || 'Failed to fetch client details');
                }
            },
        }),

        createClient: build.mutation<ClientList, FormData>({
            query: (formData) => ({
                url: 'clients',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: [
                { type: 'Clients', id: 'LIST' },
                { type: 'AuditLogs', id: 'LIST' },
            ],
            async onQueryStarted(formData: FormData, { dispatch, queryFulfilled }) {
                const tempId = Date.now();

                const patchResult = dispatch(
                    api.util.updateQueryData('getClients', { page: 1, limit: 10 }, (draft) => {
                        draft.clients.unshift({
                            id: tempId,
                            clientName: null,
                            customClientName: (formData.get('customClientName') as string) || null,
                            contactEmail: (formData.get('contactEmail') as string) || null,
                            contactPhone: (formData.get('contactPhone') as string) || null,
                            address: (formData.get('address') as string) || null,
                            kraPin: (formData.get('kraPin') as string) || null,
                            isActive: true,
                            imageUrl: null,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            deletedAt: null,
                            createdByAdmin: null,
                            createdByAccounts: null,
                            createdByStaff: null,
                            clientExpenses: [],
                            invoices: [],
                        } as ClientList);
                        draft.total += 1;
                    })
                );

                try {
                    const { data: newClient } = await queryFulfilled;

                    dispatch(
                        api.util.updateQueryData('getClients', { page: 1, limit: 10 }, (draft) => {
                            const index = draft.clients.findIndex((c: ClientList) => c.id === tempId);
                            if (index !== -1) {
                                draft.clients[index] = newClient;
                            }
                        })
                    );

                    toast.success('Client created successfully');
                } catch (error: any) {
                    patchResult.undo();
                    toast.error(error?.data?.message || 'Failed to create client');
                }
            },
        }),

        importClientsFromCSV: build.mutation<
            {
                message: string;
                successful: number;
                failed: number;
                created: { id: number; name: string | null }[];
                errors: { row: number; error: string }[];
            },
            FormData
        >({
            query: (formData) => ({
                url: 'clients/import-csv',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: [
                { type: 'Clients', id: 'LIST' },
                { type: 'AuditLogs', id: 'LIST' },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;

                    if (data.successful > 0) {
                        toast.success(
                            data.failed === 0
                                ? `Successfully imported ${data.successful} client(s)`
                                : `Imported ${data.successful} client(s), ${data.failed} failed`
                        );
                    }

                    if (data.failed > 0 && data.successful === 0) {
                        toast.error(`CSV import failed: ${data.failed} row(s) had errors`);
                    }
                } catch (error: any) {
                    const message =
                        error?.error?.data?.message ||
                        error?.error?.data?.error ||
                        'CSV import failed';

                    toast.error(message);
                }
            },
        }),

        updateClient: build.mutation<ClientList, { id: number; data: Partial<ClientList> }>({
            query: ({ id, data }) => ({
                url: `clients/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Clients', id },
                { type: 'Clients', id: 'LIST' },
                { type: 'AuditLogs', id: 'LIST' },
            ],
            async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData('getClients', { page: 1, limit: 10 }, (draft) => {
                        const client = draft.clients.find((c: ClientList) => c.id === id);
                        if (client) {
                            Object.assign(client, {
                                ...data,
                                updatedAt: new Date().toISOString(),
                            });
                        }
                    })
                );
                try {
                    const { data: updatedClient } = await queryFulfilled;
                    dispatch(
                        api.util.updateQueryData('getClients', { page: 1, limit: 10 }, (draft) => {
                            const client = draft.clients.find((c: ClientList) => c.id === id);
                            if (client) Object.assign(client, updatedClient);
                        })
                    );
                    dispatch(
                        api.util.updateQueryData('getClient', id, (draft) => {
                            Object.assign(draft, updatedClient);
                        })
                    );
                    toast.success('Client updated successfully');
                } catch (error: any) {
                    patchResult.undo();
                    console.error('Update client error:', {
                        status: error.status,
                        data: error.data,
                        endpoint: `PUT /clients/${id}`,
                    });
                    toast.error(error.data?.message || 'Failed to update client');
                }
            },
        }),

        deleteClient: build.mutation<void, number>({
            query: (id) => ({
                url: `clients/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Clients', id },
                { type: 'Clients', id: 'LIST' },
                { type: 'AuditLogs', id: 'LIST' },
            ],
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData('getClients', { page: 1, limit: 10 }, (draft) => {
                        const index = draft.clients.findIndex((c: ClientList) => c.id === id);
                        if (index !== -1) {
                            draft.clients.splice(index, 1);
                            draft.total -= 1;
                        }
                    })
                );
                try {
                    await queryFulfilled;
                    toast.success('Client deleted successfully');
                } catch (error: any) {
                    patchResult.undo();
                    console.error('Delete client error:', {
                        status: error.status,
                        data: error.data,
                        endpoint: `DELETE /clients/${id}`,
                    });
                    toast.error(error.data?.message || 'Failed to delete client');
                }
            },
        }),

        deleteClientExpense: build.mutation<void, number>({
            query: (id) => ({
                url: `client-expenses/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "ClientExpenses", id },
                { type: "ClientExpenses", id: "LIST" },
            ],
        }),

        getInvoices: build.query<
            {
                invoices: Invoice[];
                page: number;
                limit: number;
                totalPages: number;
                total: number;
            },
            { page?: number; limit?: number; clientName?: string }
        >({
            query: ({ page = 1, limit = 10, clientName }) => ({
                url: "invoices",
                params: cleanParams({
                    page: page.toString(),
                    limit: limit.toString(),
                    clientName,
                }),
            }),
            providesTags: (result) =>
                result?.invoices
                    ? [
                        ...result.invoices.map(({ id }) => ({
                            type: "Invoices" as const,
                            id,
                        })),
                        { type: "Invoices", id: "LIST" },
                    ]
                    : [{ type: "Invoices", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch invoices.",
                });
            },
        }),

        getInvoice: build.query<Invoice, number>({
            query: (id) => `invoices/${id}`,
            providesTags: (result: Invoice | undefined) => [
                { type: "Invoices", id: result?.id },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch invoice.",
                });
            },
        }),

        createInvoice: build.mutation<
            Invoice,
            Partial<Invoice> & { items: InvoiceItem[] }
        >({
            query: (body) => ({
                url: "invoices",
                method: "POST",
                body,
                headers: { "Content-Type": "application/json" },
            }),
            invalidatesTags: [{ type: "Invoices", id: "LIST" }],
            async onQueryStarted(body, { dispatch, queryFulfilled }) {
                const optimisticId = Date.now();

                // 🟡 Optimistic update
                const patchResult = dispatch(
                    api.util.updateQueryData(
                        "getInvoices",
                        { page: 1, limit: 10 },
                        (draft) => {
                            draft.invoices.unshift({
                                id: optimisticId,
                                ...body,
                                subTotal: Number(body.subTotal) || 0,
                                taxAmount: Number(body.taxAmount) || 0,
                                totalAmount: Number(body.totalAmount) || 0,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                items: (body.items || []).map((item) => ({
                                    ...item,
                                    id: Date.now() + Math.random(),
                                    invoiceId: optimisticId,
                                    total: Number(item.quantity) * Number(item.unitPrice),
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                })),
                            } as Invoice);
                            draft.total += 1;
                        }
                    )
                );

                try {
                    const { data: newInvoice } = await queryFulfilled;

                    // 🟢 Merge real data back in
                    dispatch(
                        api.util.updateQueryData(
                            "getInvoices",
                            { page: 1, limit: 10 },
                            (draft) => {
                                const optimistic = draft.invoices.find((i: Invoice) => i.id === optimisticId);
                                if (optimistic) Object.assign(optimistic, newInvoice);
                            }
                        )
                    );

                    toast.success("Invoice created successfully");
                } catch (err) {
                    patchResult.undo();

                    const message = getErrorMessage(err);
                    console.error("Create Invoice Error:", message);
                    toast.error(`Failed to create invoice: ${message}`);
                }
            },
        }),

        updateInvoice: build.mutation<
            Invoice,
            { id: number; data: Partial<Invoice> & { items?: InvoiceItem[]; markAsPaid?: boolean } }
        >({
            query: ({ id, data }) => ({
                url: `invoices/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "Invoices", id },
                { type: "Invoices", id: "LIST" },
                { type: "ClientExpenses", id: result?.clientExpenseId }, // Invalidate related client expense if marked as paid
            ],
            async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData(
                        "getInvoices",
                        { page: 1, limit: 10 },
                        (draft) => {
                            const invoice = draft.invoices.find((i: Invoice) => i.id === id);
                            if (invoice) {
                                Object.assign(invoice, {
                                    ...data,
                                    subTotal: data.subTotal != null ? Number(data.subTotal) : invoice.subTotal,
                                    taxAmount: data.taxAmount != null ? Number(data.taxAmount) : invoice.taxAmount,
                                    totalAmount: data.totalAmount != null ? Number(data.totalAmount) : invoice.totalAmount,
                                    items: data.items
                                        ? data.items.map((item) => ({
                                            ...item,
                                            total: Number(item.quantity) * Number(item.unitPrice),
                                            createdAt: item.createdAt || new Date().toISOString(),
                                            updatedAt: new Date().toISOString(),
                                        }))
                                        : invoice.items,
                                    updatedAt: new Date().toISOString(),
                                });
                            }
                        }
                    )
                );
                try {
                    await queryFulfilled;
                    toast.success("Invoice updated successfully");
                } catch {
                    patchResult.undo();
                    toast.error("Failed to update invoice");
                }
            },
        }),

        deleteInvoice: build.mutation<void, number>({
            query: (id) => ({
                url: `invoices/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "Invoices", id },
                { type: "Invoices", id: "LIST" },
            ],
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData(
                        "getInvoices",
                        { page: 1, limit: 10 },
                        (draft) => {
                            draft.invoices = draft.invoices.filter((i: Invoice) => i.id !== id);
                            draft.total -= 1;
                        }
                    )
                );
                try {
                    await queryFulfilled;
                    toast.success("Invoice deleted successfully");
                } catch {
                    patchResult.undo();
                    toast.error("Failed to delete invoice");
                }
            },
        }),

        generateInvoicePDF: build.query<string, number>({
            query: (id) => `invoices/${id}/pdf`,
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                    toast.success("Invoice PDF generated successfully");
                } catch {
                    toast.error("Failed to generate invoice PDF");
                }
            },
        }),

        uploadProofFile: build.mutation<
            ProofFile,
            {
                file: File;
                expenseType?: ExpenseType;
                clientExpenseId?: number;
                operationalExpenseId?: number;
                quotationId?: number;
            }
        >({
            query: ({ file, ...body }) => {
                const formData = new FormData();
                formData.append("file", file);
                if (body.expenseType) formData.append("expenseType", body.expenseType);
                if (body.clientExpenseId)
                    formData.append("clientExpenseId", body.clientExpenseId.toString());
                if (body.operationalExpenseId)
                    formData.append("operationalExpenseId", body.operationalExpenseId.toString());
                if (body.quotationId)
                    formData.append("quotationId", body.quotationId.toString());

                return {
                    url: "proof-files",
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: [
                { type: "ProofFiles", id: "LIST" },
                { type: "OperationalExpenses", id: "LIST" },
                { type: "ClientExpenses", id: "LIST" },
                { type: "Quotations", id: "LIST" },
            ],
            async onQueryStarted(
                { clientExpenseId, operationalExpenseId, quotationId },
                { dispatch, queryFulfilled }
            ) {
                try {
                    await withToast(queryFulfilled, {
                        pending: "Uploading proof file...",
                        success: "Proof file uploaded successfully",
                        error: "Failed to upload proof file",
                    });
                } catch (error: any) {
                    console.error("Upload proof file error:", {
                        status: error.status,
                        data: error.data,
                        endpoint: "POST /proof-files",
                    });
                    toast.error(error.data?.message || "Failed to upload proof file");
                }
            },
        }),

        getProofFiles: build.query<
            {
                data: ProofFile[];
                page: number;
                limit: number;
                totalPages: number;
                total: number;
            },
            {
                page?: number;
                limit?: number;
                expenseType?: ExpenseType;
                clientExpenseId?: number;
                operationalExpenseId?: number;
                quotationId?: number;
            }
        >({
            query: ({
                        page = 1,
                        limit = 10,
                        expenseType,
                        clientExpenseId,
                        operationalExpenseId,
                        quotationId,
                    }) => {
                const params = cleanParams({
                    page: page.toString(),
                    limit: limit.toString(),
                    expenseType,
                    clientExpenseId: clientExpenseId?.toString(),
                    operationalExpenseId: operationalExpenseId?.toString(),
                    quotationId: quotationId?.toString(),
                });

                return {
                    url: "/proof-files",
                    params,
                };
            },
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({
                            type: "ProofFiles" as const,
                            id,
                        })),
                        { type: "ProofFiles", id: "LIST" },
                    ]
                    : [{ type: "ProofFiles", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error: any) {
                    console.error("Fetch proof files error:", {
                        status: error.status,
                        data: error.data,
                        endpoint: "GET /proof-files",
                    });
                    toast.error(error.data?.message || "Failed to fetch proof files");
                }
            },
        }),

        getProofFileById: build.query<ProofFile, number>({
            query: (id) => ({
                url: `proof-files/${id}`,
            }),
            providesTags: (result, error, id) => [{ type: "ProofFiles", id }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to fetch proof file",
                });
            },
        }),

        deleteProofFile: build.mutation<void, number>({
            query: (id) => ({
                url: `proof-files/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "ProofFiles", id },
                { type: "ProofFiles", id: "LIST" },
                { type: "OperationalExpenses", id: "LIST" },
                { type: "ClientExpenses", id: "LIST" },
                { type: "Quotations", id: "LIST" },
            ],
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    api.util.updateQueryData(
                        "getProofFiles",
                        { page: 1, limit: 10 },
                        (draft) => {
                            const index = draft.data.findIndex((file: ProofFile) => file.id === id);
                            if (index !== -1) {
                                draft.data.splice(index, 1);
                                draft.total -= 1;
                            }
                        }
                    )
                );
                try {
                    await queryFulfilled;
                    toast.success("Proof file deleted successfully");
                } catch (error: any) {
                    patchResult.undo();
                    console.error("Delete proof file error:", {
                        status: error.status,
                        data: error.data,
                        endpoint: `DELETE /proof-files/${id}`,
                    });
                    toast.error(error.data?.message || "Failed to delete proof file");
                }
            },
        }),

        getSignedProofFileUrl: build.query<string, number>({
            query: (proofFileId) => ({
                url: `/proof-files/${proofFileId}/url`,

            }),

            transformResponse: (response: { downloadUrl: string }) => response.downloadUrl,
        }),

        shareStickyNote: build.mutation<
            { success: true; share: StickyNoteShare },
            { noteId: number; receiverCognitoId: string; receiverRole: "admin" | "staff" | "accounts"; permission?: "VIEW" | "EDIT" }
        >({
            query: ({ noteId, receiverCognitoId, receiverRole, permission = "VIEW" }) => ({
                url: `/stickynotes/${noteId}/share`,
                method: "POST",
                body: {
                    receiverCognitoId,
                    receiverRole,
                    permission,
                },
            }),
            invalidatesTags: (result, error, { noteId }) => [
                { type: "StickyNotes", id: noteId },
                { type: "StickyNotes", id: "LIST" },
                { type: "StickyNoteShare", id: noteId },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Note shared successfully",
                    error: "Failed to share sticky note",
                });
            },
        }),

        revokeShare: build.mutation<
            { success: true; message: string },
            { noteId: number; shareId: number }
        >({
            query: ({ noteId, shareId }) => ({
                url: `/stickynotes/${noteId}/share/${shareId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, { noteId }) => [
                { type: "StickyNotes", id: noteId },
                { type: "StickyNotes", id: "LIST" },
                // { type: "StickyNoteShares", id: noteId }, // if you use separate tag
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Share revoked successfully",
                    error: "Failed to revoke share",
                });
            },
        }),

        getNoteShares: build.query<StickyNoteShare[], number>({
            query: (noteId) => `/stickynotes/${noteId}/shares`,
            providesTags: (result, error, noteId) => [
                { type: "StickyNotes", id: noteId },
                { type: "StickyNoteShare", id: noteId },
                ...(result
                    ? result.map((share) => ({ type: "StickyNoteShare" as const, id: share.id }))
                    : []),
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    error: "Failed to load share information",
                });
            },
        }),

        getStickyNotes: build.query<StickyNote[], void>({
            query: () => `/stickynotes`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map((note) => ({ type: 'StickyNotes' as const, id: note.id })),
                        { type: 'StickyNotes', id: 'LIST' },
                    ]
                    : [{ type: 'StickyNotes', id: 'LIST' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, { error: "Failed to fetch sticky notes." });
            },
        }),

        getStickyNote: build.query<StickyNote, number>({
            query: (id) => `/stickynotes/${id}`,
            providesTags: (result, error, id) => [{ type: 'StickyNotes', id }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, { error: "Failed to fetch sticky note." });
            },
        }),

        createStickyNote: build.mutation<StickyNote, StickyNoteInput>({
            query: (body) => ({
                url: `/stickynotes`,
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'StickyNotes', id: 'LIST' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Sticky note created.",
                    error: "Failed to create sticky note.",
                });
            },
        }),

        updateStickyNote: build.mutation<StickyNote, { id: number; data: Partial<StickyNoteInput> }>({
            query: ({ id, data }) => ({
                url: `/stickynotes/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'StickyNotes', id },
                { type: 'StickyNotes', id: 'LIST' },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Sticky note updated.",
                    error: "Failed to update sticky note.",
                });
            },
        }),

        deleteStickyNote: build.mutation<{ message: string }, number>({
            query: (id) => ({
                url: `/stickynotes/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'StickyNotes', id },
                { type: 'StickyNotes', id: 'LIST' },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Sticky note deleted.",
                    error: "Failed to delete sticky note.",
                });
            },
        }),

    }),
});

export const {
    useGetAuthUserQuery,
    useUpdateAdminSettingsMutation,
    useGetUserByCognitoIdQuery,
    useUpdateUserMutation,
    useUpdateAccountsSettingsMutation,
    useGetAdminQuery,
    useGetAccountsQuery,
    useGetStaffQuery,
    useGetAllUsersQuery,
    useUpdateStaffSettingsMutation,
    useGetUserQuery,
    useCreateAdminMutation,
    useUpdateAdminMutation,
    useCreateAccountsMutation,
    useCreateStaffMutation,
    useCreateContactMutation,
    useGetContactsQuery,
    useGetContactQuery,
    useDeleteContactMutation,
    useGetChatRoomsQuery,
    useGetChatMessagesQuery,
    useSendChatMessageMutation,
    useCreateChatRoomMutation,
    useMarkChatRoomReadMutation,
    useCreateGuestUserMutation,
    useMarkChatMessageReadMutation,
    useCreateEmailListMutation,
    useGetEmailListsQuery,
    useGetCampaignsQuery,
    useAddEmailToListMutation,
    useCreateEmailCampaignMutation,
    useSendEmailCampaignMutation,
    useGetCampaignAnalyticsQuery,
    useUpdateEmailCampaignMutation,
    useGetAllCampaignsQuery,
    useScheduleCampaignMutation,
    useGetBlogsQuery,
    useGetPublicBlogsQuery,
    useGetBlogBySlugQuery,
    useCreateBlogMutation,
    useUpdateBlogMutation,
    useDeleteBlogMutation,
    useSaveBlogDraftMutation,
    usePublishBlogMutation,
    useGetAuthorsQuery,
    useGetAuthorByIdQuery,
    useGetBlogsByAuthorQuery,
    useCreateAuthorMutation,
    useGetBankAccountsQuery,
    useCreateBankAccountMutation,
    useUpdateBankAccountMutation,
    useGetCashAccountsQuery,
    useGetCashAccountQuery,
    useDepositToCashAccountMutation,
    useCreateCashAccountMutation,
    useGetDailyBalanceQuery,
    useUpdateCashAccountMutation,
    useCloseCashAccountMutation,
    useDeleteCashAccountMutation,
    useGetTransactionsQuery,
    useReconcileTransactionMutation,
    useInitiatePaymentMutation,
    useGetCurrenciesQuery,
    useGetAuditLogsQuery,
    useGetSuppliersQuery,
    useCreateSupplierMutation,
    useUpdateSupplierMutation,
    useDeleteSupplierMutation,
    useGetAttendanceRecordsQuery,
    useCheckInMutation,
    useCheckOutMutation,
    useGetFrequentSessionsQuery,
    useGetAttendanceSummaryQuery,
    useGetAttendanceTrendsQuery,
    useGetLateCheckInsQuery,
    useGetAutoCheckoutReportQuery,
    useStartBreakMutation,
    useEndBreakMutation,
    useGetBreakAnalyticsQuery,
    useGetUserActivityStatusQuery,
    useGenerateAttendanceReportQuery,
    useValidateQRCodeMutation,
    useGenerateQRCodeMutation,
    useCreateOrUpdateLeavePoliciesMutation,
    useGetUserLeaveDataQuery,
    useCreateLeaveRequestMutation,
    useGetMyLeaveRequestsQuery,
    useGetLeaveRequestsQuery,
    usePreviewLeaveDecisionMutation,
    useGetLeaveBalanceQuery,
    useApproveLeaveRequestMutation,
    useRejectLeaveRequestMutation,
    useGetSignUpEnabledQuery,
    useUpdateSignUpEnabledMutation,
    useGetPublicSignUpSettingsQuery,
    useGetClientExpensesQuery,
    useGetClientExpenseQuery,
    useCreateClientExpenseMutation,
    useUpdateClientExpenseMutation,
    useCancelClientExpenseMutation,
    useDeleteClientExpenseMutation,
    useApproveClientExpenseMutation,
    useDownloadClientExpensePdfMutation,
    useDownloadClientExpensesXlsxMutation,
    useImportClientsFromCSVMutation,
    useRejectClientExpenseMutation,
    useGetOperationalExpensesQuery,
    useGetOperationalExpenseQuery,
    useCreateOperationalExpenseMutation,
    useUpdateOperationalExpenseMutation,
    useDeleteOperationalExpenseMutation,
    useApproveOperationalExpenseMutation,
    useReverseOperationalExpenseMutation,
    useReverseAndEditOperationalExpenseMutation,
    useDownloadOperationalExpensePdfMutation,
    useGetClientsQuery,
    useGetClientQuery,
    useCreateClientMutation,
    useUpdateClientMutation,
    useDeleteClientMutation,
    useGetInvoicesQuery,
    useGetInvoiceQuery,
    useCreateInvoiceMutation,
    useUpdateInvoiceMutation,
    useDeleteInvoiceMutation,
    useGenerateInvoicePDFQuery,
    useUploadProofFileMutation,
    useGetProofFilesQuery,
    useGetProofFileByIdQuery,
    useDeleteProofFileMutation,
    useGetSignedProofFileUrlQuery,
    useGetStickyNotesQuery,
    useGetStickyNoteQuery,
    useCreateStickyNoteMutation,
    useUpdateStickyNoteMutation,
    useDeleteStickyNoteMutation,
    useShareStickyNoteMutation,
    useRevokeShareMutation,
    useGetNoteSharesQuery,
} = api;