export enum PaymentMode {
    MPESA_PAYBILL = "MPESA_PAYBILL",
    BANK_DEPOSIT = "BANK_DEPOSIT",
    VISA_CARD = "VISA_CARD",
    CASH = "CASH",
}

export enum BreakType {
    DAY_END = "DAY_END",
    TEA_COFFEE = "TEA_COFFEE",
    LUNCH = "LUNCH",
    PRAYER_MEDITATION = "PRAYER_MEDITATION",
    STRETCH_FRESH_AIR = "STRETCH_FRESH_AIR",
    ERRAND = "ERRAND",
    FIELD = "FIELD",
    MEETING = "MEETING",
    PERSONAL = "PERSONAL",
    LEAVE = "LEAVE",
    TRAINING = "TRAINING",
    OFFICIAL_TRAVEL = "OFFICIAL_TRAVEL",
    SICK = "SICK",
    MATERNITY_PATERNITY = "MATERNITY_PATERNITY",
    TEAM_BUILDING = "TEAM_BUILDING",
    COMPENSATORY = "COMPENSATORY",
}

export enum ExpenseCheck {
    IDENTITY = "IDENTITY",
    ACADEMIC = "ACADEMIC",
    PROFESSIONAL = "PROFESSIONAL",
    ADDRESS = "ADDRESS",
    FINGERPRINT = "FINGERPRINT",
    PCC_FAST_TRACK = "PCC_FAST_TRACK",
    CERTIFICATE_VERIFICATION = "CERTIFICATE_VERIFICATION",
    OTHERS = "OTHERS",
}

export enum AttendanceStatus {
    CHECKED_IN = "CHECKED_IN",
    CHECKED_OUT = "CHECKED_OUT",
    FLAGGED = "FLAGGED",
    REJECTED = "REJECTED",
}

export enum PaymentStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    FAILED = "FAILED",
}

export enum ExpenseType {
    CLIENT = "CLIENT",
    OPERATIONAL = "OPERATIONAL",
}

export enum ItemType {
    GOODS = "GOODS",
    SERVICES = "SERVICES",
}

export enum AccountType {
    RENT_EXPENSE = "RENT_EXPENSE",
    REPAIR_AND_MAINTENANCE = "REPAIR_AND_MAINTENANCE",
    SALARIES_AND_EMPLOYEE_WAGES = "SALARIES_AND_EMPLOYEE_WAGES",
    TELEPHONE_EXPENSE = "TELEPHONE_EXPENSE",
    TRAVEL_EXPENSE = "TRAVEL_EXPENSE",
    UTILITIES_EXPENSE = "UTILITIES_EXPENSE",
    OFFICE_SUPPLIES_EXPENSE = "OFFICE_SUPPLIES_EXPENSE",
    INSURANCE_EXPENSE = "INSURANCE_EXPENSE",
    ADVERTISING_AND_MARKETING_EXPENSE = "ADVERTISING_AND_MARKETING_EXPENSE",
    TRAINING_AND_DEVELOPMENT_EXPENSE = "TRAINING_AND_DEVELOPMENT_EXPENSE",
    PROFESSIONAL_FEES = "PROFESSIONAL_FEES",
    DEPRECIATION_EXPENSE = "DEPRECIATION_EXPENSE",
    BANK_CHARGES_AND_FEES = "BANK_CHARGES_AND_FEES",
    VEHICLE_RUNNING_AND_MAINTENANCE_EXPENSE = "VEHICLE_RUNNING_AND_MAINTENANCE_EXPENSE",
    MISCELLANEOUS_EXPENSE = "MISCELLANEOUS_EXPENSE",
}

export enum Frequency {
    ONCE_OFF = "ONCE_OFF",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    YEARLY = "YEARLY",
}

export enum ExpenseStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    CANCELLED = "CANCELLED",
    DRAFT = "DRAFT",
    REJECTED = "REJECTED",
}

export type ClientExpenseTab = "drafts" | "pending" | "approved" | "cancelled" | "rejected";

export enum ClientName {
    ADM_Wild_Flavors_Kenya_Limited = "ADM_Wild_Flavors_Kenya_Limited",
    Africa_Banking_Corporation_ABC_Bank = "Africa_Banking_Corporation_ABC_Bank",
    African_Population_and_Health_Research_Centre_APHRC = "African_Population_and_Health_Research_Centre_APHRC",
    Alma_Wangu_Ngare = "Alma_Wangu_Ngare",
    Athena_Lab_Llc = "Athena_Lab_Llc",
    Cloudhop = "Cloudhop",
    Commercial_International_Bank_CIB_Kenya_Limited = "Commercial_International_Bank_CIB_Kenya_Limited",
    Dib_Bank_Kenya = "Dib_Bank_Kenya",
    Digital_Divide_Data_Kenya_Limited_DDD = "Digital_Divide_Data_Kenya_Limited_DDD",
    Dp_World = "Dp_World",
    Gulf_African_Bank = "Gulf_African_Bank",
    GZI_Kenya_Limited = "GZI_Kenya_Limited",
    Helium_Health_Limited = "Helium_Health_Limited",
    HF_Group = "HF_Group",
    Highlands_Drinks_Limited = "Highlands_Drinks_Limited",
    iCOLO_Limited_Kenya = "iCOLO_Limited_Kenya",
    Kenya_Tea_Development_Agency_KTDA = "Kenya_Tea_Development_Agency_KTDA",
    Kijani_Holdings_Limited = "Kijani_Holdings_Limited",
    Angrac_Company_Limited = "Angrac_Company_Limited",
    Laomai_Limited = "Laomai_Limited",
    Kyosk_Digital_Service_Limited = "Kyosk_Digital_Service_Limited",
    Maonga_Ndonye_Associates = "Maonga_Ndonye_Associates",
    Maple_Leaf_Educonnect_Limited = "Maple_Leaf_Educonnect_Limited",
    Motion_Industrial = "Motion_Industrial",
    Novartis_Kenya_Limited = "Novartis_Kenya_Limited",
    Ochieng_Abuodha_And_Associates_Limited = "Ochieng_Abuodha_And_Associates_Limited",
    Planate_Management_Group = "Planate_Management_Group",
    Riley_Falcon_Security_Services_Limited = "Riley_Falcon_Security_Services_Limited",
    Rise_And_Learn_Global = "Rise_And_Learn_Global",
    Salix_Data_Africa_Limited = "Salix_Data_Africa_Limited",
    Seamlesshr = "Seamlesshr",
    Strathmore_University = "Strathmore_University",
    Sun_King_Greenlight_Planet = "Sun_King_Greenlight_Planet",
    Surgipharm = "Surgipharm",
    Trademark_Africa_Limited = "Trademark_Africa_Limited",
    Virtual_Pay = "Virtual_Pay",
    Zanifu_Limited = "Zanifu_Limited",
}

export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';

// ======================== MAIN ENTITIES ========================

export interface ClientExpense {
    id: number;
    referenceNumber?: string | null;
    agentName: string;
    kraPin?: string | null;
    candidateName: string;
    clientName: string;
    clientListId?: number | null;
    date: string;
    expenseDetails?: string | null;
    expenseCheck: ExpenseCheck;
    expenseDescription?: string | null;
    institutionName: string;
    paymentMode: PaymentMode;
    paymentModeDescription: string;
    amount: number;
    currency: string;
    totalAmountPaid: number;
    paymentStatus: PaymentStatus;
    expenseStatus: ExpenseStatus;
    mpesaFee?: number | null;
    createdAt?: string;
    updatedAt?: string;
    bankAccountId?: number | null;
    cashAccountId?: number | null;
    mobileAccountId?: number | null;
    otherAccountId?: number | null;
    createdByAccounts?: { name: string } | null;
    createdByStaff?: { name: string } | null;
    createdByAdmin?: { name: string } | null;
    approvedByAdmin?: { name: string } | null;
    approvedByAccounts?: { name: string } | null;
    approvedByStaff?: { name: string } | null;
    supplier?: { name: string } | null;
    clientList?: { clientName: string; customClientName?: string | null } | null;
    cashAccount?: { id: number; accountName: string; accountNumber: string; currency: string; balance: string } | null;
    bankAccount?: { id: number; bankName: string; accountNumber: string; currency: string; balance: string } | null;
    proofFiles?: ProofFile[];
}

export interface ClientExpenseFilters {
    page?: number;
    limit?: number;
    tab?: ClientExpenseTab;
    period?: string;
    search?: string;
    agentName?: string;
    candidateName?: string;
    expenseCheck?: ExpenseCheck;
    paymentMode?: PaymentMode;

    // ✅ ADD THESE
    cashAccountId?: number;
    bankAccountId?: number;
    mobileAccountId?: number;
    otherAccountId?: number;
}

export interface ClientExpensesResponse {
    expenses: ClientExpense[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ClientExpenseFormProps {
    expense?: any | null;
    initialData?: ClientExpense | null;
    isEditMode?: boolean;
    onClose: () => void;
}

export interface Attendance {
    id: number;
    adminCognitoId: string | null;
    accountsCognitoId: string | null;
    staffCognitoId: string | null;
    userCognitoId: string | null;
    checkInTime: string | null;
    checkOutTime: string | null;
    totalHours: number | null;
    status: AttendanceStatus;
    checkInLat: number | null;
    checkInLng: number | null;
    checkOutLat: number | null;
    checkOutLng: number | null;
    breakType: BreakType;
    autoCheckedOut: boolean;
    admin: User | null;
    accounts: User | null;
    staff: User | null;
    user: User | null;
}


export interface StickyNote {
    id: number;                    // ← match Prisma autoincrement
    title: string;
    content: string;
    color: string;
    isPinned: boolean;
    width: number;
    height: number;
    posX: number;
    posY: number;
    font: 'handwriting' | 'mono' | 'serif' | 'sans';
    rotation: number;              // degrees, usually 0–360 or -180–180
    reminderAt: Date | null;
    createdAt: Date;
    updatedAt: Date;

    sharedBy?: {
        name: string;
        email?: string;
        role: 'admin' | 'staff' | 'accounts';
    } | null;
    owner?: {
        cognitoId: string;
        role: 'admin' | 'staff' | 'accounts';
        name?: string;
    };
    permission?: 'OWNER' | 'EDIT' | 'VIEW';
    isShared?: boolean;
}

export interface StickyNoteCreateInput {
    title: string;
    content: string;
    color?: string;
    isPinned?: boolean;
    width?: number;
    height?: number;
    posX?: number;
    posY?: number;
    font?: 'handwriting' | 'mono' | 'serif' | 'sans';
    rotation?: number;
    reminderAt?: string | null;
}

export interface StickyNoteUpdateInput {
    title?: string;
    content?: string;
    color?: string;
    isPinned?: boolean;
    width?: number;
    height?: number;
    posX?: number;
    posY?: number;
    font?: 'handwriting' | 'mono' | 'serif' | 'sans';
    rotation?: number;
    reminderAt?: string | null;
    isArchived?: boolean;
}

export interface SonnerToastOptions {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    duration?: number;
    closeButton?: boolean;
    onDismiss?: () => void;
    onAutoClose?: () => void;
}

export type StickyNoteInput = StickyNoteCreateInput;

export interface StickyNoteInputLoose
    extends Partial<StickyNoteCreateInput> {
    id?: number;           // for updates
}

export const DEFAULT_STICKY_NOTE: Partial<StickyNote> = {
    color: '#fef08a',
    isPinned: false,
    width: 240,
    height: 240,
    posX: 100,
    posY: 100,
    font: 'handwriting',
    rotation: 0,
};

export interface FrequentSession {
    cognitoId: string;
    name: string;
    sessionCount: number;
}

export interface AttendanceSummary {
    totalHours: number;
    sessionCount: number;
    averageSessionDuration: number;
    complianceRate: number;
}

export interface AttendanceTrends {
    byDayOfWeek: { day: string; count: number; totalHours: number }[];
    byHourOfDay: { hour: number; count: number }[];
    byWeekOfMonth: { week: number; count: number; totalHours: number }[];
}

export interface LateCheckIns {
    lateCheckIns: number;
}

export interface AutoCheckoutReport {
    autoCheckouts: number;
}

export interface BreakAnalytics {
    totalBreaks: number;
    byType: Record<string, number>;
}

export interface UserActivityStatus {
    totalUsers: number;
    checkedIn: number;
    onBreak: number;
    checkedOut: number;
}

export interface Invoice {
    id: number;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    clientExpenseId: number;
    clientListId?: number | null;
    createdByCognitoId?: string | null;
    senderName: string;
    senderAddress: string;
    receiverName: string;
    receiverAddress: string;
    referenceNumber?: string | null;
    description?: string | null;
    currency: string;
    subTotal: number;
    taxAmount: number;
    totalAmount: number;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    clientExpense?: { id: number; clientName: string; expenseDescription: string; amount: number; currency: string } | null;
    clientList?: { id: number; name: string } | null;
    createdByAdmin?: { name: string } | null;
    createdByAccounts?: { name: string } | null;
    createdByStaff?: { name: string } | null;
    items: InvoiceItem[];
    isDraft?: boolean;
}

export interface InvoiceItem {
    id: number;
    invoiceId: number;
    itemName: string;
    itemType?: ItemType;
    quantity: number;
    unitPrice: number;
    total: number;
    createdAt: string;
    updatedAt: string;
}

export interface InvoiceFilters {
    page?: number;
    limit?: number;
    clientName?: string;
    includeDrafts?: boolean;
}

export interface AuditLogFilters {
    page: number;
    limit?: number;
    entity?: string;
    entityId?: string;
}

export interface ClientExpenseFormData {
    agentName: string;
    date: string;
    expenseDetails: string;
    expenseName: string;
    institutionName: string;
    reasonForPayment: string;
    amount: string;
    currency: string;
    totalAmount: string;
    totalAmountPaid: string;
    frequency: Frequency;
    paymentMode: PaymentMode;
    itemType: ItemType;
    accountType: AccountType;
    kraPin?: string;
    referenceNumber?: string;
    paymentModeDescription?: string;
    lpoStatus?: string;
    supplierId?: number;
    proofFile?: File;
}

export interface AttendanceReportRecord {
    id: number;
    userId: string | null;
    name: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    totalHours: number | null;
    status: AttendanceStatus;
    breakType?: BreakType;
    autoCheckedOut: boolean;
}

export interface AttendanceResponse {
    records: Attendance[];
    total: number;
}

export interface FrequentSessionsResponse {
    records: FrequentSession[];
    total: number;
}

export interface AttendanceReportResponse {
    report: AttendanceReportRecord[];
    total: number;
}

export interface AttendanceStatusRecord {
    employeeId: string;
    name: string;
    status: AttendanceStatus;
    checkInTime?: string;
}

export interface AttendanceFilter {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    status?: AttendanceStatus;
    staffCognitoId?: string;
    missingCheckout?: boolean;
    page?: number;
    limit?: number;
}

export interface AttendanceInsight {
    employeeId: string;
    name: string;
    date: string;
    checkInTime?: string;
    hours?: number;
}

export interface BankAccountsResponse {
    accounts: BankAccount[];
    total: number;
    totalPages: number;
}

export interface User {
    id: string;
    role: "admin" | "accounts" | "staff";
    name?: string;
    email?: string;
    cognitoId?: string;
}

export interface CashAccount {
    id: number;
    accountName: string;
    accountNumber?: string | null;
    currency: string;
    balance: string;
    description?: string | null;

    /** Enterprise Status Fields */
    status: AccountStatus;
    isActive: boolean;
    closedAt?: string | null;
    closedByAdminCognitoId?: string | null;
    closedByAccountsCognitoId?: string | null;
    closureReason?: string | null;
    closureNotes?: string | null;

    createdAt: string;
    updatedAt: string;

    createdByAdmin?: User | null;
    createdByAccounts?: User | null;

    /** Computed / Optional fields */
    transactionCount?: number;
    lastTransactionDate?: string | null;
}

export interface CashAccountDailyBalance {
    id?: number;
    cashAccountId: number;
    date: string;
    openingBalance: string;
    closingBalance: string;
    netMovement: string;
    transactionCount: number;
    isFinalized: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DepositResponse {
    transaction: {
        id: number;
        amount: string;
        currency: string;
        payee: string;
        paymentMode: string;
        status: string;
        description?: string | null;
        date: string;
        cashAccountId: number;
        proofFileId?: number | null;
        createdAt: string;
        updatedAt: string;
        createdByAdminCognitoId?: string | null;
        createdByAccountsCognitoId?: string | null;
    };
    account: CashAccount;
    dailyBalance: CashAccountDailyBalance;
}

export interface CashAccountsResponse {
    accounts: CashAccount[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface DailyBalanceResponse {
    cashAccountId: number;
    accountName: string;
    currency: string;
    currentBalance: string;
    requestedDate: string;
    openingBalance: string;
    closingBalance: string | null;
    netMovement: string;
    transactionCount: number;
    note?: string;
}

export interface ChatMessage {
    id: number;
    roomId: number;
    senderType: "USER" | "GUEST" | "ADMIN" | "ACCOUNTS" | "STAFF";
    senderId: string;
    content: string;
    createdAt: string;
    read: boolean;
}

export interface TransactionFilters {
    page?: number;
    limit?: number;
    search?: string;
    expenseId?: number;
    bankAccountId?: number;
    cashAccountId?: number;
}

export interface BankAccount {
    id: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    currency: string;
    balance: string;
    createdAt: string;
    updatedAt: string;
    createdByAdmin?: { cognitoId: string; name: string } | null;
    createdByAccounts?: { cognitoId: string; name: string } | null;
}

export interface ApiErrorResponse {
    message: string;
    status?: number;
    error?: string;
}

export interface AuditLog {
    id: number;
    actorUserCognitoId?: string | null;
    actorAdminCognitoId?: string | null;
    actorAccountsCognitoId?: string | null;
    actorStaffCognitoId?: string | null;
    action: string;
    entity: string;
    entityId: string;
    meta?: any;
    createdAt: string;
    actorUser?: User | null;
    actorAdmin?: any | null;
    actorAccounts?: any | null;
    actorStaff?: any | null;
}

export interface EmailList {
    id: number;
    brevoListId: number;
    name: string;
    createdAt: string;
    deletedAt?: string | null;
    adminCognitoId: string;
    users: User[];
    guestUsers: any[];
    accounts: any[];
    staff: any[];
    emailCampaigns: any[];
    admin: any;
}

export interface GuestUser {
    id: number;
    name: string;
    email: string;
    phoneNumber?: string | null;
    createdAt: string;
    updatedAt: string;
    chatRooms: any[];
    emailSends: any[];
    emailLists: EmailList[];
}

export interface ProofFile {
    id: number;
    expenseType?: ExpenseType | null;
    clientExpenseId?: number | null;
    operationalExpenseId?: number | null;
    quotationId?: number | null;
    s3Key: string;
    url: string;
    uploadedByUserCognitoId?: string | null;
    uploadedByAdminCognitoId?: string | null;
    uploadedByAccountsCognitoId?: string | null;
    uploadedByStaffCognitoId?: string | null;
    createdAt: string;
    clientExpense?: ClientExpense | null;
    operationalExpense?: OperationalExpense | null;
    quotation?: any | null;
    uploadedByUser?: User | null;
    uploadedByAdmin?: any | null;
    uploadedByAccounts?: any | null;
    uploadedByStaff?: any | null;
    createdByUser?: User | null;
    createdByAdmin?: any | null;
    createdByAccounts?: any | null;
    createdByStaff?: any | null;
    transaction?: Transaction | null;
}

export interface Transaction {
    id: number;
    amount: string;
    currency: string;
    payee: string;
    paymentMode: PaymentMode;
    status: PaymentStatus;
    date: string;
    expenseId?: number | null;
    bankAccountId?: number | null;
    cashAccountId?: number | null;
    mobileAccountId?: number | null;
    otherAccountId?: number | null;
    checkoutRequestId?: string | null;
    createdAt: string;
    updatedAt: string;
    expense?: OperationalExpense | null;
    proofFile?: ProofFile | null;
    bankAccount?: BankAccount | null;
    cashAccount?: CashAccount | null;
    mobileAccount?: any | null;
    otherAccount?: any | null;
    description?: string;
    createdByAdminCognitoId?: string | null;
    createdByAccountsCognitoId?: string | null;
}

export interface TransactionsResponse {
    transactions: Transaction[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface OperationalExpense {
    id: number;
    referenceNumber?: string;
    agentName: string;
    kraPin?: string | null;
    date: string;
    expenseDetails: string;
    expenseName: string;
    institutionName: string;
    reasonForPayment: string;
    frequency: Frequency;
    paymentMode: PaymentMode;
    paymentModeDescription?: string | null;
    amount: string;
    currency: string;
    totalAmount: string;
    totalAmountPaid: string;
    supplierId?: number | null;
    paymentStatus: PaymentStatus;
    expenseStatus: ExpenseStatus;
    lpoStatus?: string | null;
    createdAt: string;
    updatedAt: string;
    supplier?: { id: number; name: string } | null;
    createdByAdmin?: { name: string } | null;
    createdByAccounts?: { name: string } | null;
    createdByStaff?: { name: string } | null;
    approvedByAdmin?: { name: string } | null;
    approvedByAccounts?: { name: string } | null;
    approvedByStaff?: { name: string } | null;
    itemType?: ItemType | null;
    accountType?: AccountType | null;
    bankAccountId?: number | null;
    cashAccountId?: number | null;
    mobileAccountId?: number | null;
    otherAccountId?: number | null;
    bankAccount?: BankAccount | null;
    cashAccount?: CashAccount | null;
    mobileAccount?: any | null;
    otherAccount?: any | null;
    transactions?: { id: number }[];
}

export interface OperationalExpenseFilters {
    page?: number;
    limit?: number;
    period?: string;
    agentName?: string;
    kraPin?: string;
    expenseName?: string;
    expenseDescription?: string;
    frequency?: Frequency;
    paymentMode?: PaymentMode;
    search?: string;
    includeDrafts?: boolean;
    expenseStatus?: ExpenseStatus | ExpenseStatus[];
    accountType?: AccountType;
    paymentAccountType?: "BANK" | "CASH" | "MOBILE" | "OTHER";

    // ✅ ADD THESE
    cashAccountId?: number;
    bankAccountId?: number;
    mobileAccountId?: number;
    otherAccountId?: number;
}

export interface OperationalExpensesState {
    expenses: OperationalExpense[];
    selectedExpense: OperationalExpense | null;
    filters: OperationalExpenseFilters;
    bankAccounts: BankAccount[];
    cashAccounts: CashAccount[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface Author {
    id: number;
    name: string;
    email: string;
    bio?: string | null;
    profilePicture?: string | null;
    createdAt: string;
    updatedAt: string;
    blogs?: any[];
}

export interface Blog {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string | null;
    coverImage?: string | null;
    coverImageSignedUrl?: string | null;
    videoUrl?: string | null;
    published: boolean;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    adminCognitoId: string;
    authorId?: number | null;
    admin: any;
    author?: Author | null;
}

export interface BlogsResponse {
    data: Blog[];
    page: number;
    limit: number;
    totalPages: number;
    total: number;
}

export interface MobileMoneyAccount {
    id: number;
    accountName: string;
    phoneNumber: string;
    provider: string;
}

export interface Currency {
    code: string;
    name: string;
}

export interface Supplier {
    id: number;
    name: string;
    email?: string | null;
    contactPerson?: string | null;
    phone?: string | null;
    address?: string | null;
    kraPin?: string | null;
}

export interface ChatRoom {
    id: number;
    createdAt: string;
    updatedAt: string;
    guestUserId?: number | null;
    userCognitoId?: string | null;
    adminCognitoId?: string | null;
    accountsCognitoId?: string | null;
    staffCognitoId?: string | null;
    guestUser?: { id: number; name: string; email: string } | null;
    user?: { name: string } | null;
    admin?: any | null;
    accounts?: any | null;
    staff?: any | null;
    messages: ChatMessage[];
}

export interface Contact {
    id: number;
    name: string;
    email: string;
    message?: string | null;
    subject?: string | null;
    interests?: string | null;
    privacyConsent: boolean;
    userCognitoId?: string | null;
    createdAt: string;
    deletedAt?: string | null;
    user?: User | null;
}

export interface EmailCampaign {
    id: number;
    brevoCampaignId: number;
    name: string;
    subject: string;
    htmlContent: string;
    status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";
    createdAt: string;
    updatedAt: string;
    adminCognitoId: string;
    emailListId: number;
    scheduledAt?: string | null;
    emailSends: any[];
    admin: any;
    emailList: EmailList;
    attachments: any[];
}

export interface ClientList {
    id: number;

    // Predefined client from enum (optional)
    clientName: ClientName | null;

    // Custom name when not using predefined
    customClientName?: string | null;

    contactEmail?: string | null;
    contactPhone?: string | null;
    address?: string | null;
    kraPin?: string | null;

    // NEW: S3 image URL (publicly accessible)
    imageUrl?: string | null;

    isActive: boolean;

    // Creator tracking (only one will be populated)
    createdByAdminCognitoId?: string | null;
    createdByAccountsCognitoId?: string | null;
    createdByStaffCognitoId?: string | null;

    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;

    // Relations (populated via include in Prisma)
    createdByAdmin?: { cognitoId: string; name: string } | null;
    createdByAccounts?: { cognitoId: string; name: string } | null;
    createdByStaff?: { name: string } | null;

    clientExpenses?: any[];
    invoices?: any[];
}

export interface ClientFilters {
    page?: number;
    limit?: number;
    clientName?: ClientName | ClientName[];
    isActive?: boolean;
    search?: string;
    createdByAdminCognitoId?: string;
    createdByAccountsCognitoId?: string;
    createdByStaffCognitoId?: string;
}

export interface FiltersState {
    location: string;
    beds: string;
    baths: string;
    propertyType: string;
    amenities: string[];
    availableFrom: string;
    priceRange: [number, number] | [null, null];
    squareFeet: [number, number] | [null, null];
    coordinates: [number, number];
}

export interface ClientExpensesState {
    expenses: ClientExpense[];
    selectedExpense: ClientExpense | null;
    filters: { page: number; limit: number; tab: "drafts" | "pending" | "approved"; search?: string };
    total: number;
    totalPages: number;
    page: number;
    limit: number;
}

export interface AttendanceState {
    records: Attendance[];
    filters: AttendanceFilter;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface InitialStateTypes {
    filters: FiltersState;
    isFiltersFullOpen: boolean;
    viewMode: "grid" | "list";
    operationalExpenses: OperationalExpensesState;
    clientExpenses: ClientExpensesState;
    attendance: AttendanceState;
}