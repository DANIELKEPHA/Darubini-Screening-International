"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ButtonProps } from "@/components/ui/button"; // ← Important: import ButtonProps

// Update your props interface
export interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;

    // ← ADD THIS LINE
    confirmButtonProps?: ButtonProps;
}

export default function ConfirmDialog({
                                          open,
                                          title,
                                          description,
                                          confirmText = "Confirm",
                                          cancelText = "Cancel",
                                          variant = "default",
                                          onConfirm,
                                          onCancel,
                                          confirmButtonProps, // ← now accepted
                                      }: ConfirmDialogProps) {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="outline" onClick={onCancel}>
                            {cancelText}
                        </Button>
                    </AlertDialogCancel>

                    <AlertDialogAction asChild>
                        {/* Spread custom props + preserve variant logic */}
                        <Button
                            {...confirmButtonProps}
                            variant={
                                variant === "destructive"
                                    ? "destructive"
                                    : confirmButtonProps?.variant || "default"
                            }
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}