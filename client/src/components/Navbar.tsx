"use client";

import { NAVBAR_HEIGHT } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { useGetAuthUserQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import { Bell, ChevronDown, MessageCircle, Plus, Search, Home, UserCircle, Briefcase, Files } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { SidebarTrigger } from "./ui/sidebar";

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const Navbar = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();

  const isDashboardPage = pathname.includes("/admin") || pathname.includes("/user");

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const publicLinks: NavLink[] = [
    { href: "/", label: "Home", icon: Home },
    { href: "/about", label: "About Us", icon: UserCircle },
    { href: "/our-solutions", label: "Our Solutions", icon: Briefcase },
    { href: "/resources", label: "Resources", icon: Files },
  ];

  return (
      <header
          className="fixed top-0 left-0 w-full z-50 bg-primary-800/90 backdrop-blur-md border-b border-primary-700/30 shadow-sm"
          style={{ height: `${NAVBAR_HEIGHT}px` }}
      >
        <div className="flex justify-between items-center w-full h-full px-6 lg:px-8 mx-auto max-w-7xl">
          {/* Left side - Logo and navigation */}
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
            {isDashboardPage && authUser && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex items-center gap-2 bg-primary-800/50 hover:bg-primary-800 text-lg text-primary-100 hover:text-white"
                    onClick={() =>
                        router.push(
                            authUser.userRole?.toLowerCase() === "admin" ? "/admin/files" : "/search"
                        )
                    }
                >
                  {authUser.userRole?.toLowerCase() === "admin" ? (
                      <>
                        <Plus className="h-5 w-5" />
                        <span>New Screening</span>
                      </>
                  ) : (
                      <>
                        <Search className="h-5 w-5" />
                        <span>Search</span>
                      </>
                  )}
                </Button>
            )}
          </div>

          {/* Center - Public links or Tagline */}
          {!isDashboardPage && (
              <div className="hidden md:flex items-center gap-6">
                {authUser ? (
                    <p className="text-lg text-primary-200/80 tracking-wider font-geist">
                      Facilitating Safe Recruitment Decisions
                    </p>
                ) : (
                    <nav className="flex gap-6">
                      {publicLinks.map((link) =>
                          link.href === "/resources" ? (
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
                                  <DropdownMenuItem
                                      className="px-4 py-3 text-lg text-primary-100 hover:bg-primary-700 focus:bg-primary-700 cursor-pointer"
                                      onClick={() => router.push("/resources/contacts")}
                                  >
                                    Contacts
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
          )}

          {/* Right side - User controls */}
          <div className="flex items-center gap-4">
            {authUser ? (
                <>
                  <div className="hidden lg:flex items-center gap-4">
                    <button className="p-2 rounded-full hover:bg-primary-800/30 transition-colors relative">
                      <MessageCircle className="w-6 h-6 text-primary-200" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary-400 rounded-full"></span>
                    </button>
                    <button className="p-2 rounded-full hover:bg-primary-800/30 transition-colors relative">
                      <Bell className="w-6 h-6 text-primary-200" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary-400 rounded-full"></span>
                    </button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none group">
                      <Avatar className="border-2 border-primary-600 group-hover:border-secondary-400 transition-colors">
                        <AvatarImage src={authUser.userInfo?.image} />
                        <AvatarFallback className="bg-primary-600 text-primary-100">
                          {authUser.userInfo?.name?.charAt(0).toUpperCase() ||
                              authUser.userRole?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:flex items-center gap-1">
                    <span className="text-base font-medium text-primary-100">
                      {authUser.userInfo?.name || authUser.userRole}
                    </span>
                        <ChevronDown className="w-5 h-5 text-primary-300 group-hover:text-secondary-400 transition-colors" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="min-w-[240px] bg-primary-800 border border-primary-700 shadow-lg rounded-lg overflow-hidden"
                        align="end"
                    >
                      <div className="px-4 py-3 border-b border-primary-700">
                        <p className="text-base font-medium text-primary-100">
                          {authUser.userInfo?.name}
                        </p>
                        <p className="text-base text-primary-300">
                          {authUser.userInfo?.email}
                        </p>
                      </div>
                      <DropdownMenuItem
                          className="px-4 py-3 text-lg text-primary-100 hover:bg-primary-700 focus:bg-primary-700 cursor-pointer"
                          onClick={() =>
                              router.push(
                                  authUser.userRole?.toLowerCase() === "manager"
                                      ? "/managers/properties"
                                      : "/tenants/favorites",
                                  { scroll: false }
                              )
                          }
                      >
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem
                          className="px-4 py-3 text-lg text-primary-100 hover:bg-primary-700 focus:bg-primary-700 cursor-pointer"
                          onClick={() =>
                              router.push(
                                  `/${authUser.userRole?.toLowerCase()}s/settings`,
                                  { scroll: false }
                              )
                          }
                      >
                        Account Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-primary-700" />
                      <DropdownMenuItem
                          className="px-4 py-3 text-lg text-red-400 hover:bg-primary-700 focus:bg-primary-700 cursor-pointer"
                          onClick={handleSignOut}
                      >
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
            ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Link href="/signin">
                      <Button
                          variant="ghost"
                          className="h-9 px-4 text-lg text-primary-100 hover:bg-primary-800/50 hover:text-white"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button
                          className="h-9 px-5 text-lg bg-secondary-500 hover:bg-secondary-600 text-primary-800 font-medium shadow-md hover:shadow-lg transition-all"
                      >
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </>
            )}
          </div>
        </div>
      </header>
  );
};

export default Navbar;