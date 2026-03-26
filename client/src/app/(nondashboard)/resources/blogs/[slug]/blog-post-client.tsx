'use client';

import * as React from 'react';
import { useGetBlogBySlugQuery, useGetPublicBlogsQuery } from '@/state/api';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Menu, Calendar, Clock, User, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FooterSection from '@/app/(nondashboard)/landing/FooterSection';
import NewsletterForm from '@/app/(nondashboard)/resources/blogs/NewsletterForm';
import { ShareButton } from '@/app/(nondashboard)/resources/blogs/share-button';
import { NextSeo } from 'next-seo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { default as sanitizeHtml } from 'sanitize-html';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface BlogPostClientProps {
    slug: string;
}

const BlogPostClient: React.FC<BlogPostClientProps> = ({ slug }) => {
    const { data: post, isLoading, isError } = useGetBlogBySlugQuery(slug);
    const { data: publicBlogs, isLoading: isPublicLoading } = useGetPublicBlogsQuery({
        page: 1,
        limit: 10,
    });

    const [headings, setHeadings] = React.useState<{ id: string; text: string; level: number }[]>([]);
    const [isTocOpen, setIsTocOpen] = React.useState(false);

    // Environment variables for S3
    const S3_BUCKET = process.env.NEXT_PUBLIC_AWS_S3_BUCKET || '';
    const S3_REGION = process.env.NEXT_PUBLIC_AWS_REGION || '';
    const DEFAULT_AVATAR = '/default-avatar.png';

    React.useEffect(() => {
        if (isError) {
            toast.error('Failed to load blog post', {
                description: 'Please try again later.',
            });
            notFound();
        }

        if (post) {
            // console.log('post:', post);
            // console.log('coverImageSignedUrl:', post.coverImageSignedUrl);
            if (post.content) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(post.content, 'text/html');
                const headingElements = Array.from(doc.querySelectorAll('h1, h2, h3'));
                const extractedHeadings = headingElements.map((heading, index) => ({
                    id: heading.id || heading.textContent?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || `heading-${index}`,
                    text: heading.textContent || '',
                    level: parseInt(heading.tagName.substring(1)),
                }));
                setHeadings(extractedHeadings);
            }
        }
    }, [isError, post]);

    const relatedBlogs = React.useMemo(() => {
        if (!publicBlogs?.data) return [];
        const currentTags = new Set<string>(post?.tags || []);
        return publicBlogs.data
            .filter((blog) => blog.id !== post?.id && blog.published)
            .sort((a, b) => {
                const aMatchingTags = a.tags.filter((tag: string) => currentTags.has(tag)).length;
                const bMatchingTags = b.tags.filter((tag: string) => currentTags.has(tag)).length;
                return bMatchingTags - aMatchingTags || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
            .slice(0, 3);
    }, [publicBlogs, post?.id, post?.tags]);

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
            img: ['src', 'alt', 'width', 'height'],
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
    const sanitizedContent = post?.content ? sanitizeHtml(post.content, sanitizeOptions) : '';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="max-w-4xl mx-auto">
                        <Skeleton className="h-4 w-32 mb-6" />
                        <Skeleton className="h-12 w-3/4 mb-6" />
                        <Skeleton className="h-6 w-1/2 mb-8" />
                        <Skeleton className="h-96 w-full mb-8 rounded-2xl" />
                        <div className="space-y-4">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-4 w-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        notFound();
        return null;
    }

    // Construct author profile picture URL with validation
    const authorProfilePic = post.author?.profilePicture && S3_BUCKET && S3_REGION
        ? `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${post.author.profilePicture}`
        : DEFAULT_AVATAR;

    // Construct cover image URL
    const coverImageUrl = post.coverImageSignedUrl && post.coverImageSignedUrl.startsWith('http')
        ? post.coverImageSignedUrl
        : post.coverImageSignedUrl && S3_BUCKET && S3_REGION
            ? `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${post.coverImageSignedUrl}`
            : null;

    return (
        <>
            <NextSeo
                title={`${post.title} | Darubini Screening Blog`}
                description={post.excerpt || post.content?.slice(0, 160) || ''}
                openGraph={{
                    title: post.title,
                    description: post.excerpt || post.content?.slice(0, 160) || '',
                    url: `https://darubiniscreening.com/blogs/${post.slug}`,
                    type: 'article',
                    images: post.coverImageSignedUrl ? [{ url: post.coverImageSignedUrl }] : [],
                    article: {
                        publishedTime: post.createdAt,
                        modifiedTime: post.updatedAt,
                        authors: [post.author?.name || 'Admin'],
                        tags: post.tags,
                    },
                }}
                additionalMetaTags={[
                    {
                        name: 'keywords',
                        content: post.tags.join(', '),
                    },
                ]}
            />

            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
                <main className="container mx-auto px-4 py-8 max-w-7xl">
                    {/* Back Button and TOC */}
                    <div className="flex justify-between items-center mb-8">
                        <Button asChild variant="ghost" className="pl-0 hover:bg-transparent group">
                            <Link href="/resources/blogs" className="flex items-center text-muted-foreground hover:text-primary transition-colors" aria-label="Back to blog list">
                                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                Back to Blog
                            </Link>
                        </Button>
                        {headings.length > 0 && (
                            <Sheet open={isTocOpen} onOpenChange={setIsTocOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" className="lg:hidden" aria-label="Toggle table of contents">
                                        <Menu className="h-4 w-4 mr-2" />
                                        Contents
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                    <div className="flex flex-col h-full">
                                        <h3 className="font-bold text-lg mb-4 text-foreground">Table of Contents</h3>
                                        <nav className="flex-1 overflow-y-auto">
                                            <ul className="space-y-3">
                                                {headings.map((heading, index) => (
                                                    <li
                                                        key={index}
                                                        className={`text-sm ${
                                                            heading.level === 2 ? 'ml-4' :
                                                                heading.level === 3 ? 'ml-6' :
                                                                    heading.level === 4 ? 'ml-8' : ''
                                                        } border-l-2 border-muted pl-3 hover:border-primary transition-colors`}
                                                    >
                                                        <a
                                                            href={`#${heading.id}`}
                                                            className="text-muted-foreground hover:text-primary transition-colors block py-1"
                                                            onClick={() => setIsTocOpen(false)}
                                                            aria-label={`Jump to ${heading.text}`}
                                                        >
                                                            {heading.text}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </nav>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        )}
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Table of Contents - Desktop */}
                        {headings.length > 0 && (
                            <aside className="hidden lg:block w-80 flex-shrink-0">
                                <div className="sticky top-24">
                                    <Card className="border-l-4 border-l-primary">
                                        <CardContent className="p-6">
                                            <h3 className="font-bold text-lg mb-4 text-foreground">Table of Contents</h3>
                                            <nav>
                                                <ul className="space-y-3">
                                                    {headings.map((heading, index) => (
                                                        <li
                                                            key={index}
                                                            className={`text-sm ${
                                                                heading.level === 2 ? 'ml-4' :
                                                                    heading.level === 3 ? 'ml-6' :
                                                                        heading.level === 4 ? 'ml-8' : ''
                                                            } border-l-2 border-muted pl-3 hover:border-primary transition-colors`}
                                                        >
                                                            <a
                                                                href={`#${heading.id}`}
                                                                className="text-muted-foreground hover:text-primary transition-colors block py-1"
                                                                aria-label={`Jump to ${heading.text}`}
                                                            >
                                                                {heading.text}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </nav>
                                        </CardContent>
                                    </Card>
                                </div>
                            </aside>
                        )}

                        {/* Main Content */}
                        <article className="flex-1 max-w-4xl mx-auto">
                            {/* Article Header */}
                            <header className="mb-12 text-center">
                                <div className="flex flex-wrap justify-center gap-2 mb-6">
                                    {post.tags.map((tag: string) => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                                        >
                                            <Link
                                                href={`/resources/blogs?tag=${encodeURIComponent(tag)}`}
                                                aria-label={`Filter by tag ${tag}`}
                                            >
                                                {tag}
                                            </Link>
                                        </Badge>
                                    ))}
                                </div>

                                <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent">
                                    {post.title}
                                </h1>

                                <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
                                    {post.excerpt}
                                </p>

                                {/* Meta Information */}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            <Link
                                                href={`/resources/authors/${post.author?.id || 'unknown'}`}
                                                className="hover:text-primary transition-colors font-medium"
                                                aria-label={`View all posts by ${post.author?.name || 'Admin'}`}
                                            >
                                                {post.author?.name || 'Admin'}
                                            </Link>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>{format(new Date(post.createdAt), 'MMMM d, yyyy')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            <span>{Math.ceil((post.content?.length || 0) / 500)} min read</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cover Image */}
                                {coverImageUrl && (
                                    <div className="relative w-full aspect-[16/9] mb-8 rounded-2xl overflow-hidden border shadow-lg">
                                        <Image
                                            src={coverImageUrl}
                                            alt={post.title}
                                            fill
                                            className="object-cover"
                                            priority
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                                            onError={() => console.error('Failed to load cover image:', coverImageUrl)}
                                        />
                                    </div>
                                )}
                            </header>

                            {/* Article Content */}
                            <div className="prose prose-lg dark:prose-invert max-w-none mb-16">
                                {sanitizedContent ? (
                                    <ReactMarkdown
                                        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeOptions]]}
                                        components={{
                                            h1: ({ node, ...props }) => (
                                                <h1
                                                    id={props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}
                                                    className="text-4xl font-bold mt-12 mb-6 scroll-mt-24 border-b pb-2"
                                                    {...props}
                                                />
                                            ),
                                            h2: ({ node, ...props }) => (
                                                <h2
                                                    id={props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}
                                                    className="text-3xl font-semibold mt-10 mb-4 scroll-mt-24 text-foreground"
                                                    {...props}
                                                />
                                            ),
                                            h3: ({ node, ...props }) => (
                                                <h3
                                                    id={props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}
                                                    className="text-2xl font-medium mt-8 mb-3 scroll-mt-24 text-foreground"
                                                    {...props}
                                                />
                                            ),
                                            h4: ({ node, ...props }) => (
                                                <h4
                                                    id={props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}
                                                    className="text-xl font-medium mt-6 mb-3 scroll-mt-24 text-foreground"
                                                    {...props}
                                                />
                                            ),
                                            p: ({ node, ...props }) => <p className="text-lg leading-relaxed mb-6 text-foreground/90" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-6 space-y-2" {...props} />,
                                            li: ({ node, ...props }) => <li className="mb-2 text-foreground/90" {...props} />,
                                            a: ({ node, ...props }) => <a className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors" {...props} />,
                                            img: ({ node, src, alt, ...props }) => {
                                                if (!src || (typeof src === 'string' && src.trim() === '')) {
                                                    console.warn(`Image skipped due to invalid src: ${src}`);
                                                    return null;
                                                }
                                                if (src instanceof Blob) {
                                                    console.warn(`Blob src not supported for images: ${src}`);
                                                    return null;
                                                }
                                                const imageSrc = src.startsWith('http')
                                                    ? src
                                                    : `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${src}`;
                                                return (
                                                    <div className="my-8">
                                                        <img
                                                            src={imageSrc}
                                                            alt={alt || 'Image'}
                                                            className="max-w-full h-auto rounded-xl shadow-md mx-auto"
                                                            onError={() => console.error('Failed to load content image:', imageSrc)}
                                                            {...props}
                                                        />
                                                        {alt && (
                                                            <p className="text-center text-sm text-muted-foreground mt-2 italic">
                                                                {alt}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            },
                                            code: ({ node, className, children, ...props }) => {
                                                const isInline = !className?.includes('language-');
                                                return isInline ? (
                                                    <code className="bg-muted px-2 py-1 rounded-md text-sm font-mono" {...props}>
                                                        {children}
                                                    </code>
                                                ) : (
                                                    <div className="my-6">
                                                        <pre className="bg-muted p-6 rounded-lg overflow-x-auto border">
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        </pre>
                                                    </div>
                                                );
                                            },
                                            blockquote: ({ node, ...props }) => (
                                                <blockquote className="border-l-4 border-primary pl-6 italic text-muted-foreground my-8 bg-muted/50 py-4 rounded-r-lg" {...props} />
                                            ),
                                            table: ({ node, ...props }) => (
                                                <div className="overflow-x-auto my-8">
                                                    <table className="min-w-full border-collapse border border-muted rounded-lg overflow-hidden" {...props} />
                                                </div>
                                            ),
                                            th: ({ node, ...props }) => (
                                                <th className="border border-muted bg-muted px-4 py-3 text-left font-semibold" {...props} />
                                            ),
                                            td: ({ node, ...props }) => (
                                                <td className="border border-muted px-4 py-3" {...props} />
                                            ),
                                        }}
                                    >
                                        {sanitizedContent}
                                    </ReactMarkdown>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground text-lg">No content available.</p>
                                    </div>
                                )}
                            </div>

                            {/* Author Section - Enhanced */}
                            <section className="mt-16 p-8 bg-card rounded-2xl border shadow-sm">
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                                        <AvatarImage src={authorProfilePic} alt={post.author?.name || 'Admin'} />
                                        <AvatarFallback className="text-lg font-semibold">
                                            {post.author?.name?.charAt(0) || 'A'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                                            <div>
                                                <h3 className="text-2xl font-bold text-foreground">Written by {post.author?.name || 'Admin'}</h3>
                                                <p className="text-muted-foreground mt-1">
                                                    {post.author?.title || 'Contributing Writer'}
                                                </p>
                                            </div>
                                            <Button asChild variant="outline" className="mt-4 md:mt-0">
                                                <Link
                                                    href={`/resources/authors/${post.author?.id || 'unknown'}`}
                                                    aria-label={`View all posts by ${post.author?.name || 'Admin'}`}
                                                >
                                                    View All Posts
                                                </Link>
                                            </Button>
                                        </div>
                                        <p className="text-foreground/80 leading-relaxed">
                                            {post.author?.bio || 'Expert writer contributing valuable insights to the Darubini Screening community. Passionate about sharing knowledge and helping readers make informed decisions.'}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Action Section */}
                            <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Share2 className="h-4 w-4" />
                                    <span className="text-sm font-medium">Share this article:</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <ShareButton
                                        title={post.title}
                                        text={post.excerpt || 'Check out this blog post!'}
                                        url={`/resources/blogs/${post.slug}`}
                                    />
                                    <Button asChild variant="ghost" className="hover:bg-transparent">
                                        <Link href="/resources/blogs" className="flex items-center text-primary" aria-label="Back to blog list">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Back to Blog
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Related Articles */}
                            <section className="mt-16">
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-bold mb-3">You Might Also Like</h2>
                                    <p className="text-muted-foreground text-lg">Discover more insightful articles</p>
                                </div>
                                {isPublicLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {[...Array(3)].map((_, i) => (
                                            <Card key={i} className="overflow-hidden">
                                                <Skeleton className="h-48 w-full" />
                                                <CardContent className="p-6">
                                                    <Skeleton className="h-6 w-3/4 mb-3" />
                                                    <Skeleton className="h-4 w-full mb-2" />
                                                    <Skeleton className="h-4 w-5/6" />
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : relatedBlogs.length ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {relatedBlogs.map((blog) => (
                                            <Card key={blog.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-card">
                                                <Link
                                                    href={`/resources/blogs/${blog.slug}`}
                                                    className="block"
                                                    aria-label={`Read more about ${blog.title}`}
                                                >
                                                    {blog.coverImageSignedUrl && (
                                                        <div className="relative aspect-[16/9] w-full overflow-hidden">
                                                            <Image
                                                                src={blog.coverImageSignedUrl}
                                                                alt={blog.title}
                                                                fill
                                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                                loading="lazy"
                                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                                        </div>
                                                    )}
                                                    <CardContent className="p-6">
                                                        <h3 className="text-xl font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                                            {blog.title}
                                                        </h3>
                                                        <p className="text-muted-foreground line-clamp-3 mb-4">
                                                            {blog.excerpt || blog.content?.slice(0, 120) + '...'}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-primary font-semibold text-sm group-hover:underline">
                                                                Read More
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {Math.ceil((blog.content?.length || 0) / 500)} min read
                                                            </span>
                                                        </div>
                                                    </CardContent>
                                                </Link>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground text-lg">No related posts available.</p>
                                        <Button asChild variant="outline" className="mt-4">
                                            <Link href="/resources/blogs">
                                                Explore All Articles
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </section>
                        </article>
                    </div>
                </main>
                <NewsletterForm />
                <FooterSection />
            </div>
        </>
    );
};

export default BlogPostClient;