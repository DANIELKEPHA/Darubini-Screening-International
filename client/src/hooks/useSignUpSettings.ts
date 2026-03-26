import { useGetPublicSignUpSettingsQuery, useGetSignUpEnabledQuery, useUpdateSignUpEnabledMutation } from "@/state/api";
import { toast } from "sonner";

export const useSignUpSettings = (isPublic: boolean = false) => {
    const publicQuery = useGetPublicSignUpSettingsQuery(undefined, { skip: !isPublic });
    const authQuery = useGetSignUpEnabledQuery(undefined, { skip: isPublic });
    const [updateSignUpEnabled, { isLoading: isUpdating }] = useUpdateSignUpEnabledMutation();

    const isSignUpEnabled = isPublic ? publicQuery.data?.isSignUpEnabled : authQuery.data?.isSignUpEnabled;
    const isLoading = isPublic ? publicQuery.isLoading : authQuery.isLoading;
    const error = isPublic ? publicQuery.error : authQuery.error;

    const toggleSignUp = async (enabled: boolean) => {
        if (isPublic) return;
        try {
            await updateSignUpEnabled({ isSignUpEnabled: enabled }).unwrap();
            toast.success(`Sign-up link ${enabled ? "enabled" : "disabled"} successfully`);
        } catch (error: any) {
            toast.error(error.data?.message || "Failed to update sign-up setting");
        }
    };

    return { isSignUpEnabled, isLoading, isUpdating, error, toggleSignUp };
};