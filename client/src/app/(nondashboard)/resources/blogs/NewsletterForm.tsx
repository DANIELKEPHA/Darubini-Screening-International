'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

const NewsletterForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
  });

  const onSubmit = async (data: NewsletterFormData) => {
    try {
      // Placeholder for API call to subscribe
      // await fetch('/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify(data) });
      toast.success('Subscribed successfully!');
      reset();
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg border">
      <h3 className="font-semibold mb-4">Subscribe to Our Newsletter</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Get the latest articles delivered to your inbox.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <Input
            placeholder="Your email"
            className={`h-9 ${errors.email ? 'border-red-500' : ''}`}
            {...register('email')}
            aria-label="Email for newsletter subscription"
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full">
          Subscribe
        </Button>
      </form>
    </div>
  );
};

export default NewsletterForm;