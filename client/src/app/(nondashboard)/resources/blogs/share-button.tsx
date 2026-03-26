'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
    title: string;
    text?: string;
    url: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
    const handleShare = async () => {
        const fullUrl = `https://yourdomain.com${url}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title,
                    text,
                    url: fullUrl,
                });
            } else {
                await navigator.clipboard.writeText(fullUrl);
                toast.success('Link copied to clipboard');
            }
        } catch (err) {
            console.error('Error sharing:', err);
            toast.error('Failed to share post');
        }
    };

    return (
        <Button variant="outline" onClick={handleShare} aria-label="Share this post">
            <Share2 className="mr-2 h-4 w-4" />
            Share
        </Button>
    );
}