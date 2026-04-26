import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { LogOut, LayoutDashboard, FileText, Cpu, Type, Terminal, Activity, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/projects", label: "Projects", icon: Cpu },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/skills", label: "Skills", icon: Activity },
  { href: "/admin/sections", label: "Sections", icon: Type },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[100dvh] flex bg-background font-sans text-foreground dark">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/50 bg-card/30 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <div className="flex items-center gap-2 text-primary font-mono text-sm tracking-wider uppercase">
            <Terminal className="w-4 h-4" />
            <span>Mission Control</span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {adminNav.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-mono text-sm ${isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-card/50 hover:text-foreground border border-transparent"}`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.firstName?.[0] || 'A'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.firstName || 'Admin'}</span>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start font-mono text-xs border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="h-16 border-b border-border/50 bg-card/30 flex items-center justify-between px-4 md:hidden">
          <div className="flex items-center gap-2 text-primary font-mono text-sm tracking-wider uppercase">
            <Terminal className="w-4 h-4" />
            <span>Mission Control</span>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 circuit-bg">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
