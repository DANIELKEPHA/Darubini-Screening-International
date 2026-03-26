'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGetPublicBlogsQuery } from '@/state/api';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {Search, ChevronLeft, ChevronRight, Sparkles, Loader2} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import FooterSection from '@/app/(nondashboard)/landing/FooterSection';
import NewsletterForm from "@/app/(nondashboard)/resources/blogs/NewsletterForm";
import {NextSeo} from "next-seo";

const BlogList: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [page, setPage] = React.useState(1);
    const [search, setSearch] = React.useState(searchParams.get('search') || '');
    const [tag, setTag] = React.useState(searchParams.get('tag') || '');
    const [isSearching, setIsSearching] = React.useState(false);
    const limit = 9;

    const { data: blogsData, isLoading, isFetching, error } = useGetPublicBlogsQuery({
        page,
        limit,
        search,
        tag,
    });

    React.useEffect(() => {
        if (error) {
            toast.error('Failed to fetch blogs', {
                description: 'Please try again later.',
            });
        }
    }, [error]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSearching(true);
        const formData = new FormData(e.currentTarget);
        const searchValue = formData.get('search') as string;
        setSearch(searchValue);
        setPage(1);
        const params = new URLSearchParams(searchParams.toString());
        if (searchValue) params.set('search', searchValue);
        else params.delete('search');
        if (tag) params.set('tag', tag);
        router.push(`/resources/blogs?${params.toString()}`);
        setTimeout(() => setIsSearching(false), 500);
    };

    const handleTagClick = (selectedTag: string) => {
        setIsSearching(true);
        const newTag = selectedTag === tag ? '' : selectedTag;
        setTag(newTag);
        setPage(1);
        const params = new URLSearchParams(searchParams.toString());
        if (search) params.set('search', search);
        if (newTag) params.set('tag', newTag);
        else params.delete('tag');
        router.push(`/resources/blogs?${params.toString()}`);
        setTimeout(() => setIsSearching(false), 500);
    };

    const uniqueTags = Array.from(new Set(blogsData?.data?.flatMap((blog) => blog.tags) || [])).sort();
    const featuredBlogs = blogsData?.data?.slice(0, 2) || [];
    const regularBlogs = blogsData?.data?.slice(2) || [];

    return (
        <>
            <NextSeo
                title="Our Blog | Insights & Updates"
                description="Explore our latest articles, insights, and updates on industry trends and topics."
                openGraph={{
                    title: 'Our Blog | Insights & Updates',
                    description: 'Explore our latest articles, insights, and updates on industry trends and topics.',
                    url: 'https://darubiniscreening.com/resources/blogs',
                    type: 'website',
                }}
            />
            <div className="w-full min-h-screen flex flex-col bg-background">
                <main className="container mx-auto px-4 py-8 flex-1">
                    <header className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-primary" />
                            <h1 className="text-3xl font-bold text-foreground">Insights Hub</h1>
                        </div>
                        <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                name="search"
                                placeholder="Search articles..."
                                className="pl-8 h-10 text-sm"
                                defaultValue={search}
                                aria-label="Search blog articles"
                            />
                        </form>
                    </header>

                    {isLoading && page === 1 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(9)].map((_, i) => (
                                <Skeleton key={i} className="h-64 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {featuredBlogs.length > 0 && (
                                <section className="mb-16">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-px bg-border flex-1" />
                                        <h2 className="text-sm font-medium text-muted-foreground">FEATURED ARTICLES</h2>
                                        <div className="h-px bg-border flex-1" />
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {featuredBlogs.map((blog) => (
                                            <Card key={blog.id} className="group hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                                                <div className="relative aspect-[16/9]">
                                                    <Image
                                                        src={blog.coverImageSignedUrl || '/placeholder.jpg'}
                                                        alt={blog.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        priority
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                                                    <div className="absolute bottom-0 left-0 p-6">
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {blog.tags.slice(0, 3).map((t: string) => (
                                                                <Badge
                                                                    key={t}
                                                                    variant="secondary"
                                                                    onClick={() => handleTagClick(t)}
                                                                    className="cursor-pointer hover:bg-primary/20 bg-white/10 text-white"
                                                                    aria-label={`Filter by tag ${t}`}
                                                                >
                                                                    {t}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                        <Link href={`/resources/blogs/${blog.slug}`}>
                                                            <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2">{blog.title}</h3>
                                                        </Link>
                                                        <p className="text-sm text-white/80 line-clamp-2 mb-4">{blog.excerpt || blog.content.slice(0, 100)}</p>
                                                        <div className="flex justify-between items-center">
                              <span className="text-xs text-white/60">
                                {format(new Date(blog.createdAt), 'MMMM d, yyyy')}
                              </span>
                                                            <Link href={`/resources/blogs/${blog.slug}`}>
                                                                <Button variant="default" size="sm">
                                                                    Read More
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <div className="flex flex-col lg:flex-row gap-8">
                                <div className="flex-1">
                                    {(isFetching || isSearching) && page > 1 ? (
                                        <div className="flex justify-center items-center h-64">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        </div>
                                    ) : regularBlogs.length ? (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {regularBlogs.map((blog) => (
                                                    <Card key={blog.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
                                                        {blog.coverImageSignedUrl && (
                                                            <div className="relative aspect-video">
                                                                <Image
                                                                    src={blog.coverImageSignedUrl}
                                                                    alt={blog.title}
                                                                    fill
                                                                    className="object-cover rounded-t-lg"
                                                                    loading="lazy"
                                                                />
                                                            </div>
                                                        )}
                                                        <CardContent className="p-6 flex-1">
                                                            <Link href={`/resources/blogs/${blog.slug}`}>
                                                                <h3 className="text-xl font-semibold mb-3 line-clamp-2 hover:text-primary transition-colors">
                                                                    {blog.title}
                                                                </h3>
                                                            </Link>
                                                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                                                {blog.excerpt || blog.content.slice(0, 100)}
                                                            </p>
                                                            <div className="flex flex-wrap gap-2 mb-4">
                                                                {blog.tags.map((t: string) => (
                                                                    <Badge
                                                                        key={t}
                                                                        variant="outline"
                                                                        onClick={() => handleTagClick(t)}
                                                                        className="cursor-pointer hover:bg-primary/10 text-xs"
                                                                        aria-label={`Filter by tag ${t}`}
                                                                    >
                                                                        {t}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </CardContent>
                                                        <CardFooter className="p-6 pt-0 flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(blog.createdAt), 'MMM d, yyyy')}
                              </span>
                                                            <Link href={`/resources/blogs/${blog.slug}`}>
                                                                <Button variant="link" className="text-primary">
                                                                    Read More
                                                                </Button>
                                                            </Link>
                                                        </CardFooter>
                                                    </Card>
                                                ))}
                                            </div>
                                            {blogsData?.totalPages && blogsData.totalPages > 1 && (
                                                <div className="flex items-center justify-between mt-8">
                                                    <Button
                                                        variant="outline"
                                                        disabled={page === 1 || isFetching}
                                                        onClick={() => setPage((prev) => prev - 1)}
                                                        className="gap-1"
                                                        aria-label="Previous page"
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                        Previous
                                                    </Button>
                                                    <span className="text-sm text-muted-foreground">
      Page {page} of {blogsData?.totalPages}
    </span>
                                                    <Button
                                                        variant="outline"
                                                        disabled={page === blogsData?.totalPages || isFetching}
                                                        onClick={() => setPage((prev) => prev + 1)}
                                                        className="gap-1"
                                                        aria-label="Next page"
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
                                            <h3 className="text-xl font-medium mb-2">No articles found</h3>
                                            <p className="text-muted-foreground max-w-md">
                                                {search || tag
                                                    ? 'Try adjusting your search or filter to find what you’re looking for.'
                                                    : 'No articles available. Check back later!'}
                                            </p>
                                            {(search || tag) && (
                                                <Button
                                                    variant="ghost"
                                                    className="mt-4"
                                                    onClick={() => {
                                                        setSearch('');
                                                        setTag('');
                                                        setPage(1);
                                                        router.push('/resources/blogs');
                                                    }}
                                                >
                                                    Clear filters
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <aside className="lg:w-64 space-y-6">
                                    <div className="bg-card p-6 rounded-lg border">
                                        <h3 className="font-semibold mb-4">Discover by Topic</h3>
                                        {uniqueTags.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {uniqueTags.map((t: string) => (
                                                    <Badge
                                                        key={t}
                                                        variant={tag === t ? 'default' : 'outline'}
                                                        onClick={() => handleTagClick(t)}
                                                        className="cursor-pointer hover:bg-primary/20"
                                                        aria-label={`Filter by tag ${t}`}
                                                    >
                                                        {t}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No topics available</p>
                                        )}
                                    </div>
                                    <NewsletterForm />
                                </aside>
                            </div>
                        </>
                    )}
                </main>
                <FooterSection />
            </div>
        </>
    );
};

export default BlogList;