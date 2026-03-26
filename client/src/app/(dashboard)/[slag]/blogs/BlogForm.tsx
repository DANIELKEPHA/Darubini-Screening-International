'use client';

import * as React from 'react';
import { useDebounce } from 'use-debounce';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye } from 'lucide-react';
import Image from 'next/image';
import {blogSchema, BlogFormData} from "@/lib/schemas";
import BlogPostView from '@/app/(nondashboard)/resources/blogs/blog-post-view';
import { useCreateBlogMutation, useUpdateBlogMutation, useSaveBlogDraftMutation, useGetAuthorsQuery } from '@/state/api';
import EditorToolbar from "@/app/(dashboard)/[slag]/blogs/components/editor/EditorToolbar";

interface BlogFormProps {
    blog?: any;
    onClose?: () => void;
}

const BlogForm: React.FC<BlogFormProps> = ({ blog, onClose }) => {
    const router = useRouter();
    const [createBlog, { isLoading: isCreating }] = useCreateBlogMutation();
    const [updateBlog, { isLoading: isUpdating }] = useUpdateBlogMutation();
    const [saveDraft, { isLoading: isSavingDraft }] = useSaveBlogDraftMutation();
    const { data: authors, isLoading: isAuthorsLoading, error: authorsError } = useGetAuthorsQuery();
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

    const form = useForm<BlogFormData>({
        resolver: zodResolver(blogSchema),
        defaultValues: {
            title: blog?.title || '',
            slug: blog?.slug || '',
            content: blog?.content || '',
            excerpt: blog?.excerpt || '',
            tags: blog?.tags || [],   // ✅ always array
            published: blog?.published || false,
            videoUrl: blog?.videoUrl || '',
            coverImage: null,
            authorId: blog?.authorId || undefined,
        },
    });

    const { watch, setValue, control, formState: { errors } } = form;
    const [debouncedFormData] = useDebounce<BlogFormData>(form.getValues(), 10000);

    React.useEffect(() => {
        if (!blog) {
            const { title } = debouncedFormData;
            if (title) {
                const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                setValue('slug', slug);
            }
        }

        localStorage.setItem(`blogDraft_${blog?.id || 'new'}`, JSON.stringify(debouncedFormData));

        const saveToBackend = async () => {
            try {
                const tags: string[] = Array.isArray(debouncedFormData.tags)
                    ? debouncedFormData.tags
                    : String(debouncedFormData.tags ?? '')
                        .split(',')
                        .map((t: string) => t.trim())
                        .filter(Boolean);

                await saveDraft({
                    id: blog?.id,
                    ...debouncedFormData,
                    tags: tags.join(','), // ✅ always string for backend
                    coverImage: undefined,
                }).unwrap();

               } catch (error) {
                console.error("BlogForm: Failed to save draft to backend", error);
            }
        };


        if (debouncedFormData.title || debouncedFormData.content) {
            saveToBackend();
        }
    }, [debouncedFormData, setValue, blog, saveDraft]);

    React.useEffect(() => {
        if (authorsError) {
            toast.error('Failed to fetch authors', {
                description: 'Please try again later.',
            });
        }
    }, [authorsError]);

    const onSubmit = async (data: BlogFormData) => {
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('slug', data.slug);
            formData.append('content', data.content);
            if (data.excerpt) formData.append('excerpt', data.excerpt);
            if (data.tags.length) formData.append('tags', JSON.stringify(data.tags));
            formData.append('published', data.published.toString());
            if (data.videoUrl) formData.append('videoUrl', data.videoUrl);
            if (data.coverImage instanceof File) {
                formData.append('coverImage', data.coverImage);
            } else if (data.coverImage === null) {
                formData.append('coverImage', 'null');
            }
            formData.append('authorId', data.authorId.toString());

            if (blog) {
                await updateBlog({ id: blog.id, formData }).unwrap();
                toast.success('Blog updated successfully');
            } else {
                await createBlog(formData).unwrap();
                toast.success('Blog created successfully');
            }
            localStorage.removeItem(`blogDraft_${blog?.id || 'new'}`);
            form.reset();
            router.push('/admin/blogs');
            onClose?.();
        } catch (error: any) {
            console.error('BlogForm: Error submitting form', JSON.stringify(error, null, 2));
            toast.error(`Failed to ${blog ? 'update' : 'create'} blog`, {
                description: error.data?.errors?.map((err: any) => err.message).join(', ') || error.message,
            });
        }
    };

    const selectedAuthor = authors?.find((author) => author.id === form.watch('authorId'));

    return (
        <>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        {...form.register('title')}
                        className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && (
                        <p className="text-sm text-red-500">{errors.title.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                        id="slug"
                        {...form.register('slug')}
                        className={errors.slug ? 'border-red-500' : ''}
                        disabled={!!blog}
                    />
                    {errors.slug && (
                        <p className="text-sm text-red-500">{errors.slug.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="authorId">Author</Label>
                    <Controller
                        name="authorId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                defaultValue={field.value?.toString()}
                                disabled={isAuthorsLoading || isCreating || isUpdating}
                            >
                                <SelectTrigger id="authorId">
                                    <SelectValue placeholder={isAuthorsLoading ? 'Loading authors...' : 'Select an author'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {authors?.map((author) => (
                                        <SelectItem key={author.id} value={author.id.toString()}>
                                            {author.name} ({author.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.authorId && (
                        <p className="text-sm text-red-500">{errors.authorId.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="content">Content</Label>
                    <EditorToolbar
                        content={form.getValues('content')}
                        setValue={setValue}
                        error={errors.content}
                        disabled={isCreating || isUpdating}
                    />
                    {errors.content && (
                        <p className="text-sm text-red-500">{errors.content.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea id="excerpt" {...form.register('excerpt')} rows={3} />
                </div>

                <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                        id="tags"
                        value={form.watch('tags').join(', ')} // ✅ show array as string
                        onChange={(e) => {
                            const value = e.target.value;
                            const tags = value
                                .split(',')
                                .map((tag) => tag.trim())
                                .filter(Boolean);
                            form.setValue('tags', tags, { shouldValidate: true });
                        }}
                    />
                </div>


                <div>
                    <Label htmlFor="videoUrl">Video URL (optional)</Label>
                    <Input id="videoUrl" {...form.register('videoUrl')} />
                    {errors.videoUrl && (
                        <p className="text-sm text-red-500">{errors.videoUrl.message}</p>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {(() => {
                        const coverImage = form.watch('coverImage');
                        if (coverImage instanceof File) {
                            const imageUrl = URL.createObjectURL(coverImage);
                            return (
                                <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                                    <Image
                                        src={imageUrl}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                        onLoad={() => URL.revokeObjectURL(imageUrl)}
                                        onError={() => URL.revokeObjectURL(imageUrl)}
                                    />
                                </div>
                            );
                        }
                        if (blog?.coverImageSignedUrl) {
                            return (
                                <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                                    <Image
                                        src={blog.coverImageSignedUrl}
                                        alt="Current cover"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            );
                        }
                        return (
                            <div className="w-32 h-32 rounded-md border flex items-center justify-center bg-muted">
                                <span className="text-xs text-muted-foreground">No image</span>
                            </div>
                        );
                    })()}
                    <div className="flex-1 space-y-2">
                        <Input
                            id="coverImage"
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
                                    setValue('coverImage', file);
                                }
                            }}
                            disabled={isCreating || isUpdating}
                        />
                        {blog?.coverImageSignedUrl && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setValue('coverImage', null)}
                                disabled={isCreating || isUpdating}
                            >
                                Remove Image
                            </Button>
                        )}
                        <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP. Max 5MB.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Label htmlFor="published">Published</Label>
                    <Controller
                        name="published"
                        control={form.control}
                        render={({ field }) => (
                            <Switch
                                id="published"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isCreating || isUpdating}
                            />
                        )}
                    />
                </div>

                <div className="flex gap-4">
                    <Button type="submit" disabled={isCreating || isUpdating}>
                        {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {blog ? 'Update' : 'Create'} Blog
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsPreviewOpen(true)}
                        disabled={isCreating || isUpdating || !form.watch('authorId')}
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                    </Button>
                    {onClose && (
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                    )}
                </div>
            </form>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Blog Post Preview</DialogTitle>
                    </DialogHeader>
                    <BlogPostView
                        post={{
                            ...blog,
                            ...form.getValues(),
                            tags: form.getValues().tags || [],
                            coverImageSignedUrl: form.watch('coverImage') instanceof File
                                ? URL.createObjectURL(form.watch('coverImage'))
                                : blog?.coverImageSignedUrl,
                            createdAt: blog?.createdAt || new Date().toISOString(),
                            author: selectedAuthor || { name: 'Unknown Author', email: '', id: 0 },
                        }}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default BlogForm;