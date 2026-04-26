import { useListPosts, useListProjects, useListSections, getListPostsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Cpu, Type, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { normalizeList } from "@/lib/normalize-list";

export default function Dashboard() {
  const { data: posts } = useListPosts({ includeUnpublished: true }, { query: { queryKey: getListPostsQueryKey({ includeUnpublished: true }) } });
  const { data: projects } = useListProjects();
  const { data: sections } = useListSections();
  const postList = normalizeList(posts);
  const projectList = normalizeList(projects);
  const sectionList = normalizeList(sections);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Total Posts</CardTitle>
            <FileText className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-display">{postList.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Total Projects</CardTitle>
            <Cpu className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-display">{projectList.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Sections Edited</CardTitle>
            <Type className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-display">{sectionList.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h2 className="text-lg font-display font-bold flex items-center gap-2">
              <span className="text-primary font-mono text-sm uppercase">{'>'} system.posts_recent</span>
            </h2>
            <Link href="/admin/posts" className="text-xs font-mono text-muted-foreground hover:text-primary flex items-center">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {postList.slice(0, 5).map(post => (
              <div key={post.id} className="flex justify-between items-center p-3 rounded-lg bg-card/20 border border-border/30">
                <div className="truncate pr-4 font-medium">{post.title}</div>
                <div className="shrink-0 text-xs font-mono text-muted-foreground">{post.isPublished ? 'Published' : 'Draft'}</div>
              </div>
            ))}
            {!postList.length && <div className="text-sm text-muted-foreground italic p-4">No posts found.</div>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h2 className="text-lg font-display font-bold flex items-center gap-2">
              <span className="text-primary font-mono text-sm uppercase">{'>'} system.projects_recent</span>
            </h2>
            <Link href="/admin/projects" className="text-xs font-mono text-muted-foreground hover:text-primary flex items-center">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {projectList.sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 5).map(project => (
              <div key={project.id} className="flex justify-between items-center p-3 rounded-lg bg-card/20 border border-border/30">
                <div className="truncate pr-4 font-medium">{project.title}</div>
              </div>
            ))}
            {!projectList.length && <div className="text-sm text-muted-foreground italic p-4">No projects found.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
