'use client';

import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
    status: string;
    variant?: 'default' | 'destructive' | 'outline';
}

export default function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
    const variants = {
        ACTIVE: { className: 'bg-secondary-100 text-secondary-800 border-secondary-200', label: 'Active' },
        LOW: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Low Balance' },
        CRITICAL: { className: 'bg-primary-100 text-primary-800 border-primary-200', label: 'Critical' },
    };

    const badgeVariant = variants[status as keyof typeof variants] || variants.ACTIVE;

    return (
        <Badge className={badgeVariant.className} variant={variant}>
            {badgeVariant.label}
        </Badge>
    );
}