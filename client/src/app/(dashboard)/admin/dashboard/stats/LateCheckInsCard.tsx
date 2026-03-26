'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface LateCheckInsCardProps {
    count: number;
}

const LateCheckInsCard: React.FC<LateCheckInsCardProps> = ({ count }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/20 border-red-200/50 dark:border-red-700/30 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">Late Check-Ins</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{count}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500/60" />
                </div>
            </Card>
        </motion.div>
    );
};

export default LateCheckInsCard;