import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, ExternalLink } from "lucide-react";
import type { Project } from "@workspace/api-client-react";
import { useListProjects } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeList } from "@/lib/normalize-list";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  }
};

const PROJECT_FILTERS = [
  { value: "all", label: "All Projects" },
  { value: "pcb", label: "PCB Projects" },
  { value: "iot", label: "IoT Projects" },
  { value: "esp32", label: "ESP32 Projects" },
  { value: "arm", label: "ARM Projects" },
  { value: "arduino", label: "Arduino Projects" },
  { value: "simulation", label: "Simulation Projects" },
] as const;

type ProjectFilter = (typeof PROJECT_FILTERS)[number]["value"];

export default function Projects() {
  const { data: projects, isLoading } = useListProjects();
  const projectList = normalizeList<Project>(projects);
  const [filter, setFilter] = useState<ProjectFilter>("all");

  const filteredProjects = useMemo(() => {
    if (filter === "all") return projectList;
    return projectList.filter((p) => p.category === filter);
  }, [projectList, filter]);

  return (
    <div className="container mx-auto px-4 py-24 max-w-7xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-16 text-center"
      >
        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">Hardware & Systems</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
          A selection of projects showcasing expertise across schematic design, PCB layout, and firmware engineering.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-full flex flex-col overflow-hidden border-border/50 bg-card/20 backdrop-blur-sm">
              <Skeleton className="aspect-[16/10] w-full" />
              <CardHeader className="pt-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
                <Skeleton className="h-4 w-4/6" />
              </CardContent>
              <CardFooter className="pt-6 pb-6">
                <Skeleton className="h-12 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : projectList.length === 0 ? (
        <div className="text-center py-20 border border-border/50 rounded-2xl bg-card/10 backdrop-blur-sm">
          <p className="text-muted-foreground font-mono">No projects found.</p>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {PROJECT_FILTERS.map((opt) => {
              const active = filter === opt.value;
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={active ? "default" : "outline"}
                  onClick={() => setFilter(opt.value)}
                  className={[
                    "font-mono text-xs tracking-widest uppercase h-11",
                    active ? "bg-primary text-primary-foreground" : "bg-transparent border-border/50 hover:border-primary/50 hover:bg-primary/5",
                  ].join(" ")}
                >
                  {opt.label}
                </Button>
              );
            })}
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-20 border border-border/50 rounded-2xl bg-card/10 backdrop-blur-sm">
              <p className="text-muted-foreground font-mono">No projects in this category.</p>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredProjects.sort((a, b) => a.sortOrder - b.sortOrder).map((project) => (
                <motion.div key={project.id} variants={itemVariants} className="h-full">
                  <Card className="h-full flex flex-col overflow-hidden border-border/50 bg-card/20 backdrop-blur-sm transition-all duration-500 hover:border-primary/50 hover:shadow-[0_10px_40px_-15px_rgba(var(--primary),0.3)] hover:-translate-y-2 group">
                    <div className="aspect-[16/10] overflow-hidden relative border-b border-border/50">
                      <img 
                        src={project.image} 
                        alt={project.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-primary/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
                    </div>
                    <CardHeader className="pt-6 relative z-10">
                      <CardTitle className="text-2xl font-display font-bold group-hover:text-primary transition-colors">{project.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {project.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="font-mono text-[10px] uppercase tracking-wider bg-background/50 border-border/50">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <CardDescription className="text-base text-foreground/70 leading-relaxed font-light">
                        {project.description}
                      </CardDescription>
                    </CardContent>
                    <CardFooter className="pt-6 pb-6">
                      <div className="grid w-full gap-3">
                        <Button asChild variant="outline" className="w-full font-mono text-xs tracking-widest uppercase bg-transparent border-border/50 hover:border-primary/50 hover:bg-primary/5 h-12">
                          <Link href={`/projects/${project.id}`}>View Details</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full font-mono text-xs tracking-widest uppercase bg-transparent border-primary/20 hover:border-primary/50 hover:bg-primary/5 group/btn h-12">
                          <a href={project.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3">
                            <Github className="w-4 h-4" /> 
                            <span>Source Files</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all" />
                          </a>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
