import { Link } from "wouter";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { useListPosts } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeList } from "@/lib/normalize-list";

export default function Blog() {
  const { data: posts, isLoading } = useListPosts();
  const postList = normalizeList(posts);

  const featuredPost = postList[0];
  const otherPosts = postList.slice(1);

  return (
    <div className="container mx-auto px-4 py-24 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-16 text-center"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50">Engineering Log</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Deep dives into hardware design, firmware optimization, and the realities of building embedded systems.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-16">
          <Skeleton className="w-full aspect-[2/1] rounded-3xl" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-full bg-card/30 border-border/50">
                <Skeleton className="w-full aspect-video rounded-t-xl" />
                <CardContent className="p-6">
                  <Skeleton className="w-1/2 h-4 mb-4" />
                  <Skeleton className="w-full h-6 mb-3" />
                  <Skeleton className="w-full h-16 mb-6" />
                  <Skeleton className="w-1/3 h-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : postList.length === 0 ? (
        <div className="text-center py-20 border border-border/50 rounded-2xl bg-card/10 backdrop-blur-sm">
          <p className="text-muted-foreground font-mono">No posts available.</p>
        </div>
      ) : (
        <>
          {/* Featured Post */}
          {featuredPost && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-16"
            >
              <Link href={`/blog/${featuredPost.slug}`}>
                <div className="group relative rounded-3xl overflow-hidden border border-border/50 bg-card/30 backdrop-blur-md cursor-pointer transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_40px_-10px_rgba(var(--primary),0.2)]">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden">
                      <img 
                        src={featuredPost.coverImage} 
                        alt={featuredPost.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-background/80 md:from-background to-transparent" />
                    </div>
                    <div className="p-8 md:p-12 flex flex-col justify-center relative z-10 -mt-20 md:mt-0 bg-background/90 md:bg-transparent backdrop-blur-md md:backdrop-blur-none">
                      <div className="flex gap-2 mb-6">
                        {featuredPost.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="font-mono bg-primary/5 text-primary border-primary/20">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold mb-4 group-hover:text-primary transition-colors">
                        {featuredPost.title}
                      </h2>
                      <p className="text-lg text-muted-foreground mb-8 line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground font-mono mt-auto">
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {featuredPost.publishedAt}</span>
                        <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {featuredPost.readTimeMinutes} min read</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Grid of Posts */}
          {otherPosts.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherPosts.map((post, i) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <Card className="h-full group overflow-hidden bg-card/30 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 cursor-pointer flex flex-col">
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={post.coverImage} 
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardContent className="p-6 flex-1 flex flex-col">
                        <div className="flex gap-2 mb-4 flex-wrap">
                          {post.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="font-mono text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground mb-6 line-clamp-3 text-sm flex-1">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-4 border-t border-border/50">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {post.publishedAt}</span>
                          <span className="flex items-center gap-1.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">Read <ArrowRight className="w-3 h-3" /></span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
