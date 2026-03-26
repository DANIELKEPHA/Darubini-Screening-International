'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
    onSearch: (search: string) => void;
    searchValue: string;
    placeholder?: string;
    className?: string;
}

export default function SearchInput({
                                        onSearch,
                                        searchValue,
                                        placeholder,
                                        className,
                                    }: SearchInputProps) {
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
        <div className={`mb-4 ${className || ''}`}>
            <Input
                type="text"
                placeholder={placeholder || 'Search...'}
                value={search}
                onChange={handleChange}
                className="
        w-full
        rounded-none
        shadow-none
        bg-transparent
        focus:ring-0
        focus:shadow-none
    "
            />

        </div>
    );
}
