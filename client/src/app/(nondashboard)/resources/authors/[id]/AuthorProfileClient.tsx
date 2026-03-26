// app/(nondashboard)/authors/[id]/AuthorProfileClient.tsx
'use client';

import * as React from 'react';
import { useGetAuthorByIdQuery, useGetBlogsByAuthorQuery } from '@/state/api';
import { notFound } from 'next/navigation';
import { NextSeo } from 'next-seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import FooterSection from '@/app/(nondashboard)/landing/FooterSection';
import NewsletterForm from "@/app/(nondashboard)/resources/blogs/NewsletterForm";

interface AuthorProfileClientProps {
    id: string;
}

const AuthorProfileClient: React.FC<AuthorProfileClientProps> = ({ id }) => {
    const authorId = Number(id);
    const { data: author, isLoading: isAuthorLoading, error: authorError } = useGetAuthorByIdQuery(authorId);
    const [page, setPage] = React.useState(1);
    const limit = 9;
    const { data: blogsData, isLoading: isBlogsLoading, isFetching, error: blogsError } = useGetBlogsByAuthorQuery({
        authorId,
        page,
        limit,
    });

    React.useEffect(() => {
        if (authorError || blogsError) {
            toast.error('Failed to load author profile or blogs', {
                description: 'Please try again later.',
            });
            notFound();
        }
    }, [authorError, blogsError]);

    if (isAuthorLoading || (isBlogsLoading && page === 1)) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex items-center gap-6 mb-8">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(9)].map((_, i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (!author) {
        notFound();
        return null;
    }

    const profilePicUrl = author.profilePicture
        ? `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${author.profilePicture}`
        : '/default-avatar.png';

    return (
        <>
            <NextSeo
                title={`${author.name} - Author Profile | Darubini Screening`}
                description={author.bio || `Read articles by ${author.name} on Darubini Screening.`}
                canonical={`https://darubiniscreening.com/resources/authors/${author.id}`}
                openGraph={{
                    title: `${author.name} - Author Profile`,
                    description: author.bio || `Read articles by ${author.name} on Darubini Screening.`,
                    url: `https://darubiniscreening.com/resources/authors/${author.id}`,
                    type: 'profile',
                    images: [{ url: profilePicUrl, alt: `${author.name} avatar` }],
                    profile: {
                        username: author.name,
                    },
                }}
                additionalMetaTags={[
                    {
                        name: 'keywords',
                        content: `author, ${author.name}, Darubini Screening, blog`,
                    },
                ]}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Person',
                        name: author.name,
                        email: author.email,
                        image: profilePicUrl,
                        description: author.bio,
                        url: `https://darubiniscreening.com/resources/authors/${author.id}`,
                        sameAs: author.email ? [`mailto:${author.email}`] : [],
                    }),
                }}
            />
            <div className="w-full min-h-screen flex flex-col bg-background">
                <main className="container mx-auto px-4 py-8 max-w-5xl">
                    <Button asChild variant="ghost" className="mb-6 pl-0 hover:bg-transparent">
                        <Link href="/resources/blogs" className="flex items-center text-primary" aria-label="Back to blog list">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Blogs
                        </Link>
                    </Button>

                    {/* Author Header */}
                    <section className="text-center mb-12">
                        <Avatar className="h-32 w-32 mx-auto mb-6">
                            <AvatarImage src={profilePicUrl} alt={`${author.name} avatar`} />
                            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h1 className="text-4xl font-bold mb-4">{author.name}</h1>
                        <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">{author.bio || 'No bio available.'}</p>
                        <div className="text-sm text-muted-foreground">
                            <span>{blogsData?.data?.length || 0} articles</span>
                            {author.email && (
                                <>
                                    <span className="mx-2">•</span>
                                    <a href={`mailto:${author.email}`} className="hover:text-primary" aria-label={`Email ${author.name}`}>
                                        {author.email}
                                    </a>
                                </>
                            )}
                        </div>
                    </section>

                    {/* Author's Blogs */}
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1">
                            {(isFetching && page > 1) ? (
                                <div className="flex justify-center items-center h-64">
                                    <Skeleton className="h-8 w-8 animate-pulse" />
                                </div>
                            ) : blogsData?.data?.length ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                        {blogsData.data.map((blog) => (
                                            <Card
                                                key={blog.id}
                                                className="hover:shadow-lg transition-shadow duration-300 flex flex-col"
                                            >
                                                {blog.coverImageSignedUrl && (
                                                    <div className="relative aspect-video">
                                                        <Image
                                                            src={blog.coverImageSignedUrl}
                                                            alt={blog.title}
                                                            fill
                                                            className="object-cover rounded-t-lg"
                                                            loading="lazy"
                                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                        />
                                                    </div>
                                                )}
                                                <CardContent className="p-6 flex-1">
                                                    <Link href={`/resources/blogs/${blog.slug}`}>
                                                        <h3 className="text-xl font-semibold line-clamp-2 hover:text-primary transition-colors">
                                                            {blog.title}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                                                        {blog.excerpt || blog.content.slice(0, 100) + '...'}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mt-4">
                                                        {blog.tags.slice(0, 3).map((tag: string) => (
                                                            <Link
                                                                key={tag}
                                                                href={`/resources/blogs?tag=${encodeURIComponent(tag)}&author=${author.id}`}
                                                                aria-label={`Filter blogs by tag ${tag}`}
                                                            >
                                                                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                                                                    {tag}
                                                                </Badge>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                                <CardFooter className="p-6 pt-0">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(blog.createdAt), 'MMM d, yyyy')}
                          </span>
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
                                                aria-label="Previous page"
                                            >
                                                <ChevronLeft className="h-4 w-4 mr-2" />
                                                Previous
                                            </Button>
                                            <span className="text-sm text-muted-foreground">
                        Page {page} of {blogsData.totalPages}
                      </span>
                                            <Button
                                                variant="outline"
                                                disabled={page === blogsData.totalPages || isFetching}
                                                onClick={() => setPage((prev) => prev + 1)}
                                                aria-label="Next page"
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-16">
                                    <h3 className="text-xl font-medium mb-2">No articles yet</h3>
                                    <p className="text-muted-foreground">This author hasn&#39;t published any posts.</p>
                                </div>
                            )}
                        </div>
                        <aside className="lg:w-64 space-y-6">
                            <NewsletterForm />
                        </aside>
                    </div>
                </main>
                <FooterSection />
            </div>
        </>
    );
};

export default AuthorProfileClient;