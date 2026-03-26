'use client';

import { useGetAuthUserQuery } from '@/state/api';

export function useCurrentAuthUser() {
    const { data, isLoading, isError, error } = useGetAuthUserQuery();
    return {
        user: data ?? null,
        isLoading,
        isError,
        error,
    };
}

export function useUserRole(): string | null {
    const { user } = useCurrentAuthUser();
    return user?.userRole?.toLowerCase() ?? null;
}

export function useIsAdminOrAccounts(): boolean {
    const role = useUserRole();
    return role === 'admin' || role === 'accounts';
}