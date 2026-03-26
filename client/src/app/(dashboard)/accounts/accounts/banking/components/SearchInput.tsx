'use client';

import { useState, useEffect } from 'react';

interface SearchInputProps {
    onSearch: (search: string) => void;
    searchValue: string;
}

export default function SearchInput({ onSearch, searchValue }: SearchInputProps) {
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
            <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            />
        </div>
    );
}