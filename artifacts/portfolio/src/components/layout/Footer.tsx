import { Github, Linkedin, Mail } from "lucide-react";
import { Link } from "wouter";
import { useSection } from "@/hooks/useSection";
import { useSectionJson } from "@/hooks/useSectionJson";

type ConnectAccount = {
  name: string;
  url: string;
  logo?: string;
};

export function Footer() {
  const email = useSection("contact_email", "saleem.shahzad@example.com");
  const accounts = useSectionJson<ConnectAccount[]>(
    "connect_accounts",
    [
      { name: "GitHub", url: "https://github.com/saleemshahzad" },
      { name: "LinkedIn", url: "https://linkedin.com/in/saleemshahzad" },
      { name: "Email", url: `mailto:${email}` },
    ],
  );

  const normalizedAccounts = accounts.map((account) => {
    if (account.name.toLowerCase() === "email" && !account.url.startsWith("mailto:")) {
      return { ...account, url: `mailto:${account.url}` };
    }
    return account;
  });

  function fallbackIcon(name: string) {
    const key = name.toLowerCase();
    if (key.includes("github")) return Github;
    if (key.includes("linkedin")) return Linkedin;
    if (key.includes("mail") || key.includes("email")) return Mail;
    return null;
  }

  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm mt-auto relative overflow-hidden">
      {/* Decorative gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="font-mono font-bold text-xl text-primary tracking-tight inline-block mb-6">
              S.SHAHZAD<span className="text-secondary">_</span>
            </Link>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              Electrical Engineer specializing in Embedded Systems, PCB Design, Arduino, and ESP32. Turning complex ideas into robust, production-ready hardware.
            </p>
          </div>
          
          <div>
            <h3 className="font-display font-semibold mb-6 text-sm uppercase tracking-widest text-foreground/80">Navigation</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors inline-block">About</Link></li>
              <li><Link href="/projects" className="hover:text-primary transition-colors inline-block">Projects</Link></li>
              <li><Link href="/skills" className="hover:text-primary transition-colors inline-block">Skills</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors inline-block">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors inline-block">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold mb-6 text-sm uppercase tracking-widest text-foreground/80">Connect</h3>
            <div className="flex gap-4">
              {normalizedAccounts.map((account) => {
                const Icon = !account.logo ? fallbackIcon(account.name) : null;
                const isExternal =
                  /^https?:\/\//.test(account.url) || account.url.startsWith("mailto:");

                return (
                  <a
                    key={`${account.name}:${account.url}`}
                    href={account.url}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer" : undefined}
                    aria-label={account.name}
                    title={account.name}
                    className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 transition-all overflow-hidden"
                  >
                    {account.logo ? (
                      <img
                        src={account.logo}
                        alt={account.name}
                        className="w-full h-full object-cover"
                      />
                    ) : Icon ? (
                      <Icon className="h-4 w-4" />
                    ) : (
                      <span className="font-mono text-[10px]">
                        {account.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="border-t border-border/50 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground font-mono">
          <p>© {new Date().getFullYear()} Saleem Shahzad.</p>
          <p className="mt-2 md:mt-0 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> 
            System Operational
          </p>
        </div>
      </div>
    </footer>
  );
}
