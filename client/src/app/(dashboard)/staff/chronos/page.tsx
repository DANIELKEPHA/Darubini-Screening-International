'use client';

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AttendanceFilter, setAttendanceFilters } from "@/state";
import { useGetAuthUserQuery } from "@/state/api";
import Header from "@/app/(dashboard)/staff/chronos/components/attendance/Header";
import AttendanceControls from "@/app/(dashboard)/staff/chronos/components/attendance/AttendanceControls";
import AttendanceDisplay from "@/app/(dashboard)/staff/chronos/components/attendance/AttendanceDisplay";
import { motion } from "framer-motion";

const AttendancePage: React.FC = () => {
    const dispatch = useDispatch();
    const [filter, setFilter] = useState<AttendanceFilter>({});
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const { data: authUser, isLoading: isAuthLoading, error: authError } = useGetAuthUserQuery();

    useEffect(() => {
        if (authUser?.userInfo?.cognitoId) {
            const newFilter = { ...filter, staffCognitoId: authUser.userInfo.cognitoId };
            setFilter(newFilter);
            dispatch(setAttendanceFilters(newFilter));
        }
    }, [authUser, dispatch]);

    const username = isAuthLoading
        ? "Loading..."
        : authError
            ? "Accounts"
            : authUser?.userInfo?.name || "Accounts";

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.1)_1px,transparent_0)] bg-[size:40px_40px]" />
            </div>

            <div className="relative z-10 w-full px-3 py-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full"
                >
                    <div className="mb-8">
                        <Header username={username} />
                        <AttendanceControls
                            authUserCognitoId={authUser?.userInfo?.cognitoId}
                            filter={filter}
                            onFilterChange={(key, value) => {
                                const newFilter = { ...filter, [key]: value };
                                setFilter(newFilter);
                                dispatch(setAttendanceFilters(newFilter));
                                setPage(1);
                            }}
                        />
                        <AttendanceDisplay
                            page={page}
                            limit={limit}
                            setPage={setPage}
                            filter={filter}
                            authUserCognitoId={authUser?.userInfo?.cognitoId}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AttendancePage;