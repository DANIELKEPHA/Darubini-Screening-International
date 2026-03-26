'use client';

import { useRouter } from 'next/navigation';
import BankAccountForm from "@/app/(dashboard)/accounts/accounts/banking/components/BankAccountForm";

export default function ConnectManually() {
    const router = useRouter();

    return (
        <BankAccountForm
            onClose={() => router.push('/accounts/banking/dashboard')}
        />
    );
}