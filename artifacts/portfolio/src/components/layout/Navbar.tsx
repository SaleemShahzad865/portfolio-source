import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Download, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { useSection } from "@/hooks/useSection";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/skills", label: "Skills" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const resumeUrl = useSection("resume_url", "");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-border/50 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between">
        <Link href="/" className="group relative font-mono font-bold text-xl text-primary tracking-tight z-50">
          S.SHAHZAD
          <motion.span 
            className="text-secondary inline-block"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >_</motion.span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-3">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 border border-primary/30 bg-primary/5 rounded-md -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {resumeUrl ? (
            <Button
              asChild
              className="font-mono text-xs uppercase tracking-widest h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[3px_3px_0px_0px_rgba(var(--primary),0.25)] hover:shadow-[1px_1px_0px_0px_rgba(var(--primary),0.25)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <a href={resumeUrl} target="_blank" rel="noreferrer" download>
                <Download className="w-4 h-4 mr-2" />
                Download Resume
              </a>
            </Button>
          ) : null}
        </div>

        {/* Mobile Nav */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden z-50 relative">
            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
              <Menu className="h-6 w-6 text-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[350px] bg-background/95 backdrop-blur-xl border-l-primary/20">
            <nav className="flex flex-col gap-6 mt-16 px-4">
              {navItems.map((item, i) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`block text-2xl font-display font-medium transition-all hover:translate-x-2 ${
                        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                )
              })}

              {resumeUrl ? (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: navItems.length * 0.1 }}>
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-3 text-lg font-mono text-primary-foreground border border-primary/20 bg-primary px-4 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-[3px_3px_0px_0px_rgba(var(--primary),0.25)]"
                  >
                    <Download className="w-5 h-5" />
                    Download Resume
                  </a>
                </motion.div>
              ) : null}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
