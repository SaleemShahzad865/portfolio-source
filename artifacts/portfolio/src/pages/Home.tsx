import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CircuitBoard,
  Cpu,
  ExternalLink,
  Github,
  Layers,
  Terminal,
  Wifi,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSection } from "@/hooks/useSection";
import { useSectionJson } from "@/hooks/useSectionJson";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeList } from "@/lib/normalize-list";
import { useGetSkills, useListPosts, useListProjects } from "@workspace/api-client-react";
import type { Post, Project } from "@workspace/api-client-react";

const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="inline-block">
      {displayedText}
      <motion.span 
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block w-3 h-[0.8em] bg-primary ml-1 align-baseline"
      />
    </span>
  );
};

type SkillCategory = { id: number; title: string; icon: string; skills: { id: number; name: string; level: number }[] };
type SkillCategoryImageConfig = { categoryId: number; image: string };
type Testimonial = {
  image?: string;
  name: string;
  designation: string;
  company: string;
  message: string;
};

type ClientLogo = {
  name: string;
  logo: string;
  url?: string;
};

function skillCategoryImage(
  category: { id: number; title: string; icon: string },
  overridesById: ReadonlyMap<number, string>,
): string {
  const override = overridesById.get(category.id);
  if (override) return override;

  const title = category.title.toLowerCase();
  const icon = category.icon;

  if (icon === "CircuitBoard" || title.includes("pcb") || title.includes("hardware")) {
    return "/images/blog-pcb-design.png";
  }

  if (
    icon === "Wifi" ||
    icon === "Radio" ||
    icon === "Bluetooth" ||
    title.includes("iot") ||
    title.includes("connect")
  ) {
    return "/images/blog-energy-monitor.png";
  }

  if (icon === "Cpu" || title.includes("embedded") || title.includes("firmware")) {
    return "/images/blog-low-power.png";
  }

  return "/images/blog-schematic-pcb.png";
}

export default function Home() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);

  const homeName = useSection("home_name", "Saleem\nShahzad");
  const homeRole = useSection("home_role", "Electrical Engineer — Embedded Systems");
  const homeTagline = useSection("home_tagline", "I specialize in turning complex ideas into robust, production-ready hardware. From intricate PCB designs to scalable IoT solutions with advanced microcontrollers.");
  const heroImage = useSection("home_hero_image", "/images/headshot.png");
  const ticker = useSectionJson<string[]>(
    "home_ticker",
    ['Altium Designer', 'KiCad', 'STM32', 'ESP32', 'FreeRTOS', 'C/C++', 'Zephyr', 'LoRaWAN', 'BLE', 'I2C/SPI'],
  );
  const clientsTicker = useSectionJson<ClientLogo[]>(
    "home_clients_ticker",
    [],
  );
  const testimonials = useSectionJson<Testimonial[]>("home_testimonials", []);

  const clientsCleaned = useMemo(() => {
    return clientsTicker
      .filter((c) => c && typeof c.logo === "string" && c.logo.trim() !== "")
      .map((client) => ({
        logo: client.logo.trim(),
        name: client.name || "Client",
        url: typeof client.url === "string" ? client.url.trim() : "",
      }));
  }, [clientsTicker]);

  const { data: projects, isLoading: isLoadingProjects } = useListProjects();
  const projectList = normalizeList<Project>(projects).sort((a, b) => a.sortOrder - b.sortOrder);
  const featuredProjectIds = useSectionJson<number[]>("home_featured_projects", []);

  const featuredProjects = useMemo(() => {
    if (featuredProjectIds.length > 0) {
      const byId = new Map(projectList.map((p) => [p.id, p] as const));
      return featuredProjectIds
        .map((id) => byId.get(id))
        .filter((project): project is Project => project != null)
        .slice(0, 3);
    }
    return projectList.slice(0, 3);
  }, [featuredProjectIds, projectList]);

  const { data: posts, isLoading: isLoadingPosts } = useListPosts();
  const postList = normalizeList<Post>(posts);
  const featuredPostSlugs = useSectionJson<string[]>("home_featured_posts", []);

  const featuredPosts = useMemo(() => {
    if (featuredPostSlugs.length > 0) {
      const bySlug = new Map(postList.map((p) => [p.slug, p] as const));
      return featuredPostSlugs
        .map((slug) => bySlug.get(slug))
        .filter((post): post is Post => post != null)
        .slice(0, 3);
    }
    return postList.slice(0, 3);
  }, [featuredPostSlugs, postList]);

  const { data: skills, isLoading: isLoadingSkills } = useGetSkills();
  const skillCategories = normalizeList<SkillCategory>(skills?.categories);
  const featuredSkillCategoryIds = useSectionJson<number[]>("home_featured_skill_categories", []);
  const skillCategoryImages = useSectionJson<SkillCategoryImageConfig[]>("home_skill_category_images", []);

  const skillImageOverrides = useMemo(() => {
    const pairs = skillCategoryImages
      .filter((v) => v && typeof v.categoryId === "number" && typeof v.image === "string" && v.image.trim() !== "")
      .map((v) => [v.categoryId, v.image.trim()] as const);
    return new Map<number, string>(pairs);
  }, [skillCategoryImages]);

  const featuredSkillCategories = useMemo(() => {
    if (featuredSkillCategoryIds.length > 0) {
      const byId = new Map(skillCategories.map((c) => [c.id, c] as const));
      return featuredSkillCategoryIds
        .map((id) => byId.get(id))
        .filter((cat): cat is SkillCategory => cat != null)
        .slice(0, 3);
    }
    return skillCategories.slice(0, 3);
  }, [featuredSkillCategoryIds, skillCategories]);

  return (
    <div className="flex flex-col items-center justify-center overflow-hidden">
      <section className="w-full min-h-[100dvh] flex items-center py-20 relative">
        {/* Floating background elements */}
        <motion.div style={{ y: y1 }} className="absolute top-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <motion.div style={{ y: y2 }} className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-8"
          >
            <div>
              <div className="flex items-center gap-2 text-primary font-mono mb-4 text-sm tracking-wider uppercase">
                <Terminal className="w-4 h-4" />
                <TypewriterText text="System initialized" />
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-4 font-display leading-[1.1] whitespace-pre-line">
                {homeName}
              </h1>
              <h2 className="text-2xl md:text-3xl text-muted-foreground font-light">
                <span className="text-foreground font-medium">{homeRole}</span>
              </h2>
            </div>
            
            <p className="text-lg text-muted-foreground/80 max-w-lg leading-relaxed font-light">
              {homeTagline}
            </p>

            <div className="flex flex-wrap gap-4 mt-2">
              <Button asChild size="lg" className="h-14 px-8 font-mono bg-primary hover:bg-primary/90 text-primary-foreground rounded-none rounded-tr-xl rounded-bl-xl shadow-[4px_4px_0px_0px_rgba(var(--primary),0.3)] hover:shadow-[2px_2px_0px_0px_rgba(var(--primary),0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                <Link href="/projects">
                  View Projects <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 font-mono border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-none rounded-tr-xl rounded-bl-xl">
                <Link href="/contact">Contact Me</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, type: "spring" }}
            className="relative h-full flex items-center justify-center md:justify-end"
          >
            <div className="relative w-[80%] max-w-md aspect-[4/5] z-10 group">
              {/* Glass container */}
              <div className="absolute inset-0 bg-gradient-to-tr from-card/40 to-card/10 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                <img 
                  src={heroImage} 
                  alt="Saleem Shahzad" 
                  className="w-full h-full object-cover filter contrast-125 saturate-100 mix-blend-luminosity opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                />
                {/* Circuit overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEyIDJMMiAxMnYxMGgyMHYtMTBMMTIgMnptMCAyLjhsNyA3djcuMkg1di03LjJsNy03em0tMSAxLjJ2NWgydi01aC0yeiIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIvPjwvc3ZnPg==')] opacity-30 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
              </div>
              
              {/* Tech accents */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-12 -right-12 w-32 h-32 border border-dashed border-primary/30 rounded-full"
              />
              <div className="absolute -bottom-6 -left-6 px-6 py-4 bg-background/90 backdrop-blur border border-primary/20 rounded-xl shadow-xl font-mono text-sm flex flex-col gap-2">
                <div className="flex justify-between items-center gap-8">
                  <span className="text-muted-foreground">STATUS</span>
                  <span className="text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"/> ACTIVE
                  </span>
                </div>
                <div className="w-full h-px bg-border/50"/>
                <div className="flex justify-between items-center gap-8">
                  <span className="text-muted-foreground">V_CORE</span>
                  <span className="text-foreground">3.3V</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee Section */}
      <div className="w-full border-y border-border/40 bg-background/50 backdrop-blur py-4 flex overflow-hidden">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          className="flex whitespace-nowrap"
        >
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-12 px-6">
              {ticker.map(tech => (
                <span key={tech} className="font-mono text-sm tracking-widest text-muted-foreground/60 uppercase flex items-center gap-4">
                  {tech} <span className="w-1.5 h-1.5 bg-primary/30 rounded-full"/>
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>

      <section className="w-full py-32 relative">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Core Architecture</h2>
              <p className="text-muted-foreground max-w-xl text-lg font-light">
                Bridging the gap between software abstractions and physical reality through precision engineering.
              </p>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Cpu,
                title: "Embedded Systems",
                desc: "Firmware development for microcontrollers. RTOS architecture, bare-metal optimization, and hardware abstraction layers."
              },
              {
                icon: CircuitBoard,
                title: "PCB Design",
                desc: "Multi-layer schematic capture and PCB layout. High-speed routing, signal integrity analysis, and DFM optimization."
              },
              {
                icon: Wifi,
                title: "IoT & Connectivity",
                desc: "ESP32, BLE, Wi-Fi, and LoRa networks. Building connected devices that communicate reliably in harsh environments."
              }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="group relative p-8 rounded-2xl border border-border/50 bg-card/20 backdrop-blur-sm hover:bg-card/40 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                
                <div className="h-14 w-14 rounded-xl bg-background border border-border flex items-center justify-center mb-6 group-hover:border-primary/50 group-hover:text-primary transition-colors relative z-10 shadow-lg">
                  <item.icon className="h-7 w-7 transition-transform duration-500 group-hover:scale-110" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-4 relative z-10">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed relative z-10 font-light">{item.desc}</p>
                
                {/* Decorative circuit line */}
                <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M100 100 L50 100 L50 50 L0 50" strokeDasharray="4 4"/>
                    <circle cx="50" cy="50" r="3" fill="currentColor"/>
                  </svg>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="w-full py-28 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12"
          >
            <div>
              <div className="flex items-center gap-2 text-primary font-mono mb-3 text-sm tracking-wider uppercase">
                <Layers className="w-4 h-4" />
                <span>featured.projects</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Key Builds</h2>
              <p className="text-muted-foreground max-w-xl text-lg font-light">
                A quick tour of recent work across PCB design, firmware, and systems integration.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="h-12 px-6 font-mono border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-none rounded-tr-xl rounded-bl-xl w-fit"
            >
              <Link href="/projects">View all projects</Link>
            </Button>
          </motion.div>

          {isLoadingProjects ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-border/50 bg-card/20 backdrop-blur-sm">
                  <Skeleton className="aspect-[16/10] w-full" />
                  <CardHeader className="pt-6">
                    <Skeleton className="h-7 w-3/4 mb-3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                  <CardFooter className="pb-6">
                    <Skeleton className="h-12 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : featuredProjects.length === 0 ? (
            <div className="text-center py-16 border border-border/50 rounded-2xl bg-card/10 backdrop-blur-sm">
              <p className="text-muted-foreground font-mono">No projects yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="h-full"
                >
                  <Card className="h-full flex flex-col overflow-hidden border-border/50 bg-card/20 backdrop-blur-sm transition-all duration-500 hover:border-primary/50 hover:shadow-[0_10px_40px_-15px_rgba(var(--primary),0.25)] hover:-translate-y-1 group">
                    <div className="aspect-[16/10] overflow-hidden relative border-b border-border/50">
                      <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-primary/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                    </div>
                    <CardHeader className="pt-6">
                      <CardTitle className="text-2xl font-display font-bold group-hover:text-primary transition-colors line-clamp-2">
                        {project.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {project.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="font-mono text-[10px] uppercase tracking-wider bg-background/50 border-border/50">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <CardDescription className="text-base text-foreground/70 leading-relaxed font-light line-clamp-3">
                        {project.description}
                      </CardDescription>
                    </CardContent>
                    <CardFooter className="pt-6 pb-6">
                      <div className="grid w-full gap-3">
                        <Button variant="outline" asChild className="w-full font-mono text-xs tracking-widest uppercase bg-transparent border-border/50 hover:border-primary/50 hover:bg-primary/5 h-12">
                          <Link href={`/projects/${project.id}`}>View Details</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full font-mono text-xs tracking-widest uppercase bg-transparent border-primary/20 hover:border-primary/50 hover:bg-primary/5 group/btn h-12">
                          <a href={project.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3">
                            <Github className="w-4 h-4" />
                            <span>Source</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all" />
                          </a>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Skills */}
      <section className="w-full py-28 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12"
          >
            <div>
              <div className="flex items-center gap-2 text-primary font-mono mb-3 text-sm tracking-wider uppercase">
                <Cpu className="w-4 h-4" />
                <span>featured.skills</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Skills Snapshot</h2>
              <p className="text-muted-foreground max-w-xl text-lg font-light">
                A focused overview of the tools and domains I work with most.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="h-12 px-6 font-mono border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-none rounded-tr-xl rounded-bl-xl w-fit"
            >
              <Link href="/skills">View all skills</Link>
            </Button>
          </motion.div>

          {isLoadingSkills ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-border/50 bg-card/20 backdrop-blur-sm">
                  <Skeleton className="aspect-[16/10] w-full" />
                  <CardHeader className="pt-6">
                    <Skeleton className="h-7 w-2/3 mb-3" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-14" />
                    </div>
                  </CardContent>
                  <CardFooter className="pb-6">
                    <Skeleton className="h-12 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : featuredSkillCategories.length === 0 ? (
            <div className="text-center py-16 border border-border/50 rounded-2xl bg-card/10 backdrop-blur-sm">
              <p className="text-muted-foreground font-mono">No skills configured yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredSkillCategories.map((cat, i) => {
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="h-full"
                  >
                    <Card className="h-full flex flex-col overflow-hidden border-border/50 bg-card/20 backdrop-blur-sm transition-all duration-500 hover:border-primary/50 hover:shadow-[0_10px_40px_-15px_rgba(var(--primary),0.25)] hover:-translate-y-1 group">
                      <div className="aspect-[16/10] overflow-hidden relative border-b border-border/50">
                        <img
                          src={skillCategoryImage(cat, skillImageOverrides)}
                          alt={cat.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-primary/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                      </div>
                      <CardHeader className="pt-6">
                        <CardTitle className="text-2xl font-display font-bold group-hover:text-primary transition-colors line-clamp-2">
                          {cat.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="flex flex-wrap gap-2">
                          {cat.skills.slice(0, 10).map((s) => (
                            <Badge key={s.id} variant="outline" className="font-mono text-[10px] uppercase tracking-wider bg-background/50 border-border/50">
                              {s.name}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-6 pb-6">
                        <Button asChild variant="outline" className="w-full font-mono text-xs tracking-widest uppercase bg-transparent border-border/50 hover:border-primary/50 hover:bg-primary/5 h-12">
                          <Link href="/skills">Explore Skills</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Featured Blog */}
      <section className="w-full py-28 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12"
          >
            <div>
              <div className="flex items-center gap-2 text-primary font-mono mb-3 text-sm tracking-wider uppercase">
                <Calendar className="w-4 h-4" />
                <span>featured.blog</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Latest Writing</h2>
              <p className="text-muted-foreground max-w-xl text-lg font-light">
                Notes from the bench: design choices, debugging stories, and build breakdowns.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="h-12 px-6 font-mono border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-none rounded-tr-xl rounded-bl-xl w-fit"
            >
              <Link href="/blog">View all posts</Link>
            </Button>
          </motion.div>

          {isLoadingPosts ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-border/50 bg-card/20 backdrop-blur-sm">
                  <Skeleton className="aspect-video w-full" />
                  <CardHeader className="pt-6">
                    <Skeleton className="h-7 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-2/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                  <CardFooter className="pb-6">
                    <Skeleton className="h-12 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : featuredPosts.length === 0 ? (
            <div className="text-center py-16 border border-border/50 rounded-2xl bg-card/10 backdrop-blur-sm">
              <p className="text-muted-foreground font-mono">No posts yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredPosts.map((post, i) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="h-full"
                >
                  <Card className="h-full flex flex-col overflow-hidden border-border/50 bg-card/20 backdrop-blur-sm transition-all duration-500 hover:border-primary/50 hover:shadow-[0_10px_40px_-15px_rgba(var(--primary),0.25)] hover:-translate-y-1 group">
                    <div className="aspect-video overflow-hidden relative border-b border-border/50">
                      <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-primary/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                    </div>
                    <CardHeader className="pt-6">
                      <CardTitle className="text-2xl font-display font-bold group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                      <div className="text-xs text-muted-foreground font-mono mt-3 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{post.publishedAt}</span>
                        <span className="text-muted-foreground/40">/</span>
                        <span>{post.readTimeMinutes} min read</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {post.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline" className="font-mono text-[10px] uppercase tracking-wider bg-background/50 border-border/50">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <CardDescription className="text-base text-foreground/70 leading-relaxed font-light line-clamp-3">
                        {post.excerpt}
                      </CardDescription>
                    </CardContent>
                    <CardFooter className="pt-6 pb-6">
                      <Button asChild variant="outline" className="w-full font-mono text-xs tracking-widest uppercase bg-transparent border-border/50 hover:border-primary/50 hover:bg-primary/5 h-12">
                        <Link href={`/blog/${post.slug}`}>Read Post</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Clients Logo Ticker */}
      {clientsCleaned.length > 0 ? (
        <div className="w-full bg-background/40 backdrop-blur py-12 border-y border-border/40">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center gap-3 text-primary font-mono mb-6 text-sm tracking-wider uppercase">
              <Terminal className="w-4 h-4" />
              <span>clients</span>
            </div>
          </div>
          <div className="w-full overflow-hidden bg-background/30 py-4">
            <motion.div
              initial={{ x: "100vw" }}
              animate={{ x: ["100vw", "-100%"] }}
              transition={{ duration: 18, ease: "linear", repeat: Infinity }}
              className="inline-flex w-max whitespace-nowrap"
            >
              <div className="flex items-center gap-10 px-6">
                {clientsCleaned.map((client) => {
                  const img = (
                    <img
                      src={client.logo}
                      alt={client.name}
                      className="h-10 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                      loading="lazy"
                    />
                  );

                  return (
                    <div key={client.logo} className="h-10 flex items-center justify-center px-6">
                      {client.url ? (
                        <a href={client.url} target="_blank" rel="noreferrer" aria-label={client.name}>
                          {img}
                        </a>
                      ) : (
                        img
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}

      {/* Testimonials */}
      {testimonials.length > 0 ? (
        <section className="w-full py-28 relative">
          <div className="container mx-auto px-4 max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12"
            >
              <div>
                <div className="flex items-center gap-2 text-primary font-mono mb-3 text-sm tracking-wider uppercase">
                  <Terminal className="w-4 h-4" />
                  <span>testimonials</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Client Feedback</h2>
                <p className="text-muted-foreground max-w-2xl text-lg font-light">
                  Proof that the boards, firmware, and timelines held up under real constraints.
                </p>
              </div>
            </motion.div>

            <div className="w-full overflow-hidden bg-background/30 py-6 border border-border/40 rounded-2xl group">
              <div className="inline-flex w-max whitespace-nowrap animate-[home-ticker-from-right_32s_linear_infinite] group-hover:[animation-play-state:paused]">
                <div className="flex items-stretch gap-6 px-6">
                  {testimonials.slice(0, 8).map((t, i) => (
                    <Card
                      key={`${t.name}-${t.company}-${i}`}
                      className="w-[360px] sm:w-[420px] shrink-0 bg-card/20 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <CardHeader className="pb-4 border-b border-border/30">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full overflow-hidden border border-border/50 bg-background/40 shrink-0">
                            {t.image ? (
                              <img
                                src={t.image}
                                alt={t.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-primary font-mono">
                                {t.name?.[0] ?? "C"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-display font-semibold text-lg leading-tight truncate">
                              {t.name}
                            </div>
                            <div className="text-muted-foreground font-mono text-xs truncate">
                              {t.designation} — {t.company}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-5">
                        <p className="text-foreground/80 leading-relaxed font-light line-clamp-5 whitespace-normal">
                          {t.message}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
