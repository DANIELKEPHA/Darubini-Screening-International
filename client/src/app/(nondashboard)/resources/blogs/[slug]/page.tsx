
import { notFound } from 'next/navigation';
import BlogPostClient from "@/app/(nondashboard)/resources/blogs/[slug]/blog-post-client";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <BlogPostClient slug={slug} />;
}