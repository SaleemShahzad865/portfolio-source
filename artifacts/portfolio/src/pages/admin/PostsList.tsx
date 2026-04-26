import { useListPosts, getListPostsQueryKey, useDeletePost } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { normalizeList } from "@/lib/normalize-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PostsList() {
  const queryClient = useQueryClient();
  const { data: posts, isLoading } = useListPosts({ includeUnpublished: true }, { query: { queryKey: getListPostsQueryKey({ includeUnpublished: true }) } });
  const [search, setSearch] = useState("");
  const deletePost = useDeletePost();
  const postList = normalizeList(posts);

  const filteredPosts = postList.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = (id: number) => {
    deletePost.mutate({ id }, {
      onSuccess: () => {
        toast.success("Post deleted");
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({ includeUnpublished: true }) });
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      },
      onError: () => toast.error("Failed to delete post")
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Posts</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Manage blog entries and articles.</p>
        </div>
        <Button asChild className="font-mono uppercase tracking-wider text-xs">
          <Link href="/admin/posts/new">
            <Plus className="w-4 h-4 mr-2" /> New Post
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card/20 p-2 rounded-lg border border-border/50">
        <Search className="w-5 h-5 text-muted-foreground ml-2" />
        <Input 
          placeholder="Filter posts by title or slug..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-mono text-sm"
        />
      </div>

      <div className="bg-card/40 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-card/50 font-mono text-xs uppercase text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Slug</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium hidden sm:table-cell">Published At</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filteredPosts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No posts found.</td></tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium">{post.title}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs hidden md:table-cell">{post.slug}</td>
                    <td className="px-6 py-4">
                      <Badge variant={post.isPublished ? "default" : "secondary"} className="font-mono text-[10px] uppercase">
                        {post.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs hidden sm:table-cell">{post.publishedAt}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                          <Link href={`/admin/posts/${post.id}`}>
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Post</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{post.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="font-mono text-xs uppercase">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(post.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs uppercase">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
