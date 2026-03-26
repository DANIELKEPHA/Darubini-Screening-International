'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useCreateAuthorMutation } from '@/state/api';

const authorSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    bio: z.string().optional(),
    profilePicture: z.any().optional(),
});

type AuthorFormData = z.infer<typeof authorSchema>;

interface AuthorFormProps {
    onClose?: () => void;
}

const AuthorForm: React.FC<AuthorFormProps> = ({ onClose }) => {
    const [createAuthor, { isLoading }] = useCreateAuthorMutation();

    const form = useForm<AuthorFormData>({
        resolver: zodResolver(authorSchema),
        defaultValues: {
            name: '',
            email: '',
            bio: '',
            profilePicture: null,
        },
    });

    const onSubmit = async (data: AuthorFormData) => {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('email', data.email);
            if (data.bio) formData.append('bio', data.bio);
            if (data.profilePicture instanceof File) {

                formData.append('profilePicture', data.profilePicture);
            }

            await createAuthor(formData).unwrap();
            toast.success('Author created successfully');
            form.reset();
            onClose?.();
        } catch (error: any) {
            console.error('Error creating author:', error);
            toast.error('Failed to create author', {
                description: error.data?.message || error.data?.errors?.map((err: any) => err.message).join(', ') || 'An unexpected error occurred',
            });
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    {...form.register('name')}
                    className={form.formState.errors.name ? 'border-red-500' : ''}
                />
                {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
            </div>

            <div>
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    className={form.formState.errors.email ? 'border-red-500' : ''}
                />
                {form.formState.errors.email && (
                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
            </div>

            <div>
                <Label htmlFor="bio">Bio (optional)</Label>
                <Textarea
                    id="bio"
                    {...form.register('bio')}
                    rows={4}
                />
            </div>

            <div>
                <Label htmlFor="profilePicture">Profile Picture (optional)</Label>
                <Input
                    id="profilePicture"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
                            if (!validTypes.includes(file.type)) {
                                toast.error('Invalid file type. Please upload JPEG, PNG, or WebP.');
                                return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                                toast.error('File too large. Maximum size is 5MB.');
                                return;
                            }
                            form.setValue('profilePicture', file);
                        }
                    }}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP. Max 5MB.</p>
            </div>

            <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Author
                </Button>
                {onClose && (
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
};

export default AuthorForm;