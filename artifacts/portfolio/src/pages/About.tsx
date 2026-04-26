import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Terminal } from "lucide-react";
import { useSection } from "@/hooks/useSection";
import { useSectionJson } from "@/hooks/useSectionJson";

type TimelineItem = {
  role: string;
  period: string;
  desc: string;
  active?: boolean;
};

export default function About() {
  const aboutIntro = useSection("about_intro", "I am a passionate Electrical Engineer who finds beauty in the intersection of hardware and software. There is nothing quite like the feeling of designing a circuit on a screen, holding the fabricated PCB in your hands, and writing the code that brings it to life.");
  
  const aboutPhilosophyRaw = useSection("about_philosophy", "Embedded systems engineering is more than just connecting pins and writing loops. It's about constraints — power, memory, timing, and cost. It's about understanding the physics of the signals travelling across your traces, while simultaneously managing complex state machines in C/C++.\n\nI approach every project with a system-level mindset. A brilliant piece of firmware is useless if the hardware design introduces noise, and a perfect PCB layout cannot save inefficient code. My goal is always harmony between the physical board and the digital logic.");
  
  const philosophyParagraphs = aboutPhilosophyRaw.split("\n\n").filter(p => p.trim() !== "");

  const timeline = useSectionJson<TimelineItem[]>(
    "about_timeline",
    [
      {
        role: "Senior Embedded Engineer",
        period: "2022 - Present",
        desc: "Leading firmware development and hardware design for next-generation industrial IoT devices. Architected scalable ESP32-based sensor networks.",
        active: true
      },
      {
        role: "Hardware Design Engineer",
        period: "2019 - 2022",
        desc: "Designed complex multi-layer PCBs for consumer electronics. Extensive use of Altium Designer and rigorous EMI/EMC compliance testing.",
        active: false
      },
      {
        role: "B.S. Electrical Engineering",
        period: "2015 - 2019",
        desc: "Specialized in control systems and microelectronics. Graduated with Honors. Capstone project: Autonomous Hexapod Robot.",
        active: false
      }
    ],
  );

  return (
    <div className="container mx-auto px-4 py-24 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-20"
      >
        <div className="flex items-center gap-3 text-primary font-mono mb-6 text-sm tracking-wider uppercase">
          <Terminal className="w-4 h-4" />
          <span>System.whoami()</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-bold mb-8">About Me</h1>
        <p className="text-2xl text-muted-foreground leading-relaxed max-w-3xl font-light">
          {aboutIntro}
        </p>
      </motion.div>

      <div className="space-y-24">
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-12 gap-8 md:gap-16"
        >
          <div className="md:col-span-4">
            <h2 className="text-2xl font-display font-bold sticky top-24 text-foreground/90">
              The Philosophy
            </h2>
          </div>
          <div className="md:col-span-8 prose prose-lg dark:prose-invert max-w-none text-muted-foreground font-light">
            {philosophyParagraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </motion.section>

        <Separator className="bg-border/40" />

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-12 gap-8 md:gap-16"
        >
          <div className="md:col-span-4">
            <h2 className="text-2xl font-display font-bold sticky top-24 text-foreground/90">
              Career Timeline
            </h2>
          </div>
          
          <div className="md:col-span-8 space-y-12 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px before:h-full before:w-[2px] before:bg-gradient-to-b before:from-primary/50 before:via-border before:to-transparent">
            
            {timeline.map((item, i) => (
              <div key={i} className="relative flex gap-8 group">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl border-2 bg-background shrink-0 z-10 transition-colors duration-300 ${item.active ? 'border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'border-border/50 group-hover:border-primary/50'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${item.active ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30 group-hover:bg-primary/50'}`}></div>
                </div>
                <div className="p-6 rounded-2xl border border-border/50 bg-card/20 backdrop-blur-sm shadow-sm flex-1 group-hover:border-border transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <h3 className="text-xl font-display font-bold text-foreground">{item.role}</h3>
                    <span className="text-sm font-mono text-primary bg-primary/10 px-3 py-1 rounded-full w-fit">{item.period}</span>
                  </div>
                  <p className="text-muted-foreground font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </motion.section>
      </div>
    </div>
  );
}
