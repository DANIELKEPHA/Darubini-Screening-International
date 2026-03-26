import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
    Attendance, AttendanceFilter,
    BankAccount, CashAccount,
    ClientExpense,
    FiltersState,
    InitialStateTypes,
    OperationalExpense,
    OperationalExpenseFilters
} from "@/state/types";


export const initialState: InitialStateTypes = {
    filters: {
        location: "Mombasa",
        beds: "any",
        baths: "any",
        propertyType: "any",
        amenities: [],
        availableFrom: "any",
        priceRange: [null, null],
        squareFeet: [null, null],
        coordinates: [39.6682, -4.0435],
    },
    isFiltersFullOpen: false,
    viewMode: "grid",

    operationalExpenses: {
        expenses: [] as OperationalExpense[],  // your own expense type
        selectedExpense: null,
        filters: {
            page: 1,
            limit: 10,
        },
        total: 0,
        totalPages: 1,
        page: 1,
        limit: 10,
        bankAccounts: [],
        cashAccounts: [],
    },

    clientExpenses: {
        expenses: [] as ClientExpense[],
        selectedExpense: null,
        filters: {
            page: 1,
            limit: 15,
            tab: "pending",
            search: "",
        },
        total: 0,
        totalPages: 1,
        page: 1,
        limit: 15,
    },

    attendance: {
        records: [],
        filters: {
            page: 1,
            limit: 50,
        },
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 1,
    },
};

const globalSlice = createSlice({
    name: "global",
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<FiltersState>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        setIsFiltersFullOpen: (state, action: PayloadAction<boolean>) => {
            state.isFiltersFullOpen = action.payload;
        },
        setViewMode: (state, action: PayloadAction<"grid" | "list">) => {
            state.viewMode = action.payload;
        },
        setOperationalExpenses: (
            state,
            action: PayloadAction<{
                expenses: OperationalExpense[];
                total: number;
                page: number;
                totalPages: number;
            }>,
        ) => {
            state.operationalExpenses.expenses = action.payload.expenses;
            state.operationalExpenses.total = action.payload.total;
            state.operationalExpenses.page = action.payload.page;
            state.operationalExpenses.totalPages = action.payload.totalPages;
        },
        setSelectedExpense: (state, action: PayloadAction<OperationalExpense | null>) => {
            state.operationalExpenses.selectedExpense = action.payload;
        },
        setOperationalExpenseFilters: (
            state,
            action: PayloadAction<Partial<OperationalExpenseFilters>>,
        ) => {
            state.operationalExpenses.filters = { ...state.operationalExpenses.filters, ...action.payload };
        },
        clearOperationalExpenseFilters: (state) => {
            state.operationalExpenses.filters = initialState.operationalExpenses.filters;
        },
        setBankAccounts: (state, action: PayloadAction<BankAccount[]>) => {
            state.operationalExpenses.bankAccounts = action.payload;
        },
        setCashAccounts: (state, action: PayloadAction<CashAccount[]>) => {
            state.operationalExpenses.cashAccounts = action.payload;
        },
        clearBankAccounts: (state) => {
            state.operationalExpenses.bankAccounts = [];
        },
        clearCashAccounts: (state) => {
            state.operationalExpenses.cashAccounts = [];
        },
        setAttendanceRecords: (
            state,
            action: PayloadAction<{
                records: Attendance[];
                total: number;
                page: number;
                limit: number;
                totalPages: number;
            }>,
        ) => {
            state.attendance.records = action.payload.records;
            state.attendance.total = action.payload.total;
            state.attendance.page = action.payload.page;
            state.attendance.limit = action.payload.limit;
            state.attendance.totalPages = action.payload.totalPages;
        },
        setAttendanceFilters: (
            state,
            action: PayloadAction<Partial<AttendanceFilter>>,
        ) => {
            state.attendance.filters = { ...state.attendance.filters, ...action.payload };
        },
        clearAttendanceFilters: (state) => {
            state.attendance.filters = initialState.attendance.filters;
        },
    },
});

export const {
    setFilters,
    setIsFiltersFullOpen,
    setViewMode,
    setOperationalExpenses,
    setSelectedExpense,
    setOperationalExpenseFilters,
    clearOperationalExpenseFilters,
    setBankAccounts,
    setCashAccounts,
    clearBankAccounts,
    clearCashAccounts,
    setAttendanceRecords,
    setAttendanceFilters,
    clearAttendanceFilters,
} = globalSlice.actions;

export default globalSlice.reducer;

export * from "./types";
export * from "./api";
