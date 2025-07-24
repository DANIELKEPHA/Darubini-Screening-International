import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

type BreadcrumbItem = {
    label: string;
    href?: string;
};

type BreadcrumbProps = {
    items: BreadcrumbItem[];
};

const BreadCrumb: React.FC<BreadcrumbProps> = ({ items }) => {
    return (
        <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-primary-50 px-6 py-4 text-sm text-primary-700 font-geist"
        >
            <ol className="flex items-center space-x-2 max-w-7xl mx-auto">
                {items.map((item: BreadcrumbItem, index: number) => (
                    <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center"
                    >
                        {index !== 0 && (
                            <ChevronRight className="w-4 h-4 mx-2 text-primary-400" />
                        )}
                        {index !== items.length - 1 ? (
                            <a href={item.href} className="hover:underline hover:text-primary-500 transition-colors">
                                {item.label}
                            </a>
                        ) : (
                            <span className="text-primary-800 font-medium">{item.label}</span>
                        )}
                    </motion.li>
                ))}
            </ol>
        </motion.nav>
    );
};

export default BreadCrumb;