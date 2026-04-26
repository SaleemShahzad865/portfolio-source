import { useAuth } from "@workspace/replit-auth-web";
import { motion } from "framer-motion";
import { Terminal, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    setLocation("/admin");
    return null;
  }

  async function handleLogin() {
    setIsSubmitting(true);
    setError(null);

    const result = await login({ email, password });

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Unable to sign in");
      return;
    }

    setLocation("/admin");
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center circuit-bg dark bg-noise p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-50" />
        <div className="relative bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-background border border-border/50 rounded-2xl flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/10" />
              <Lock className="w-8 h-8 text-primary relative z-10" />
            </div>
            <div className="flex items-center gap-2 text-primary font-mono mb-2 text-sm tracking-wider uppercase">
              <Terminal className="w-4 h-4" />
              <span>System.auth()</span>
            </div>
            <h1 className="text-3xl font-display font-bold">Admin Access</h1>
            <p className="text-muted-foreground mt-2 font-light">Local control panel.</p>
          </div>

          <div className="space-y-4">
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 bg-background/60 font-mono text-sm"
              placeholder="Username"
              type="text"
            />
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 bg-background/60 font-mono text-sm"
              placeholder="Password"
              type="password"
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Button 
            onClick={handleLogin}
            size="lg" 
            disabled={isSubmitting}
            className="mt-6 w-full h-14 font-mono tracking-widest uppercase bg-primary hover:bg-primary/90 text-primary-foreground group"
          >
            {isSubmitting ? "Signing In" : "Sign In"}
            <Lock className="w-4 h-4 ml-3 group-hover:hidden" />
            <Terminal className="w-4 h-4 ml-3 hidden group-hover:block" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
