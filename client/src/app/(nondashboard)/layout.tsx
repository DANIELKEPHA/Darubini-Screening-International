"use client";

import Navbar from "@/components/Navbar";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { useGetAuthUserQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery(undefined, {
    pollingInterval: 0,
  });
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (authUser) {
        const userRole = authUser.userRole?.toLowerCase();
        // Define restricted paths for all authenticated users
        const restrictedPaths = ["/our-solutions", "/"];

        if (userRole === "admin" && restrictedPaths.includes(pathname)) {
          router.push("/admin/dashboard", { scroll: false });
        } else if (userRole === "accounts" && restrictedPaths.includes(pathname)) {
          router.push("/accounts/dashboard", { scroll: false });
        } else if (userRole === "staff" && restrictedPaths.includes(pathname)) {
          router.push("/staff/dashboard", { scroll: false });
        } else {
          setIsLoading(false);
        }
      } else {
        // Unauthenticated users can access public paths
        setIsLoading(false);
      }
    }
  }, [authUser, authLoading, router, pathname]);

  if (authLoading || isLoading) return <>Loading...</>;

  return (
      <div className="h-full w-full">
        <Navbar />
        <main
            className="h-full flex w-full flex-col"
            style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}
        >
          {children}
        </main>
      </div>
  );
};

export default Layout;