'use client';

import { NAVBAR_HEIGHT } from "@/lib/constants";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { useGetAuthUserQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import {
  Bell,
  ChevronDown,
    NotepadText,
  Home,
  UserCircle,
  Briefcase,
  Calculator,
  Files,
  Mail,
  Settings,
  LayoutDashboard,
  FileText,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { SidebarTrigger } from "./ui/sidebar";
import { Badge } from "./ui/badge";
import {useNotifications} from "@/state/useNotifications";

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const Navbar = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();
  const { notificationCount, resetNotifications } = useNotifications();

  const isDashboardPage = pathname.match(/^\/(admin|user|accounts|staff)/);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const publicLinks: NavLink[] = [
    { href: "/", label: "Home", icon: Home },
    { href: "/about", label: "About Us", icon: UserCircle },
    { href: "/our-solutions", label: "Our Solutions", icon: Briefcase },
    { href: "/resources", label: "Resources", icon: Files },
  ];

  const adminLinks: NavLink[] = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: Mail, label: "Emails", href: "/admin/emails" },
    { icon: FileText, label: "Blogs", href: "/admin/blogs" },
    { icon: Clock, label: "Chronos", href: "/admin/chronos" },
    { icon: Settings, label: "Profile", href: "/admin/settings" },
  ];

  const accountsLinks: NavLink[] = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/accounts/dashboard" },
    { icon: FileText, label: "Blogs", href: "/accounts/blogs" },
    { icon: Clock, label: "Chronos", href: "/accounts/chronos" },
    { icon: Settings, label: "Profile", href: "/accounts/settings" },
  ];

  const staffLinks: NavLink[] = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/staff/dashboard" },
    { icon: FileText, label: "Blogs", href: "/staff/blogs" },
    { icon: Clock, label: "Chronos", href: "/staff/chronos" },
    { icon: Settings, label: "Profile", href: "/staff/settings" },
  ];

  const userLinks: NavLink[] = [
    { icon: Settings, label: "Settings", href: "/user/settings" },
  ];

  const getNavLinks = () => {
    if (!authUser || !authUser.userRole) return publicLinks;
    const role = authUser.userRole.toLowerCase();
    switch (role) {
      case "admin":
        return adminLinks;
      case "accounts":
        return accountsLinks;
      case "staff":
        return staffLinks;
      case "user":
        return userLinks;
      default:
        return publicLinks;
    }
  };

  const getDashboardUrl = () => {
    if (!authUser || !authUser.userRole) return "/";
    const role = authUser.userRole.toLowerCase();
    switch (role) {
      case "admin":
        return "/admin/dashboard";
      case "accounts":
        return "/accounts/dashboard";
      case "staff":
        return "/staff/dashboard";
      case "user":
        return "/";
      default:
        return "/";
    }
  };

  return (
      <div
          className="fixed top-0 left-0 w-full z-50 bg-primary-800/90 backdrop-blur-md border-b border-primary-700/30 shadow-sm"
          style={{ height: `${NAVBAR_HEIGHT}px` }}
      >
        <div className="flex justify-between items-center w-full h-full px-6 lg:px-8 mx-auto max-w-7xl">
          <div className="flex items-center gap-6">
            {isDashboardPage && (
                <div className="lg:hidden">
                  <SidebarTrigger />
                </div>
            )}
            <Link href="/" className="flex items-center group">
              <div className="flex items-center gap-3">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-100 to-secondary-400 font-sligoil">
                Darubini Screening
              </span>
              </div>
            </Link>
            {isDashboardPage && authUser && !isLoading && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex items-center gap-2 bg-primary-800/50 hover:bg-primary-800 text-lg text-primary-100 hover:text-white"
                    onClick={() => router.push(getDashboardUrl())}
                >
                </Button>
            )}
          </div>

          <div className="hidden md:flex items-center gap-6">
            {isLoading ? (
                <p className="text-lg text-primary-200/80">Loading...</p>
            ) : authUser && authUser.userRole ? (
                <nav className="flex gap-6">
                  {getNavLinks().map((link) => (
                      <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center gap-2 text-base transition-colors duration-200 ${
                              pathname === link.href
                                  ? "text-secondary-400 font-semibold"
                                  : "text-primary-200 hover:text-secondary-400"
                          }`}
                      >
                        <link.icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                  ))}
                </nav>
            ) : (
                <nav className="flex gap-6">
                  {publicLinks.map((link) =>
                          link.href === "/resources" ? ( // Changed from "/" to "/resources"
                              <DropdownMenu key={link.href}>
                                <DropdownMenuTrigger className="flex items-center gap-2 text-base transition-colors duration-200 focus:outline-none group">
                                  <link.icon className="h-5 w-5 text-primary-200 group-hover:text-secondary-400" />
                                  <span
                                      className={`${
                                          pathname.startsWith(link.href)
                                              ? "text-secondary-400 font-semibold"
                                              : "text-primary-200 group-hover:text-secondary-400"
                                      }`}
                                  >
                {link.label}
              </span>
                                  <ChevronDown className="h-5 w-5 text-primary-200 group-hover:text-secondary-400" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="min-w-[200px] bg-primary-800 border border-primary-700 shadow-lg rounded-lg overflow-hidden"
                                    align="start"
                                >
                                  <DropdownMenuItem
                                      className="px-4 py-3 text-lg text-primary-100 hover:bg-primary-700 focus:bg-primary-700 cursor-pointer"
                                      onClick={() => router.push("/resources/blogs")}
                                  >
                                    Blog
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                          ) : (
                              <Link
                                  key={link.href}
                                  href={link.href}
                                  className={`flex items-center gap-2 text-base transition-colors duration-200 ${
                                      pathname === link.href
                                          ? "text-secondary-400 font-semibold"
                                          : "text-primary-200 hover:text-secondary-400"
                                  }`}
                              >
                                <link.icon className="h-5 w-5" />
                                {link.label}
                              </Link>
                          )
                  )}
                </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isLoading ? (
                <div className="w-9 h-9 rounded-full bg-primary-600 animate-pulse" />
            ) : authUser ? (
                <>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary-200 hover:text-secondary-400 hover:bg-primary-700 relative"
                      onClick={() => {
                        resetNotifications();
                        router.push("/notifications");
                      }}
                  >
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full text-xs"
                        >
                          {notificationCount}
                        </Badge>
                    )}
                  </Button>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary-200 hover:text-secondary-400 hover:bg-primary-700"
                      onClick={() => router.push("/notes")}
                  >
                    <NotepadText className="h-5 w-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none group">
                      <Avatar className="border-2 border-primary-600 group-hover:border-secondary-400 transition-colors">
                        <AvatarImage src={authUser.userInfo?.image} />
                        <AvatarFallback className="bg-primary-600 text-primary-100">
                          {authUser.userInfo?.name?.charAt(0)?.toUpperCase() ||
                              authUser.userRole?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:flex items-center gap-1">
                        <ChevronDown className="w-5 h-5 text-primary-300 group-hover:text-secondary-400 transition-colors" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="min-w-[240px] bg-primary-800 border border-primary-700 shadow-lg rounded-lg overflow-hidden"
                        align="end"
                    >
                      <div className="px-4 py-3 border-b border-primary-700">
                        <p className="text-base font-medium text-primary-100">
                          {authUser.userInfo?.name || "User"}
                        </p>
                        <p className="text-sm text-primary-300">
                          {authUser.userInfo?.email || "No email"}
                        </p>
                      </div>
                      <DropdownMenuItem
                          className="px-4 py-3 text-primary-100 hover:bg-primary-700 focus:bg-primary-700 cursor-pointer flex items-center gap-2"
                          onClick={() => router.push(getDashboardUrl(), { scroll: false })}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem
                          className="px-4 py-3 text-primary-100 hover:bg-primary-700 focus:bg-primary-700 cursor-pointer flex items-center gap-2"
                          onClick={() => router.push("/about", { scroll: false })}
                      >
                        <UserCircle className="w-4 h-4" />
                        About Us
                      </DropdownMenuItem>
                      <DropdownMenuItem
                          className="px-4 py-3 text-primary-100 hover:bg-primary-700 focus:bg-primary-700 cursor-pointer flex items-center gap-2"
                          onClick={() => router.push("/our-solutions", { scroll: false })}
                      >
                        <Briefcase className="w-4 h-4" />
                        Our Solutions
                      </DropdownMenuItem>
                      <DropdownMenuItem
                          className="px-4 py-3 text-primary-100 hover:bg-primary-700 focus:bg-primary-700 cursor-pointer flex items-center gap-2"
                          onClick={() => router.push("/resources/blogs", { scroll: false })}
                      >
                        <Files className="w-4 h-4" />
                        Resources
                      </DropdownMenuItem>
                      <DropdownMenuItem
                          className="px-4 py-3 text-primary-100 hover:bg-primary-700 focus:bg-primary-700 cursor-pointer flex items-center gap-2"
                          onClick={() =>
                              router.push(
                                  `/${authUser.userRole?.toLowerCase() || "user"}/settings`,
                                  { scroll: false }
                              )
                          }
                      >
                        <Settings className="w-4 h-4" />
                        Account Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-primary-700" />
                      <DropdownMenuItem
                          className="px-4 py-3 text-primary-100 hover:bg-primary-700 focus:bg-primary-700 cursor-pointer flex items-center gap-2"
                          onClick={handleSignOut}
                      >
                        <span className="w-4 h-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
            ) : (
                <div className="flex items-center gap-3">
                  <Link href="/signin">
                    <Button
                        variant="ghost"
                        className="h-9 px-5 text-lg bg-secondary-500 hover:bg-secondary-600 text-primary-800 font-medium shadow-md hover:shadow-lg transition-all"
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
            )}
          </div>
        </div>

        {authUser && authUser.userRole && !isLoading && (
            <div
                className="md:hidden fixed left-0 w-full bg-primary-800/90 text-white z-40 flex flex-row flex-nowrap overflow-x-auto gap-3 py-3 px-4 whitespace-nowrap"
                style={{ top: `${NAVBAR_HEIGHT}px` }}
            >
              <nav className="flex flex-row gap-3">
                {getNavLinks().map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-2 px-3 py-1 text-sm transition-colors duration-200 ${
                            pathname === link.href
                                ? "bg-secondary-400 text-white font-semibold"
                                : "hover:bg-primary-700"
                        }`}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                ))}
              </nav>
            </div>
        )}
      </div>
  );
};

export default Navbar;