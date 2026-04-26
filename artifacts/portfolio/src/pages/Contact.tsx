import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, Terminal } from "lucide-react";
import { toast } from "sonner";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";
import { useSection } from "@/hooks/useSection";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
  company: z.string().optional(), // honeypot
});

export default function Contact() {
  const contactEmail = useSection("contact_email", "saleemwork123@gmail.com");
  const contactLocation = useSection("contact_location", "San Francisco, CA");
  const contactGithub = useSection("contact_github", "https://github.com/saleemshahzad");
  const contactLinkedin = useSection("contact_linkedin", "https://linkedin.com/in/saleemshahzad");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      company: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? `HTTP ${response.status}`);
      }

      toast.success("Message Transmitted", {
        description: "Thank you for reaching out. I'll get back to you shortly.",
      });
      form.reset();
    } catch (err) {
      toast.error("Transmission Failed", {
        description: err instanceof Error ? err.message : "Unable to send message",
      });
    }
  }

  return (
    <div className="container mx-auto px-4 py-24 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-16"
      >
        <div className="flex items-center gap-3 text-primary font-mono mb-6 text-sm tracking-wider uppercase">
          <Terminal className="w-4 h-4" />
          <span>System.connect()</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">Initialize Connection</h1>
        <p className="text-xl text-muted-foreground max-w-2xl font-light">
          Interested in collaborating on a project or discussing hardware design? Open a channel.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-4 space-y-12"
        >
          <div className="space-y-8">
            <div className="group relative flex items-start gap-5">
              <div className="p-4 bg-card/20 backdrop-blur-sm border border-border/50 rounded-xl text-foreground group-hover:border-primary/50 group-hover:text-primary transition-colors shrink-0 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Mail className="w-6 h-6 relative z-10" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg mb-1">Email Channel</h3>
                <a href={`mailto:${contactEmail}`} className="text-muted-foreground hover:text-primary transition-colors font-mono text-sm break-all">
                  {contactEmail}
                </a>
              </div>
            </div>

            <div className="group relative flex items-start gap-5">
              <div className="p-4 bg-card/20 backdrop-blur-sm border border-border/50 rounded-xl text-foreground group-hover:border-primary/50 group-hover:text-primary transition-colors shrink-0 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <MapPin className="w-6 h-6 relative z-10" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg mb-1">Location Data</h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  {contactLocation}<br />
                  <span className="text-primary/80">Available for remote work globally.</span>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-border/50">
            <h3 className="font-display font-semibold text-lg mb-6">Digital Presence</h3>
            <div className="flex gap-4">
              <a href={contactLinkedin} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center bg-card/20 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all rounded-xl hover:-translate-y-1">
                <FaLinkedin className="w-5 h-5" />
              </a>
              <a href={contactGithub} target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center bg-card/20 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all rounded-xl hover:-translate-y-1">
                <FaGithub className="w-5 h-5" />
              </a>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:col-span-8"
        >
          <Card className="bg-card/20 backdrop-blur-sm border-border/50 shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <CardContent className="p-8 md:p-10 relative z-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className="h-12 bg-background/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors" {...field} />
                          </FormControl>
                          <FormMessage className="font-mono text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" className="h-12 bg-background/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors" {...field} />
                          </FormControl>
                          <FormMessage className="font-mono text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="PCB Design Consultation" className="h-12 bg-background/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors" {...field} />
                        </FormControl>
                        <FormMessage className="font-mono text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Payload</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell me about your project requirements..." 
                            className="min-h-[180px] bg-background/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors resize-y p-4" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="font-mono text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input autoComplete="off" tabIndex={-1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="lg" className="w-full md:w-auto h-14 px-8 font-mono tracking-widest uppercase bg-primary hover:bg-primary/90 text-primary-foreground group rounded-none rounded-tr-xl rounded-bl-xl shadow-[4px_4px_0px_0px_rgba(var(--primary),0.2)] hover:shadow-[2px_2px_0px_0px_rgba(var(--primary),0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    Transmit Payload
                    <Send className="w-4 h-4 ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
