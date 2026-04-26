import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { useGetProject, getGetProjectQueryKey, useListProjects } from "@workspace/api-client-react";
import type { Project } from "@workspace/api-client-react";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeList } from "@/lib/normalize-list";

export default function ProjectDetails() {
  const [, params] = useRoute("/projects/:id");
  const id = Number(params?.id);
  const isValidId = Number.isFinite(id) && id > 0;

  const { data: project, isLoading, isError } = useGetProject(isValidId ? id : 0, {
    query: {
      enabled: isValidId,
      queryKey: getGetProjectQueryKey(isValidId ? id : 0),
      retry: false,
    },
  });

  const { data: allProjects } = useListProjects();
  const projectList = normalizeList<Project>(allProjects);

  if (isLoading) {
    return (
      <div className="py-24 container mx-auto px-4 max-w-4xl space-y-8">
        <Skeleton className="h-6 w-32 mb-8" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-16 w-3/4" />
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

  if (!isValidId || isError || !project) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Project Not Found</h1>
        <Button asChild variant="outline">
          <Link href="/projects">
            <ArrowLeft className="mr-2 w-4 h-4" /> Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  const relatedProjects = projectList
    .filter((p) => p.id !== project.id)
    .filter((p) => p.category === project.category)
    .slice(0, 3);

  return (
    <div className="py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link
            href="/projects"
            className="inline-flex items-center text-sm font-mono text-muted-foreground hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="mr-2 w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Projects
          </Link>

          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="font-mono bg-primary/5 text-primary border-primary/20">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">{project.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-mono mb-10 py-6 border-y border-border/50">
            <span className="uppercase tracking-widest">Category: {project.category}</span>
            <Button
              asChild
              variant="outline"
              className="ml-auto font-mono text-xs tracking-widest uppercase bg-transparent border-primary/20 hover:border-primary/50 hover:bg-primary/5 group/btn h-11"
            >
              <a href={project.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3">
                <Github className="w-4 h-4" />
                <span>Source Files</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all" />
              </a>
            </Button>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="w-full max-w-6xl mx-auto px-4 mb-16"
      >
        <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-border/50 relative">
          <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
        </div>
      </motion.div>

      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
        >
          <ReactMarkdown>{(project as Project & { details?: string }).details || project.description}</ReactMarkdown>
        </motion.div>
      </div>

      {relatedProjects.length > 0 && (
        <div className="container mx-auto px-4 max-w-6xl mt-28 pt-16 border-t border-border/50">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-display font-bold">More Projects</h2>
            <Link href="/projects" className="hidden md:flex items-center text-sm font-mono text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {relatedProjects.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/projects/${p.id}`} className="group block">
                  <div className="aspect-video rounded-xl overflow-hidden mb-4 border border-border/50 relative">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-primary/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2 mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground font-mono line-clamp-2">{p.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

