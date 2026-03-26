"use client";

import { usePathname } from "next/navigation";
import React, { useState } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "./ui/sidebar";
import {
    Menu,
    Settings,
    X,
    DollarSign,
    LayoutDashboard,
    Plus,
    Archive,
    CreditCard,
    ShoppingCart,
    PieChart,
    User,
    FileBarChart,
    Calculator,
    ClipboardList,
    MessageSquare,
    ChevronDown,
    ChevronRight, UserRoundPen,
} from "lucide-react";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useGetAuthUserQuery } from "@/state/api";

interface NavLink {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href: string;
    subLinks?: { label: string; href: string }[];
}

const AppSidebar = () => {
    const pathname = usePathname();
    const { toggleSidebar, open } = useSidebar();
    const { data: authUser, isLoading } = useGetAuthUserQuery();
    const [isPurchasesOpen, setIsPurchasesOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    // Determine userType dynamically from authUser.userRole
    const userType = authUser?.userRole?.toLowerCase() as
        | "admin"
        | "user"
        | "accounts"
        | "staff"
        | undefined;

    const navLinks: NavLink[] = (() => {
        switch (userType) {
            case "admin":
                return [
                    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
                    {   icon: Calculator,
                        label: "Accounting",
                        href: "/admin/Items",
                        subLinks: [
                            { label: "Client Expenses", href: "/admin/client-expenses" },
                            { label: "Operational Expenses", href: "/admin/operational-expenses" },
                            { label: "Clients", href: "/admin/clients" },
                        ]
                    },
                    {
                        icon: CreditCard,
                        label: "Accounts",
                        href: "/admin/accounts",
                        subLinks: [
                            { label: "Bank", href: "/admin/accounts/banking" },
                            { label: "Cash", href: "/admin/accounts/cash" },
                            { label: "Mobile Money", href: "/admin/accounts/mobile-money" },
                            { label: "Others", href: "/admin/accounts/others" },
                        ],
                    },
                    {
                        icon: Archive,
                        label: "Purchases",
                        href: "/admin/purchases",
                        subLinks: [
                            { label: "Expenses", href: "/admin/purchases/expenses" },
                            { label: "Recurring Expenses", href: "/admin/purchases/recurring-expenses" },
                            { label: "Purchase Orders", href: "/admin/purchases/purchase-orders" },
                            { label: "Bills", href: "/admin/purchases/bills" },
                            { label: "Payment Mode", href: "/admin/purchases/payment-mode" },
                            { label: "Recurring Bills", href: "/admin/purchases/recurring-bills" },
                        ],
                    },
                    { icon: PieChart, label: "Reports", href: "/admin/reports" },
                    { icon: Settings, label: "Settings", href: "/admin/settings" },
                ];
            case "accounts":
                return [
                    { icon: LayoutDashboard, label: "Dashboard", href: "/accounts/dashboard" },
                    {   icon: Calculator,
                        label: "Accounting",
                        href: "/admin/Items",
                        subLinks: [
                            { label: "Client Expenses", href: "/accounts/client-expenses" },
                            { label: "Operational Expenses", href: "/accounts/operational-expenses" },
                            { label: "Clients", href: "/accounts/clients" },
                        ]
                    },
                    {
                        icon: CreditCard,
                        label: "Accounts",
                        href: "/accounts/accounts",
                        subLinks: [
                            { label: "Bank", href: "/accounts/accounts/banking" },
                            { label: "Cash", href: "/accounts/accounts/cash" },
                            { label: "Mobile Money", href: "/accounts/accounts/mobile-money" },
                            { label: "Others", href: "/accounts/accounts/others" },
                        ],
                    },
                    {
                        icon: Archive,
                        label: "Purchases",
                        href: "/accounts/purchases",
                        subLinks: [
                            { label: "Expenses", href: "/accounts/purchases/expenses" },
                            { label: "Recurring Expenses", href: "/accounts/purchases/recurring-expenses" },
                            { label: "Purchase Orders", href: "/accounts/purchases/purchase-orders" },
                            { label: "Bills", href: "/accounts/purchases/bills" },
                            { label: "Payment Mode", href: "/accounts/purchases/payment-mode" },
                            { label: "Recurring Bills", href: "/accounts/purchases/recurring-bills" },
                        ],
                    },
                    { icon: PieChart, label: "Reports", href: "/accounts/reports" },
                    { icon: Settings, label: "Settings", href: "/accounts/settings" },
                ];
            case "staff":
                return [
                    { icon: LayoutDashboard, label: "Dashboard", href: "/staff/dashboard" },
                    {   icon: UserRoundPen,
                        label: "My Profile",
                        href: "/staff/profile",
                        subLinks: [
                            { label: "Request Leave", href: "/staff/profile/profile-request" },
                            { label: "My Calender", href: "/staff/profile/calender" },
                        ]
                    },
                    {   icon: Calculator,
                        label: "Accounting",
                        href: "/staff/Items",
                        subLinks: [
                            { label: "Client Expenses", href: "/staff/client-expenses" },
                            { label: "Operational Expenses", href: "/staff/operational-expenses" },
                            { label: "Clients", href: "/staff/clients" },
                        ]
                    },
                    {
                        icon: Archive,
                        label: "Purchases",
                        href: "/staff/purchases",
                        subLinks: [
                            { label: "Expenses", href: "/staff/purchases/expenses" },
                            { label: "Recurring Expenses", href: "/staff/purchases/recurring-expenses" },
                            { label: "Purchase Orders", href: "/staff/purchases/purchase-orders" },
                            { label: "Bills", href: "/staff/purchases/bills" },
                            { label: "Payment Mode", href: "/staff/purchases/payment-mode" },
                            { label: "Recurring Bills", href: "/staff/purchases/recurring-bills" },
                        ],
                    },
                    { icon: ClipboardList, label: "Tasks", href: "/staff/tasks" },
                    { icon: Settings, label: "Settings", href: "/staff/settings" },
                ];
            case "user":
                return [
                    { icon: LayoutDashboard, label: "Dashboard", href: "/user/dashboard" },
                    { icon: MessageSquare, label: "Messages", href: "/user/notes" },
                    { icon: FileBarChart, label: "Reports", href: "/user/reports" },
                    { icon: Settings, label: "Settings", href: "/user/settings" },
                ];
            default:
                return [];
        }
    })();

    const getUserTitle = () => {
        switch (userType) {
            case "admin": return "Administrator";
            case "accounts": return "Accounts";
            case "staff": return "Staff";
            case "user": return "User";
            default: return "Guest";
        }
    };

    const toggleSubMenu = (label: string) => {
        setExpandedItems(prev => ({ ...prev, [label]: !prev[label] }));
    };

    return (
        <Sidebar
            collapsible="icon"
            className="fixed left-0 bg-white border-r border-gray-100 shadow-lg transition-all duration-300 ease-in-out"
            style={{
                top: `${NAVBAR_HEIGHT}px`,
                height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            }}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div
                            className={cn(
                                "flex min-h-[56px] w-full items-center py-3 border-b border-gray-100",
                                open ? "justify-end px-6" : "justify-center"
                            )}
                        >
                            {open ? (
                                <button
                                    className="hover:bg-gray-100 p-2 rounded-md transition-all duration-200 hover:scale-105 shadow-sm"
                                    onClick={() => toggleSidebar()}
                                >
                                    <X className="h-5 w-5 text-gray-600" />
                                </button>
                            ) : (
                                <button
                                    className="hover:bg-gray-100 p-2 rounded-md transition-all duration-200 hover:scale-105 shadow-sm"
                                    onClick={() => toggleSidebar()}
                                >
                                    <Menu className="h-5 w-5 text-gray-600" />
                                </button>
                            )}
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="flex flex-col">
                {/* Main navigation */}
                <SidebarMenu className="flex-1">
                    {navLinks
                        .filter((link) => link.label !== "Settings")
                        .map((link) => {
                            const isActive = pathname === link.href || (link.subLinks && link.subLinks.some((subLink) => pathname === subLink.href));
                            const hasSubLinks = link.subLinks && link.subLinks.length > 0;
                            const isExpanded = expandedItems[link.label];

                            return (
                                <SidebarMenuItem key={link.href}>
                                    <SidebarMenuButton
                                        asChild
                                        className={cn(
                                            "flex items-center px-6 py-4 my-1 mx-2 rounded-lg transition-all duration-300 ease-in-out transform",
                                            isActive
                                                ? "bg-primary-50 text-primary-600 border-r-2 border-primary-600 shadow-md"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-sm",
                                            open ? "" : "justify-center",
                                            "hover:-translate-y-0.5"
                                        )}
                                        tooltip={!open ? link.label : undefined}
                                    >
                                        <div className="w-full">
                                            {hasSubLinks ? (
                                                <div className="flex items-center justify-between w-full">

                                                    {/* ✅ LEFT → NAVIGATE */}
                                                    <Link
                                                        href={link.href}
                                                        className="flex items-center gap-3 flex-1"
                                                    >
                                                        <link.icon
                                                            className={`h-5 w-5 flex-shrink-0 ${
                                                                isActive ? "text-primary-600" : "text-gray-500"
                                                            }`}
                                                        />

                                                        {open && (
                                                            <span
                                                                className={`font-medium text-sm ${
                                                                    isActive ? "text-primary-600" : "text-gray-700"
                                                                }`}
                                                            >
                                                            {link.label}
                                                        </span>
                                                        )}
                                                    </Link>

                                                    {/* ✅ RIGHT → TOGGLE */}
                                                    {open && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // 👈 important!
                                                                toggleSubMenu(link.label);
                                                            }}
                                                            className="p-1"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="h-4 w-4 text-gray-500" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4 text-gray-500" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <Link href={link.href} className="flex items-center gap-3 w-full" scroll={false}>
                                                    <link.icon
                                                        className={`h-5 w-5 flex-shrink-0 ${
                                                            isActive ? "text-primary-600" : "text-gray-500"
                                                        } transition-colors duration-200`}
                                                    />
                                                    {open && (
                                                        <span
                                                            className={`font-medium text-sm ${
                                                                isActive ? "text-primary-600" : "text-gray-700"
                                                            } transition-colors duration-200`}
                                                        >
                                                            {link.label}
                                                        </span>
                                                    )}
                                                </Link>
                                            )}
                                        </div>
                                    </SidebarMenuButton>
                                    {hasSubLinks && isExpanded && open && (
                                        <div className="ml-8 overflow-hidden transition-all duration-500 ease-in-out">
                                            {link.subLinks!.map((subLink) => {
                                                const isSubActive = pathname === subLink.href;
                                                return (
                                                    <SidebarMenuButton
                                                        key={subLink.href}
                                                        asChild
                                                        className={cn(
                                                            "flex items-center px-6 py-2 my-1 mx-2 rounded-lg transition-all duration-300 ease-in-out transform",
                                                            isSubActive
                                                                ? "bg-primary-50 text-primary-600 shadow-sm"
                                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800",
                                                            "hover:-translate-y-0.5"
                                                        )}
                                                    >
                                                        <Link href={subLink.href} scroll={false} className="w-full">
                                                            <span
                                                                className={`font-medium text-sm ${
                                                                    isSubActive ? "text-primary-600" : "text-gray-700"
                                                                } transition-colors duration-200`}
                                                            >
                                                                {subLink.label}
                                                            </span>
                                                        </Link>
                                                    </SidebarMenuButton>
                                                );
                                            })}
                                        </div>
                                    )}
                                </SidebarMenuItem>
                            );
                        })}
                </SidebarMenu>
                {/* Settings and user info at the bottom */}
                <div className="border-t border-gray-100 pt-2">
                    {/* Settings link */}
                    <SidebarMenu>
                        {navLinks
                            .filter((link) => link.label === "Settings")
                            .map((link) => {
                                const isActive = pathname === link.href;

                                return (
                                    <SidebarMenuItem key={link.href}>
                                        <SidebarMenuButton
                                            asChild
                                            className={cn(
                                                "flex items-center px-6 py-4 my-1 mx-2 rounded-lg transition-all duration-300 ease-in-out transform",
                                                isActive
                                                    ? "bg-primary-50 text-primary-600 border-r-2 border-primary-600 shadow-md"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-sm",
                                                open ? "" : "justify-center",
                                                "hover:-translate-y-0.5"
                                            )}
                                            tooltip={!open ? link.label : undefined}
                                        >
                                            <Link href={link.href} className="w-full" scroll={false}>
                                                <div className="flex items-center gap-3">
                                                    <link.icon
                                                        className={`h-5 w-5 flex-shrink-0 ${
                                                            isActive ? "text-primary-600" : "text-gray-500"
                                                        } transition-colors duration-200`}
                                                    />
                                                    {open && (
                                                        <span
                                                            className={`font-medium text-sm ${
                                                                isActive ? "text-primary-600" : "text-gray-700"
                                                            } transition-colors duration-200`}
                                                        >
                                                            {link.label}
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                    </SidebarMenu>

                    {/* User info section - now at the bottom */}
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <div className={cn(
                                "px-6 py-4 border-t border-gray-100 transition-all duration-300",
                                open ? "" : "flex justify-center"
                            )}>
                                {open ? (
                                    <div className="flex flex-col">
                                        {isLoading ? (
                                            <div className="space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                            </div>
                                        ) : authUser && userType ? (
                                            <>
                                                {/* User title/role */}
                                                <span className="text-xs font-medium uppercase text-gray-500 tracking-wide transition-colors duration-200">
                                                    {getUserTitle()}
                                                </span>

                                                {/* Username */}
                                                <h2 className="text-sm font-semibold text-gray-800 mt-1 truncate transition-colors duration-200">
                                                    {authUser.userInfo?.name || getUserTitle()}
                                                </h2>

                                                {/* Email */}
                                                <span className="text-xs text-gray-500 truncate block mt-1 transition-colors duration-200">
                                                    {authUser.userInfo?.email || "No email"}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-xs font-medium uppercase text-gray-500 tracking-wide transition-colors duration-200">
                                                    Guest
                                                </span>
                                                <h2 className="text-sm font-semibold text-gray-800 mt-1 transition-colors duration-200">Guest View</h2>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="transition-transform duration-300 hover:scale-110">
                                        <User className="h-5 w-5 text-gray-500 transition-colors duration-200" />
                                    </div>
                                )}
                            </div>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </div>
            </SidebarContent>
        </Sidebar>
    );
};

export default AppSidebar;