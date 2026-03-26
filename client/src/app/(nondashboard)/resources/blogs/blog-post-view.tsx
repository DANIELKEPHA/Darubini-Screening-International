'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate, calculateReadTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ShareButton } from '@/app/(nondashboard)/resources/blogs/share-button';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import { Blog } from '@/types/prismaTypes';
import { useGetPublicBlogsQuery } from '@/state/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { default as sanitizeHtml } from 'sanitize-html';

interface BlogPostViewProps {
    post: Blog;
}

export default function BlogPostView({ post }: BlogPostViewProps) {
    const { data: publicBlogs, isLoading: isPublicLoading, error: publicError } = useGetPublicBlogsQuery({
        page: 1,
        limit: 10,
    });

    const [headings, setHeadings] = React.useState<{ id: string; text: string; level: number }[]>([]);

    React.useEffect(() => {
        if (publicError) {
            console.error('Public blogs error:', publicError);
            toast.error('Failed to load related blogs', {
                description: 'data' in publicError ? (publicError.data as any)?.message || 'An unexpected error occurred' : 'An unexpected error occurred',
            });
        }

        // Extract headings from content for TOC
        const parser = new DOMParser();
        const doc = parser.parseFromString(post.content || '', 'text/html');
        const headingElements = Array.from(doc.querySelectorAll('h1, h2, h3'));

        const extractedHeadings = headingElements.map((heading) => ({
            id: heading.id || heading.textContent?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '',
            text: heading.textContent || '',
            level: parseInt(heading.tagName.substring(1)),
        }));

        setHeadings(extractedHeadings);
    }, [publicError, post.content]);

    const relatedBlogs = React.useMemo(() => {
        if (!publicBlogs?.data) return [];

        const currentTags = new Set<string>(post.tags || []);
        return publicBlogs.data
            .filter((blog) => blog.id !== post.id && blog.published)
            .sort((a, b) => {
                const aMatchingTags = a.tags.filter((tag: string) => currentTags.has(tag)).length;
                const bMatchingTags = b.tags.filter((tag: string) => currentTags.has(tag)).length;
                return bMatchingTags - aMatchingTags || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
            .slice(0, 3);
    }, [publicBlogs, post.id, post.tags]);

    // Custom sanitization schema
    const sanitizeOptions = {
        allowedTags: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
            'blockquote', 'code', 'pre', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'span', 'div',
        ],
        allowedAttributes: {
            a: ['href', 'target', 'rel'],
            img: ['src', 'alt'],
            span: ['style'],
            div: ['class'],
        },
        allowedStyles: {
            span: {
                color: [/^#[0-9A-Fa-f]{6}$/],
                'font-size': [/^\d+(?:px|em|rem)$/],
            },
        },
    };

    // Sanitize content before passing to ReactMarkdown
    const sanitizedContent = post.content ? sanitizeHtml(post.content, sanitizeOptions) : '';

    return (
        <div className="px-2 sm:px-4 py-8 bg-background">
            <div className="mx-auto max-w-5xl">
                <Button asChild variant="ghost" className="mb-6 pl-0 hover:bg-transparent">
                    <Link href="/resources/blogs" className="flex items-center text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Blog
                    </Link>
                </Button>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Table of Contents (left sidebar) */}
                    {headings.length > 0 && (
                        <div className="hidden lg:block w-64 flex-shrink-0">
                            <div className="sticky top-24">
                                <div className="rounded-lg border p-4 bg-card">
                                    <h3 className="font-semibold mb-3">Table of Contents</h3>
                                    <ul className="space-y-2">
                                        {headings.map((heading, index) => (
                                            <li key={index} className={`${heading.level === 2 ? 'ml-4' : heading.level === 3 ? 'ml-8' : ''}`}>
                                                <a
                                                    href={`#${heading.id}`}
                                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    {heading.text}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1">
                        <article className="prose prose-lg dark:prose-invert max-w-none">
                            <header className="mb-8">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {post.tags?.map((tag: string) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">{post.title}</h1>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                                    <span>{formatDate(post.createdAt)}</span>
                                    <span>•</span>
                                    <span>{calculateReadTime(post.content || '')} min read</span>
                                </div>

                                {post.coverImageSignedUrl && (
                                    <div className="relative w-full aspect-[16/9] mb-8 rounded-xl overflow-hidden border">
                                        <Image
                                            src={post.coverImageSignedUrl}
                                            alt={post.title}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                    </div>
                                )}
                            </header>

                            <div className="blog-content space-y-6">
                                {sanitizedContent ? (
                                    <ReactMarkdown
                                        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeOptions]]}
                                        components={{
                                            h1: ({ node, ...props }) => (
                                                <h1
                                                    id={props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}
                                                    className="text-3xl font-bold mt-8 mb-4 scroll-mt-24"
                                                    {...props}
                                                />
                                            ),
                                            h2: ({ node, ...props }) => (
                                                <h2
                                                    id={props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}
                                                    className="text-2xl font-semibold mt-8 mb-4 scroll-mt-24"
                                                    {...props}
                                                />
                                            ),
                                            h3: ({ node, ...props }) => (
                                                <h3
                                                    id={props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}
                                                    className="text-xl font-medium mt-6 mb-3 scroll-mt-24"
                                                    {...props}
                                                />
                                            ),
                                            p: ({ node, ...props }) => <p className="text-base leading-relaxed mb-4" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
                                            li: ({ node, ...props }) => <li className="mb-2" {...props} />,
                                            a: ({ node, ...props }) => <a className="text-primary hover:underline" {...props} />,
                                        }}
                                    >
                                        {sanitizedContent}
                                    </ReactMarkdown>
                                ) : (
                                    <p className="text-muted-foreground">No content available.</p>
                                )}
                            </div>

                            {/* Author section */}
                            <section className="mt-12 p-6 bg-card rounded-lg border">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={post.author?.image || '/default-avatar.png'} />
                                        <AvatarFallback>{post.author?.name?.charAt(0) || 'A'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold">Written by {post.author?.name || 'Admin'}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {post.author?.bio || 'Contributing writer at your Darubini'}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <div className="mt-8 pt-6 border-t flex justify-between items-center">
                                <ShareButton
                                    title={post.title}
                                    text={post.excerpt || 'Check out this blog post!'}
                                    url={`/resources/blogs/${post.slug}`}
                                />
                                <Button asChild variant="ghost">
                                    <Link href="/resources/blogs" className="flex items-center text-primary">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Blog
                                    </Link>
                                </Button>
                            </div>
                        </article>

                        <section className="mt-12">
                            <h2 className="text-2xl font-semibold mb-6">You might also like</h2>
                            {isPublicLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex flex-col">
                                            <Skeleton className="h-40 w-full rounded-lg mb-4" />
                                            <Skeleton className="h-6 w-3/4 mb-2" />
                                            <Skeleton className="h-4 w-full mb-2" />
                                            <Skeleton className="h-4 w-5/6" />
                                        </div>
                                    ))}
                                </div>
                            ) : relatedBlogs.length ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {relatedBlogs.map((blog) => (
                                        <Link
                                            key={blog.id}
                                            href={`/resources/blogs/${blog.slug}`}
                                            className="flex flex-col rounded-lg border bg-card hover:shadow-lg transition-shadow"
                                        >
                                            {blog.coverImageSignedUrl && (
                                                <div className="relative aspect-[16/9] w-full rounded-t-lg overflow-hidden">
                                                    <Image
                                                        src={blog.coverImageSignedUrl}
                                                        alt={blog.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="p-4 flex-1">
                                                <h3 className="text-lg font-semibold line-clamp-2">{blog.title}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                                                    {blog.excerpt || blog.content?.slice(0, 100) + '...'}
                                                </p>
                                                <span className="text-sm text-primary font-medium mt-4 inline-block">
                                                    Read More
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No related posts available.</p>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}