'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchAndFilterProps {
    filters: { search?: string; page: number; limit: number };
    onSearchChange: (search: string) => void;
    onPageChange: (page: number) => void;
    totalPages: number;
}

export default function SearchAndFilter({ filters, onSearchChange, onPageChange, totalPages }: SearchAndFilterProps) {
    return (
        <div className="space-y-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search..."
                    value={filters.search || ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 pr-4 py-3 rounded-xl border-gray-200 focus:border-primary focus:ring-primary shadow-sm transition-all duration-300"
                />
            </div>
        </div>
    );
}