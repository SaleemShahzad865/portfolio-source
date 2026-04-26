import { useListProjects, useDeleteProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function ProjectsList() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading } = useListProjects();
  const deleteProject = useDeleteProject();

  const sortedProjects = normalizeList(projects).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const handleDelete = (id: number) => {
    deleteProject.mutate({ id }, {
      onSuccess: () => {
        toast.success("Project deleted");
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      },
      onError: () => toast.error("Failed to delete project")
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Projects</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Manage portfolio hardware systems.</p>
        </div>
        <Button asChild className="font-mono uppercase tracking-wider text-xs">
          <Link href="/admin/projects/new">
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Link>
        </Button>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-card/50 font-mono text-xs uppercase text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-medium w-16">Order</th>
                <th className="px-6 py-4 font-medium">Image</th>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium hidden lg:table-cell">Category</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Tags</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : sortedProjects.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No projects found.</td></tr>
              ) : (
                sortedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-muted-foreground text-center">{project.sortOrder}</td>
                    <td className="px-6 py-4">
                      <div className="w-16 h-10 rounded overflow-hidden border border-border/50">
                        <img src={project.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{project.title}</td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="inline-flex items-center rounded-md border border-border/50 bg-background/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {project.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-[10px] uppercase hidden md:table-cell max-w-[200px] truncate">
                      {project.tags.join(", ")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                          <Link href={`/admin/projects/${project.id}`}>
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
                              <AlertDialogTitle>Delete Project</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{project.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="font-mono text-xs uppercase">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(project.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs uppercase">
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
