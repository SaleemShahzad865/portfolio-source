import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRoute, useLocation, Link } from "wouter";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetPost, useCreatePost, useUpdatePost, getGetPostQueryKey, getListPostsQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";
import { ArrowLeft, Save, Upload } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { uploadImage } from "@/lib/upload-image";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  excerpt: z.string().optional().default(""),
  coverImage: z.string().optional().default("").refine(
    (value) => value === "" || value.startsWith("/") || /^https?:\/\//.test(value),
    "Must be a valid URL or uploaded image path",
  ),
  publishedAt: z.string().optional().default(""),
  readTimeMinutes: z.coerce.number().min(1),
  tags: z.string(),
  content: z.string().optional().default(""),
  isPublished: z.boolean().default(false),
});

export default function PostEditor() {
  const [, params] = useRoute("/admin/posts/:id");
  const isNew = !params?.id || params.id === "new";
  const id = isNew ? 0 : Number(params?.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useGetPost(id, { 
    query: { enabled: !isNew && !!id, queryKey: getGetPostQueryKey(id) } 
  });
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  async function handleImageUpload(file: File | null) {
    if (!file) return;

    try {
      const url = await uploadImage(file, "post_cover");
      form.setValue("coverImage", url, { shouldDirty: true, shouldValidate: true });
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      coverImage: "",
      publishedAt: new Date().toISOString().split('T')[0],
      readTimeMinutes: 5,
      tags: "",
      content: "",
      isPublished: false,
    },
  });

  useEffect(() => {
    if (post && !isNew) {
      form.reset({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        coverImage: post.coverImage,
        publishedAt: post.publishedAt,
        readTimeMinutes: post.readTimeMinutes,
        tags: post.tags.join(", "),
        content: post.content,
        isPublished: post.isPublished,
      });
    }
  }, [post, isNew, form]);

  const contentValue = form.watch("content");

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      ...values,
      tags: values.tags.split(",").map(t => t.trim()).filter(Boolean),
    };

    if (isNew) {
      createPost.mutate({ data: payload }, {
        onSuccess: () => {
          toast.success("Post created");
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({ includeUnpublished: true }) });
          setLocation("/admin/posts");
        },
        onError: () => toast.error("Failed to create post")
      });
    } else {
      updatePost.mutate({ id, data: payload }, {
        onSuccess: () => {
          toast.success("Post updated");
          queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({ includeUnpublished: true }) });
          // Ideally invalidate the slug query as well, but we'd need to know the slug. The list invalidation should cover most bases.
          setLocation("/admin/posts");
        },
        onError: () => toast.error("Failed to update post")
      });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground font-mono">Loading post...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4 border-b border-border/50 pb-6">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/admin/posts"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold">{isNew ? "New Post" : "Edit Post"}</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">{isNew ? "Drafting a new entry." : "Modifying existing content."}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid gap-6 p-6 rounded-xl border border-border/50 bg-card/20 backdrop-blur-sm">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Title</FormLabel>
                    <FormControl><Input className="bg-background/50 font-display text-lg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Slug</FormLabel>
                    <FormControl><Input className="bg-background/50 font-mono text-sm" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="excerpt" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Excerpt</FormLabel>
                    <FormControl><Textarea className="bg-background/50 resize-none h-24" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="rounded-xl border border-border/50 bg-card/20 backdrop-blur-sm overflow-hidden flex flex-col h-[600px]">
                <div className="px-4 py-2 border-b border-border/50 bg-muted/20 flex justify-between items-center">
                  <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Markdown Content</div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Editor / Preview</span>
                </div>
                <div className="grid md:grid-cols-2 flex-1 min-h-0 divide-x divide-border/50">
                  <FormField control={form.control} name="content" render={({ field }) => (
                    <FormItem className="flex flex-col h-full space-y-0">
                      <FormControl className="flex-1">
                        <textarea 
                          className="w-full h-full p-4 bg-background/50 font-mono text-sm resize-none focus:outline-none focus:ring-0 border-0" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="px-4 pb-2" />
                    </FormItem>
                  )} />
                  <div className="p-4 bg-card/10 overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{contentValue || "*Preview...*"}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 p-6 rounded-xl border border-border/50 bg-card/20 backdrop-blur-sm">
                <FormField control={form.control} name="isPublished" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4 bg-background/50">
                    <div className="space-y-0.5">
                      <FormLabel className="font-mono text-xs uppercase tracking-widest">Published Status</FormLabel>
                      <FormDescription className="text-xs">Make this post public.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="publishedAt" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Publish Date</FormLabel>
                    <FormControl><Input type="date" className="bg-background/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="readTimeMinutes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Read Time (mins)</FormLabel>
                    <FormControl><Input type="number" min="1" className="bg-background/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="coverImage" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Cover Image URL</FormLabel>
                    <FormControl><Input className="bg-background/50 text-sm" placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                    <div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:border-primary/40 hover:text-primary">
                        <Upload className="h-3.5 w-3.5" />
                        Upload From Device
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            void handleImageUpload(event.target.files?.[0] ?? null);
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                      <div className="mt-2 text-[10px] font-mono text-muted-foreground">
                        Cover images: 16:9, min 1200x675 (recommended 1600x900).
                      </div>
                    </div>
                    {field.value && <div className="mt-2 aspect-video rounded border border-border/50 overflow-hidden"><img src={field.value} className="w-full h-full object-cover" alt="Cover preview" /></div>}
                  </FormItem>
                )} />
                <FormField control={form.control} name="tags" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Tags (CSV)</FormLabel>
                    <FormControl><Input className="bg-background/50 font-mono text-sm" placeholder="hardware, iot, esp32" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Button type="submit" disabled={createPost.isPending || updatePost.isPending} className="w-full font-mono uppercase tracking-widest h-14 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="w-4 h-4 mr-2" />
                {isNew ? "Create Post" : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
