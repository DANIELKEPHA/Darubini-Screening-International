'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
    onSearch: (search: string) => void;
    searchValue: string;
    placeholder?: string; // Added optional placeholder prop
}

export default function SearchInput({ onSearch, searchValue, placeholder }: SearchInputProps) {
    const [search, setSearch] = useState(searchValue);

    useEffect(() => {
        setSearch(searchValue);
    }, [searchValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        onSearch(value);
    };

    return (
        <div className="mb-4">
            <Input
                type="text"
                placeholder={placeholder || 'Search...'} // Use provided placeholder or fallback to default
                value={search}
                onChange={handleChange}
                className="w-full"
            />
        </div>
    );
}