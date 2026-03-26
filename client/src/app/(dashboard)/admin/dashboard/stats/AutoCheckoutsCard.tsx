'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface AutoCheckoutsCardProps {
    count: number;
}

const AutoCheckoutsCard: React.FC<AutoCheckoutsCardProps> = ({ count }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200/50 dark:border-gray-700/30 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Checkouts</p>
                        <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{count}</p>
                    </div>
                    <Clock className="h-8 w-8 text-gray-500/60" />
                </div>
            </Card>
        </motion.div>
    );
};

export default AutoCheckoutsCard;