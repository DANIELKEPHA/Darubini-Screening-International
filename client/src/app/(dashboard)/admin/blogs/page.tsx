'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Search, Trash2, Edit, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useGetAuthUserQuery, useGetBlogsQuery, useDeleteBlogMutation, usePublishBlogMutation, useGetAuthorsQuery } from '@/state/api';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import BlogForm from "@/app/(dashboard)/[slag]/blogs/BlogForm";
import AuthorForm from "@/app/(dashboard)/[slag]/blogs/AuthorForm";
import BlogPostView from "@/app/(nondashboard)/resources/blogs/blog-post-view";

const AdminBlogManager: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [page, setPage] = React.useState(1);
    const [search, setSearch] = React.useState(searchParams.get('search') || '');
    const [isSearching, setIsSearching] = React.useState(false);
    const [isBlogModalOpen, setIsBlogModalOpen] = React.useState(false);
    const [isAuthorModalOpen, setIsAuthorModalOpen] = React.useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
    const [selectedBlogId, setSelectedBlogId] = React.useState<number | null>(null);
    const limit = 9;

    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const { data: blogsData, isLoading: isBlogsLoading, isFetching, error: blogsError } = useGetBlogsQuery({
        page,
        limit,
        search,
    });
    const { data: authorsData, isLoading: isAuthorsLoading, error: authorsError } = useGetAuthorsQuery();
    const [deleteBlog, { isLoading: isDeleting }] = useDeleteBlogMutation();
    const [publishBlog, { isLoading: isPublishing }] = usePublishBlogMutation();

    React.useEffect(() => {
        if (!authUser || authUser.userRole !== 'admin') {
            router.push('/');
            toast.error('Access denied.');
        }
    }, [authUser, router]);

    function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
        return typeof error === 'object' && error != null && 'status' in error;
    }

    function isSerializedError(error: unknown): error is { message: string } {
        return typeof error === 'object' && error != null && 'message' in error;
    }

    React.useEffect(() => {
        if (blogsError) {
            let description = 'An unexpected error occurred';
            if (isFetchBaseQueryError(blogsError)) {
                if ('data' in blogsError && typeof blogsError.data === 'object' && blogsError.data !== null && 'message' in blogsError.data) {
                    description = (blogsError.data as any).message;
                } else if ('error' in blogsError) {
                    description = blogsError.error;
                }
            } else if (isSerializedError(blogsError)) {
                description = blogsError.message;
            }
            toast.error('Failed to fetch blogs', { description });
        }
        if (authorsError) {
            let description = 'An unexpected error occurred';
            if (isFetchBaseQueryError(authorsError)) {
                if ('data' in authorsError && typeof authorsError.data === 'object' && authorsError.data !== null && 'message' in authorsError.data) {
                    description = (authorsError.data as any).message;
                } else if ('error' in authorsError) {
                    description = authorsError.error;
                }
            } else if (isSerializedError(authorsError)) {
                description = authorsError.message;
            }
            toast.error('Failed to fetch authors', { description });
        }
    }, [blogsError, authorsError]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSearching(true);
        const formData = new FormData(e.currentTarget);
        const searchValue = formData.get('search') as string;
        setSearch(searchValue);
        setPage(1);
        const params = new URLSearchParams(searchParams.toString());
        if (searchValue) {
            params.set('search', searchValue);
        } else {
            params.delete('search');
        }
        router.push(`/admin/blogs?${params.toString()}`);
        setTimeout(() => setIsSearching(false), 500);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this blog?')) return;
        try {
            await deleteBlog(id).unwrap();
            toast.success('Blog deleted successfully');
        } catch {
            toast.error('Failed to delete blog');
        }
    };

    const handlePublishToggle = async (id: number, currentPublished: boolean) => {
        try {
            await publishBlog({ id, published: !currentPublished }).unwrap();
            toast.success(`Blog ${currentPublished ? 'unpublished' : 'published'} successfully`);
        } catch {
            toast.error(`Failed to ${currentPublished ? 'unpublish' : 'publish'} blog`);
        }
    };

    const handleViewDetails = (id: number) => {
        setSelectedBlogId(id);
        setIsDetailsModalOpen(true);
    };

    React.useEffect(() => {
        const editBlogId = searchParams.get('editBlogId');
        if (editBlogId) {
            setSelectedBlogId(parseInt(editBlogId));
            setIsBlogModalOpen(true);
        }
    }, [searchParams]);

    if (isAuthLoading || (isBlogsLoading && page === 1) || isAuthorsLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(9)].map((_, i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    const selectedBlog = blogsData?.data?.find((blog) => blog.id === selectedBlogId);

    return (
        <div className="container mx-auto px-4 py-8">
            <Tabs defaultValue="list" className="space-y-6">
                <div className="flex justify-between items-center">
                    <TabsList>
                        <TabsTrigger value="list">Blog List</TabsTrigger>
                        <TabsTrigger value="create">New Blog</TabsTrigger>
                        <TabsTrigger value="authors">Authors</TabsTrigger>
                        <TabsTrigger value="create-author">New Author</TabsTrigger>
                    </TabsList>
                    <form onSubmit={handleSearch} className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            name="search"
                            placeholder="Search blogs..."
                            className="pl-8 h-9 text-sm"
                            defaultValue={search}
                        />
                    </form>
                </div>

                <TabsContent value="list">
                    {(isFetching || isSearching) && page > 1 ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : blogsData?.data?.length ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {blogsData.data.map((blog) => (
                                    <Card key={blog.id} className="flex flex-col">
                                        {blog.coverImageSignedUrl && (
                                            <div className="relative aspect-video">
                                                <Image
                                                    src={blog.coverImageSignedUrl}
                                                    alt={blog.title}
                                                    fill
                                                    className="object-cover rounded-t-lg"
                                                />
                                            </div>
                                        )}
                                        <CardContent className="p-4 flex-1">
                                            <h3 className="text-lg font-semibold line-clamp-2">{blog.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-3">{blog.excerpt || blog.content}</p>
                                        </CardContent>
                                        <CardFooter className="p-4 flex justify-between">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedBlogId(blog.id);
                                                        setIsBlogModalOpen(true);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(blog.id)}
                                                    disabled={isDeleting}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(blog.id)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Details
                                                </Button>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePublishToggle(blog.id, blog.published)}
                                                disabled={isPublishing}
                                            >
                                                {blog.published ? (
                                                    <ToggleLeft className="h-4 w-4 mr-2" />
                                                ) : (
                                                    <ToggleRight className="h-4 w-4 mr-2" />
                                                )}
                                                {blog.published ? 'Unpublish' : 'Publish'}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                            {blogsData.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-8">
                                    <Button
                                        variant="outline"
                                        disabled={page === 1 || isFetching}
                                        onClick={() => setPage((prev) => prev - 1)}
                                        className="gap-1"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <div className="text-sm text-muted-foreground">
                                        Page {page} of {blogsData.totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        disabled={page === blogsData.totalPages || isFetching}
                                        onClick={() => setPage((prev) => prev + 1)}
                                        className="gap-1"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Search className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-medium mb-2">No blogs found</h3>
                            <p className="text-muted-foreground">Try adjusting your search or create a new blog.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="create">
                    <BlogForm />
                </TabsContent>

                <TabsContent value="authors">
                    {authorsData?.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {authorsData.map((author) => (
                                <Card key={author.id} className="flex flex-col">
                                    {author.profilePicture && (
                                        <div className="relative aspect-square">
                                            <Image
                                                src={author.profilePicture}
                                                alt={author.name}
                                                fill
                                                className="object-cover rounded-t-lg"
                                            />
                                        </div>
                                    )}
                                    <CardContent className="p-4 flex-1">
                                        <h3 className="text-lg font-semibold">{author.name}</h3>
                                        <p className="text-sm text-muted-foreground">{author.email}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-3">{author.bio || 'No bio available'}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <h3 className="text-xl font-medium mb-2">No authors found</h3>
                            <p className="text-muted-foreground">Create a new author to get started.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="create-author">
                    <AuthorForm />
                </TabsContent>
            </Tabs>

            <Dialog open={isBlogModalOpen} onOpenChange={(open) => {
                setIsBlogModalOpen(open);
                if (!open) {
                    setSelectedBlogId(null);
                    router.push('/admin/blogs');
                }
            }}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Blog Post</DialogTitle>
                    </DialogHeader>
                    {selectedBlog && <BlogForm blog={selectedBlog} onClose={() => setIsBlogModalOpen(false)} />}
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailsModalOpen} onOpenChange={(open) => {
                setIsDetailsModalOpen(open);
                if (!open) {
                    setSelectedBlogId(null);
                }
            }}>
                <DialogContent className="w-full h-full max-w-none max-h-none overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Blog Post Details</DialogTitle>
                    </DialogHeader>
                    {selectedBlog && (
                        <BlogPostView
                            post={{
                                ...selectedBlog,
                                author: authorsData?.find((author) => author.id === selectedBlog.authorId) || {
                                    name: 'Unknown Author',
                                    email: '',
                                    id: 0,
                                },
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isAuthorModalOpen} onOpenChange={setIsAuthorModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Author</DialogTitle>
                    </DialogHeader>
                    <AuthorForm onClose={() => setIsAuthorModalOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminBlogManager;