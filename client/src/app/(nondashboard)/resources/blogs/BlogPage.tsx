"use client";

import * as React from "react";
import { useGetAuthUserQuery, useGetPublicBlogsQuery } from "@/state/api";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Tag, ChevronLeft, ChevronRight, Edit, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface BlogPageProps {}

const BlogsPage: React.FC<BlogPageProps> = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for pagination and filters
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [tag, setTag] = React.useState(searchParams.get("tag") || "");
  const [isSearching, setIsSearching] = React.useState(false);
  const limit = 8; // Adjusted for better layout

  // Fetch authenticated user to check for admin role
  const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();

  // Fetch public blogs
  const {
    data: blogsData,
    isLoading: isBlogsLoading,
    error: blogsError,
    isFetching
  } = useGetPublicBlogsQuery({
    page,
    limit,
    search,
    tag,
  });

  // Handle search submission
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSearching(true);
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get("search") as string;
    setSearch(searchValue);
    setPage(1);

    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    if (tag) params.set("tag", tag);
    router.push(`/resources/blogs?${params.toString()}`);
    setTimeout(() => setIsSearching(false), 500);
  };

  // Handle tag selection
  const handleTagClick = (selectedTag: string) => {
    setIsSearching(true);
    setTag(selectedTag === tag ? "" : selectedTag);
    setPage(1);

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedTag !== tag) params.set("tag", selectedTag);
    router.push(`/resources/blogs?${params.toString()}`);
    setTimeout(() => setIsSearching(false), 500);
  };

  // Handle errors
  React.useEffect(() => {
    if (blogsError) toast.error("Failed to fetch blogs");
  }, [blogsError]);

  // Loading state
  if (isAuthLoading || (isBlogsLoading && page === 1)) {
    return (
        <div className="container mx-auto px-4 py-8">
          {/* Skeleton loading */}
        </div>
    );
  }

  // Extract unique tags from blogs for filtering
  const uniqueTags: string[] = Array.from(
      new Set(blogsData?.data?.flatMap((blog) => blog.tags) || [])
  ).sort();

  // Get latest two articles for hero section
  const latestArticles = blogsData?.data?.slice(0, 2) || [];
  const regularArticles = blogsData?.data?.slice(2) || [];

  return (
      <div className="container mx-auto px-4 py-8">
        {/* Header with minimal search */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Insights Hub</h1>
          </div>
          <form onSubmit={handleSearch} className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
                name="search"
                placeholder="Search articles..."
                className="pl-8 h-9 text-sm"
                defaultValue={search}
            />
          </form>
        </header>

        {/* Hero Section - Latest Articles */}
        {latestArticles.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-border flex-1" />
                <h2 className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  LATEST ARTICLES
                </h2>
                <div className="h-px bg-border flex-1" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {latestArticles.map((blog, index) => (
                    <Card key={blog.id} className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                      <div className="relative aspect-[16/9]">
                        <Image
                            src={blog.coverImageSignedUrl || "/placeholder-article.jpg"}
                            alt={blog.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {blog.tags.slice(0, 2).map((t: string) => (
                                <Badge
                                    key={t}
                                    variant="secondary"
                                    onClick={() => handleTagClick(t)}
                                    className="cursor-pointer hover:bg-primary/10 backdrop-blur-sm bg-white/10 text-white"
                                >
                                  {t}
                                </Badge>
                            ))}
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2">{blog.title}</h3>
                          <p className="text-sm text-white/80 line-clamp-2 mb-4">{blog.excerpt || blog.content}</p>
                          <div className="flex justify-between items-center">
                      <span className="text-xs text-white/60">
                        {blog.createdAt && format(new Date(blog.createdAt), "MMMM d, yyyy")}
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

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main articles grid */}
          <div className="flex-1">
            {(isFetching || isSearching) && page > 1 ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : blogsData?.data?.length ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {regularArticles.map((blog) => (
                        <Card key={blog.id} className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
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
                          <CardContent className="p-6 flex-1 flex flex-col">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold mb-3 line-clamp-2">{blog.title}</h3>
                              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{blog.excerpt || blog.content}</p>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {blog.tags.map((t: string) => (
                                    <Badge
                                        key={t}
                                        variant="outline"
                                        onClick={() => handleTagClick(t)}
                                        className="cursor-pointer hover:bg-primary/10 text-xs"
                                    >
                                      {t}
                                    </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t">
                              <div className="text-sm text-muted-foreground">
                                {blog.createdAt && format(new Date(blog.createdAt), "MMM d, yyyy")}
                              </div>
                              <div className="flex gap-2">
                                <Link href={`/resources/blogs/${blog.slug}`}>
                                  <Button variant="default" size="sm">
                                    Read
                                  </Button>
                                </Link>
                                {authUser?.userRole === "admin" && (
                                    <Link href={`/admin/blogs?editBlogId=${blog.id}`}>
                                      <Button variant="outline" size="sm" className="p-2">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                )}
                              </div>
                            </div>
                          </CardContent>
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
                  <h3 className="text-xl font-medium mb-2">No articles found</h3>
                  <p className="text-muted-foreground max-w-md">
                    {search || tag
                        ? "Try adjusting your search or filter to find what you're looking for."
                        : "There are currently no articles available. Check back later!"}
                  </p>
                  {(search || tag) && (
                      <Button
                          variant="ghost"
                          className="mt-4"
                          onClick={() => {
                            setSearch("");
                            setTag("");
                            setPage(1);
                            router.push("/resources/blogs");
                          }}
                      >
                        Clear filters
                      </Button>
                  )}
                </div>
            )}
          </div>

          {/* Sidebar - Categories/Tags */}
          <div className="lg:w-64 space-y-6">
            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="font-medium mb-4">Discover by Topic</h3>
              <div className="space-y-2">
                {uniqueTags.length > 0 ? (
                    uniqueTags.map((t: string) => (
                        <div
                            key={t}
                            onClick={() => handleTagClick(t)}
                            className={`text-sm py-2 px-3 rounded-md cursor-pointer transition-colors ${tag === t
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"}`}
                        >
                          {t}
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground text-sm">No topics available</p>
                )}
              </div>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="font-medium mb-4">Subscribe</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get the latest articles delivered to your inbox
              </p>
              <div className="space-y-3">
                <Input placeholder="Your email" className="h-9" />
                <Button className="w-full">Subscribe</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default BlogsPage;