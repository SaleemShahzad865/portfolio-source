import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { useGetPostBySlug, getGetPostBySlugQueryKey, useListPosts } from "@workspace/api-client-react";
import ReactMarkdown from "react-markdown";
import { Calendar, Clock, ArrowLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeList } from "@/lib/normalize-list";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";
  
  const { data: post, isLoading, isError } = useGetPostBySlug(slug, {
    query: {
      enabled: !!slug,
      queryKey: getGetPostBySlugQueryKey(slug),
      retry: false
    }
  });

  const { data: allPosts } = useListPosts();
  const postList = normalizeList(allPosts);

  if (isLoading) {
    return (
      <div className="py-24 container mx-auto px-4 max-w-4xl space-y-8">
        <Skeleton className="h-6 w-32 mb-8" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="w-full aspect-[21/9] rounded-2xl my-16" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
        <Button asChild variant="outline">
          <Link href="/blog"><ArrowLeft className="mr-2 w-4 h-4" /> Back to Blog</Link>
        </Button>
      </div>
    );
  }

  const relatedPosts = postList.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="py-24">
      {/* Hero Section */}
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/blog" className="inline-flex items-center text-sm font-mono text-muted-foreground hover:text-primary transition-colors mb-8 group">
            <ArrowLeft className="mr-2 w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Log
          </Link>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map(tag => (
              <Badge key={tag} variant="outline" className="font-mono bg-primary/5 text-primary border-primary/20">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground font-mono mb-12 py-6 border-y border-border/50">
            <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {post.publishedAt}</span>
            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {post.readTimeMinutes} min read</span>
          </div>
        </motion.div>
      </div>

      {/* Cover Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full max-w-6xl mx-auto px-4 mb-16"
      >
        <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-border/50 relative">
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
        </div>
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
        >
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </motion.div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="container mx-auto px-4 max-w-6xl mt-32 pt-16 border-t border-border/50">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-display font-bold">More Logs</h2>
            <Link href="/blog" className="hidden md:flex items-center text-sm font-mono text-primary hover:underline">
              View all <ChevronRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {relatedPosts.map((relatedPost, i) => (
              <motion.div
                key={relatedPost.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/blog/${relatedPost.slug}`} className="group block">
                  <div className="aspect-video rounded-xl overflow-hidden mb-4 border border-border/50 relative">
                    <img src={relatedPost.coverImage} alt={relatedPost.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-primary/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2 mb-2">{relatedPost.title}</h3>
                  <p className="text-sm text-muted-foreground font-mono"><Calendar className="w-3 h-3 inline mr-1" /> {relatedPost.publishedAt}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
