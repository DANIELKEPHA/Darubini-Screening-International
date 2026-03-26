"use client";

import React, { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import {Authenticator, Heading, Radio, RadioGroupField, useAuthenticator, View} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiLock, FiMail, FiPhone, FiChevronRight, FiEye, FiEyeOff } from "react-icons/fi";
import { useSignUpSettings } from "@/hooks/useSignUpSettings";
import { toast } from "sonner";

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
            userPoolClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID!,
        },
    },
});

const AnimatedView = ({ children, key }: { children: React.ReactNode; key?: string }) => (
    <motion.div
        key={key}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full"
    >
        {children}
    </motion.div>
);

const PasswordToggle = ({ fieldName }: { fieldName: string }) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePassword = () => {
        setShowPassword(!showPassword);
        const input = document.querySelector(`input[name="${fieldName}"]`) as HTMLInputElement;
        if (input) input.type = showPassword ? "password" : "text";
    };

    return (
        <motion.button
            type="button"
            onClick={togglePassword}
            className="text-gray-400 p-1 bg-transparent border-none cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
        >
            {showPassword ? <FiEyeOff /> : <FiEye />}
        </motion.button>
    );
};

const components = {
    Header() {
        return (
            <View className="mb-10 text-center">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                                />
                            </svg>
                        </div>
                    </div>
                    <Heading level={3} className="!text-3xl !font-bold text-gray-800">
                        Darubini Screening International
                    </Heading>
                </motion.div>
            </View>
        );
    },
    SignIn: {
        Header() {
            return (
                <AnimatedView>
                    <Heading level={4} className="!text-xl !font-semibold text-gray-700 mb-1">
                        Welcome back
                    </Heading>
                    <p className="text-gray-500 text-sm">Sign in to continue to your dashboard</p>
                </AnimatedView>
            );
        },
        Footer() {
            const { toSignUp, toForgotPassword } = useAuthenticator();
            const { isSignUpEnabled, isLoading: isSignUpLoading, error: signUpError } = useSignUpSettings(true);

            if (isSignUpLoading) {
                return (
                    <AnimatedView>
                        <div className="text-center mt-6">
                            <p className="text-gray-500 text-sm">Loading sign-up settings...</p>
                        </div>
                    </AnimatedView>
                );
            }

            if (signUpError) {
                console.error("Sign-up settings error:", signUpError);
                toast.error("Failed to load sign-up settings");
                return (
                    <AnimatedView>
                        <div className="text-center mt-6">
                            <p className="text-gray-500 text-sm">Sign-up settings unavailable</p>
                        </div>
                    </AnimatedView>
                );
            }

            return (
                <AnimatedView>
                    <div className="mt-2 text-right">
                        <button
                            type="button"
                            onClick={toForgotPassword}
                            className="text-sm text-indigo-600 hover:underline"
                        >
                            Forgot your password?
                        </button>
                    </div>
                    {isSignUpEnabled && (
                        <View className="text-center mt-6">
                            <p className="text-gray-500 text-sm">
                                Don&#39;t have an account?{" "}
                                <motion.button
                                    onClick={toSignUp}
                                    className="text-indigo-600 hover:text-indigo-700 font-medium bg-transparent border-none p-0 cursor-pointer"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Create account
                                    <span className="inline ml-1">
                    <FiChevronRight />
                  </span>
                                </motion.button>
                            </p>
                        </View>
                    )}
                </AnimatedView>
            );
        },
    },
    SignUp: {
        Header() {
            return (
                <AnimatedView>
                    <Heading level={4} className="!text-xl !font-semibold text-gray-700 mb-1">
                        Get started
                    </Heading>
                    <p className="text-gray-500 text-sm">Create your account</p>
                </AnimatedView>
            );
        },
        FormFields() {
            const { validationErrors } = useAuthenticator();

            return (
                <AnimatedView>
                    <Authenticator.SignUp.FormFields />
                    <motion.div
                        className="mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <RadioGroupField
                            legend="Account Type"
                            name="custom:role"
                            errorMessage={validationErrors?.["custom:role"]}
                            hasError={!!validationErrors?.["custom:role"]}
                            isRequired
                            className="radio-group"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <motion.div whileHover={{ scale: 1.03 }}>
                                    <Radio value="user" className="hidden" id="user-radio" />
                                    <label
                                        htmlFor="user-radio"
                                        className="flex-1 border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-300 transition-colors"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-2">
                        <span className="text-indigo-600">
                          <FiUser />
                        </span>
                                            </div>
                                            <span className="text-gray-700 font-medium">Standard User</span>
                                        </div>
                                    </label>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.03 }}>
                                    <Radio value="admin" className="hidden" id="admin-radio" />
                                    <label
                                        htmlFor="admin-radio"
                                        className="flex-1 border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-300 transition-colors"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-2">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 text-indigo-600"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <span className="text-gray-700 font-medium">Administrator</span>
                                        </div>
                                    </label>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.03 }}>
                                    <Radio value="accounts" className="hidden" id="accounts-radio" />
                                    <label
                                        htmlFor="accounts-radio"
                                        className="flex-1 border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-300 transition-colors"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-2">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 text-indigo-600"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <span className="text-gray-700 font-medium">Accounts</span>
                                        </div>
                                    </label>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.03 }}>
                                    <Radio value="staff" className="hidden" id="staff-radio" />
                                    <label
                                        htmlFor="staff-radio"
                                        className="flex-1 border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-300 transition-colors"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-2">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 text-indigo-600"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 1.857a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <span className="text-gray-700 font-medium">Staff</span>
                                        </div>
                                    </label>
                                </motion.div>
                            </div>
                        </RadioGroupField>
                    </motion.div>
                </AnimatedView>
            );
        },
        Footer() {
            const { toSignIn } = useAuthenticator();
            return (
                <AnimatedView>
                    <View className="text-center mt-6">
                        <p className="text-gray-500 text-sm">
                            Already have an account?{" "}
                            <motion.button
                                onClick={toSignIn}
                                className="text-indigo-600 hover:text-indigo-700 font-medium bg-transparent border-none p-0 cursor-pointer"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Sign in
                                <span className="inline ml-1">
                  <FiChevronRight />
                </span>
                            </motion.button>
                        </p>
                    </View>
                </AnimatedView>
            );
        },
    },
};

const formFields = {
    signIn: {
        username: {
            placeholder: "Enter your email",
            label: "Email",
            isRequired: true,
            labelHidden: true,
            type: "email",
            outerEndComponent: (
                <span className="text-gray-400 p-1">
          <FiMail />
        </span>
            ),
        },
        password: {
            placeholder: "Enter your password",
            label: "Password",
            isRequired: true,
            labelHidden: true,
            type: "password",
        },
    },
    signUp: {
        username: {
            order: 1,
            placeholder: "Choose a username",
            label: "Username",
            isRequired: true,
            labelHidden: true,
            outerEndComponent: (
                <span className="text-gray-400 p-1">
          <FiUser />
        </span>
            ),
        },
        email: {
            order: 2,
            placeholder: "Enter your email address",
            label: "Email",
            isRequired: true,
            labelHidden: true,
            type: "email",
            outerEndComponent: (
                <span className="text-gray-400 p-1">
          <FiMail />
        </span>
            ),
        },
        phone_number: {
            order: 3,
            placeholder: "Enter your phone number (e.g., +254123456789)",
            label: "Phone Number",
            isRequired: true,
            dialCode: "+254",
            labelHidden: true,
            outerEndComponent: (
                <span className="text-gray-400 p-1">
          <FiPhone />
        </span>
            ),
        },
        password: {
            order: 4,
            placeholder: "Create a password",
            label: "Password",
            isRequired: true,
            labelHidden: true,
            type: "password",
            outerEndComponent: (
                <div className="flex items-center space-x-2">
          <span className="text-gray-400 p-1">
            <FiLock />
          </span>
                    <PasswordToggle fieldName="password" />
                </div>
            ),
        },
        confirm_password: {
            order: 5,
            placeholder: "Confirm your password",
            label: "Confirm Password",
            isRequired: true,
            labelHidden: true,
            type: "password",
            outerEndComponent: (
                <div className="flex items-center space-x-2">
          <span className="text-gray-400 p-1">
            <FiLock />
          </span>
                    <PasswordToggle fieldName="confirm_password" />
                </div>
            ),
        },
    },
};

const Auth = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuthenticator((context) => [context.user]);
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);

    const isAuthPage = pathname.match(/^\/(signin|signup)$/);
    const isDashboardPage = pathname.startsWith("/admin") || pathname.startsWith("/user") || pathname.startsWith("/accounts") || pathname.startsWith("/staff");

    useEffect(() => {
        if (user && isAuthPage) {
            const role = (user as any).attributes?.["custom:role"];
            switch (role) {
                case "user":
                    router.push("/user");
                    break;
                case "admin":
                    router.push("/admin");
                    break;
                case "accounts":
                    router.push("/accounts");
                    break;
                case "staff":
                    router.push("/staff");
                    break;
                default:
                    router.push("/");
            }
        }
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, [user, isAuthPage, router]);

    if (!isAuthPage && !isDashboardPage) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            {isLoading ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent"
                    />
                    <motion.p
                        className="mt-4 text-gray-600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        Loading...
                    </motion.p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                >
                    <div className="bg-white rounded-2xl shadow-xl">
                        <div className="p-4">
                            <Authenticator
                                initialState={pathname.includes("signup") ? "signUp" : "signIn"}
                                components={components}
                                formFields={formFields}
                                services={{
                                    async validateCustomSignUp(formData) {
                                        const validRoles = ["user", "admin", "accounts", "staff"];
                                        if (!formData["custom:role"]) {
                                            return { "custom:role": "Please select an account type" };
                                        }
                                        if (!validRoles.includes(formData["custom:role"])) {
                                            return { "custom:role": "Invalid account type selected" };
                                        }
                                    },
                                }}
                                className="auth-component"
                            >
                                {() => <>{children}</>}
                            </Authenticator>
                        </div>
                        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500 text-center">
                                © {new Date().getFullYear()} Darubini Screening International. All rights reserved.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default Auth;