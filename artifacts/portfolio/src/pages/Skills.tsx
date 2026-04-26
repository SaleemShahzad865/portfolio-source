import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  CircuitBoard,
  Cpu,
  Radio,
  Wifi,
  Bluetooth,
  Code2,
  Wrench,
  Activity,
  Database,
  Server,
  TerminalSquare,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetSkills, type SkillCategory } from "@workspace/api-client-react";
import { normalizeList } from "@/lib/normalize-list";

const ICONS: Record<string, LucideIcon> = {
  CircuitBoard,
  Cpu,
  Radio,
  Wifi,
  Bluetooth,
  Code2,
  Wrench,
  Activity,
  Database,
  Server,
  TerminalSquare,
  Layers,
  ShieldCheck,
  Zap,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function Skills() {
  const { data, isLoading } = useGetSkills();
  const categories = normalizeList<SkillCategory>(data?.categories);

  return (
    <div className="container mx-auto px-4 py-24 max-w-6xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-16 text-center md:text-left"
      >
        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">Technical Arsenal</h1>
        <p className="text-xl text-muted-foreground max-w-2xl font-light">
          The tools, languages, and protocols I use to architect robust hardware and firmware systems.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="p-10 text-center text-muted-foreground font-mono">Loading skills…</div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-8">
        {categories.map((category, idx) => {
          const Icon = ICONS[category.icon] ?? Cpu;
          return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.15, duration: 0.6 }}
          >
            <Card className="h-full bg-card/20 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="flex flex-row items-center gap-6 pb-6 border-b border-border/30">
                <div className="w-14 h-14 rounded-xl bg-background border border-border flex items-center justify-center text-primary shadow-sm">
                  <Icon className="w-7 h-7" />
                </div>
                <CardTitle className="text-2xl font-display">{category.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                {category.skills.map((skill) => {
                  const level = clamp(skill.level, 0, 100);
                  return (
                    <div key={skill.id} className="space-y-3 group">
                      <div className="flex justify-between text-sm font-medium gap-3">
                        <span className="font-mono tracking-tight text-foreground/90 group-hover:text-primary transition-colors min-w-0 truncate">
                          {skill.name}
                        </span>
                        <span className="text-muted-foreground font-mono bg-background px-2 py-0.5 rounded border border-border/50 shrink-0">
                          {level}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/50 relative">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${level}%` }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 1,
                            delay: 0.2 + idx * 0.1,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/80 to-primary rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        );
        })}
      </div>
    </div>
  );
}
