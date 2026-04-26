import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import { AnimatePresence } from "framer-motion";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import Skills from "@/pages/Skills";
import Contact from "@/pages/Contact";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";

// Admin
import { RequireAuth } from "@/components/admin/RequireAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Login from "@/pages/admin/Login";
import Dashboard from "@/pages/admin/Dashboard";
import PostsList from "@/pages/admin/PostsList";
import PostEditor from "@/pages/admin/PostEditor";
import ProjectsList from "@/pages/admin/ProjectsList";
import ProjectEditor from "@/pages/admin/ProjectEditor";
import SectionsEditor from "@/pages/admin/SectionsEditor";
import SkillsEditor from "@/pages/admin/SkillsEditor";
import ContactMessages from "@/pages/admin/ContactMessages";

const queryClient = new QueryClient();

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AdminLayout>{children}</AdminLayout>
    </RequireAuth>
  );
}

function Router() {
  return (
    <Switch>
      {/* Admin Routes (absolute paths — no `nest`, so Links and setLocation stay absolute) */}
      <Route path="/admin/login" component={Login} />
      <Route path="/admin"><AdminShell><Dashboard /></AdminShell></Route>
      <Route path="/admin/posts"><AdminShell><PostsList /></AdminShell></Route>
      <Route path="/admin/posts/new"><AdminShell><PostEditor /></AdminShell></Route>
      <Route path="/admin/posts/:id"><AdminShell><PostEditor /></AdminShell></Route>
      <Route path="/admin/projects"><AdminShell><ProjectsList /></AdminShell></Route>
      <Route path="/admin/projects/new"><AdminShell><ProjectEditor /></AdminShell></Route>
      <Route path="/admin/projects/:id"><AdminShell><ProjectEditor /></AdminShell></Route>
      <Route path="/admin/messages"><AdminShell><ContactMessages /></AdminShell></Route>
      <Route path="/admin/skills"><AdminShell><SkillsEditor /></AdminShell></Route>
      <Route path="/admin/sections"><AdminShell><SectionsEditor /></AdminShell></Route>

      {/* Public Routes */}
      <Route>
        <Layout>
          <AnimatePresence mode="wait">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/about" component={About} />
              <Route path="/projects/:id" component={ProjectDetails} />
              <Route path="/projects" component={Projects} />
              <Route path="/skills" component={Skills} />
              <Route path="/blog" component={Blog} />
              <Route path="/blog/:slug" component={BlogPost} />
              <Route path="/contact" component={Contact} />
              <Route component={NotFound} />
            </Switch>
          </AnimatePresence>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
