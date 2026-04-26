import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRoute, useLocation, Link } from "wouter";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetProject, useCreateProject, useUpdateProject, getListProjectsQueryKey, getGetProjectQueryKey } from "@workspace/api-client-react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROJECT_CATEGORIES = [
  { value: "pcb", label: "PCB Projects" },
  { value: "iot", label: "IoT Projects" },
  { value: "esp32", label: "ESP32 Projects" },
  { value: "arm", label: "ARM Projects" },
  { value: "arduino", label: "Arduino Projects" },
  { value: "simulation", label: "Simulation Projects" },
] as const;

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  details: z.string().optional().default(""),
  category: z.enum(["pcb", "iot", "esp32", "arm", "arduino", "simulation"]),
  image: z.string().refine(
    (value) => value === "" || value.startsWith("/") || /^https?:\/\//.test(value),
    "Must be a valid URL or uploaded image path",
  ),
  tags: z.string(),
  link: z.string().url("Must be a valid URL").or(z.literal("")),
  sortOrder: z.coerce.number().default(0),
});

export default function ProjectEditor() {
  const [, params] = useRoute("/admin/projects/:id");
  const isNew = !params?.id || params.id === "new";
  const id = isNew ? 0 : Number(params?.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useGetProject(id, { 
    query: { enabled: !isNew && !!id, queryKey: getGetProjectQueryKey(id) } 
  });
  
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  async function handleImageUpload(file: File | null) {
    if (!file) return;

    try {
      const url = await uploadImage(file, "project_image");
      form.setValue("image", url, { shouldDirty: true, shouldValidate: true });
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      details: "",
      category: "iot",
      image: "",
      tags: "",
      link: "",
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (project && !isNew) {
      form.reset({
        title: project.title,
        description: project.description,
        details: project.details ?? "",
        category: project.category,
        image: project.image,
        tags: project.tags.join(", "),
        link: project.link,
        sortOrder: project.sortOrder,
      });
    }
  }, [project, isNew, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      ...values,
      tags: values.tags.split(",").map(t => t.trim()).filter(Boolean),
    };

    if (isNew) {
      createProject.mutate({ data: payload }, {
        onSuccess: () => {
          toast.success("Project created");
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setLocation("/admin/projects");
        },
        onError: () => toast.error("Failed to create project")
      });
    } else {
      updateProject.mutate({ id, data: payload }, {
        onSuccess: () => {
          toast.success("Project updated");
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setLocation("/admin/projects");
        },
        onError: () => toast.error("Failed to update project")
      });
    }
  };

  const detailsValue = form.watch("details");

  if (isLoading) return <div className="p-8 text-center text-muted-foreground font-mono">Loading project...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4 border-b border-border/50 pb-6">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/admin/projects"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold">{isNew ? "New Project" : "Edit Project"}</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">{isNew ? "Adding new hardware system to portfolio." : "Modifying portfolio entry."}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid gap-6 p-6 rounded-xl border border-border/50 bg-card/20 backdrop-blur-sm">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Project Title</FormLabel>
                    <FormControl><Input className="bg-background/50 font-display text-lg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Short Description</FormLabel>
                    <FormControl><Textarea className="bg-background/50 resize-none h-24" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="rounded-xl border border-border/50 bg-card/20 backdrop-blur-sm overflow-hidden flex flex-col h-[600px]">
                <div className="px-4 py-2 border-b border-border/50 bg-muted/20 flex justify-between items-center">
                  <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Project Details</div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Editor / Preview</span>
                </div>
                <div className="grid md:grid-cols-2 flex-1 min-h-0 divide-x divide-border/50">
                  <FormField control={form.control} name="details" render={({ field }) => (
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
                    <ReactMarkdown>{detailsValue || "*Preview...*"}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 p-6 rounded-xl border border-border/50 bg-card/20 backdrop-blur-sm">
                <FormField control={form.control} name="image" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Project Image</FormLabel>
                    <FormControl><Input className="bg-background/50 font-mono text-sm" placeholder="/images/..." {...field} /></FormControl>
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
                        Project images: 16:9, min 1200x675 (recommended 1600x900).
                      </div>
                    </div>
                    {field.value ? (
                      <div className="mt-2 aspect-video rounded border border-border/50 overflow-hidden">
                        <img src={field.value} className="w-full h-full object-cover" alt="Project preview" />
                      </div>
                    ) : null}
                  </FormItem>
                )} />

                <FormField control={form.control} name="link" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">External Link</FormLabel>
                    <FormControl><Input className="bg-background/50 font-mono text-sm" placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Category</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-background/50 font-mono text-sm h-10">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_CATEGORIES.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="font-mono text-sm">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="tags" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Tags (CSV)</FormLabel>
                    <FormControl><Input className="bg-background/50 font-mono text-sm" placeholder="ESP32, PCB Design, C++" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="sortOrder" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Sort Order</FormLabel>
                    <FormControl><Input type="number" className="bg-background/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Button type="submit" disabled={createProject.isPending || updateProject.isPending} className="w-full font-mono uppercase tracking-widest h-14 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="w-4 h-4 mr-2" />
                {isNew ? "Create Project" : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
