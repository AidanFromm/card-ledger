import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

type AuthMode = "signin" | "signup" | "reset";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/scan");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/scan");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      if (password !== confirmPassword) {
        toast({ variant: "destructive", title: "Passwords don't match", description: "Please make sure your passwords match." });
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        toast({ variant: "destructive", title: "Password too short", description: "Password must be at least 6 characters." });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });

      if (error) {
        toast({ variant: "destructive", title: "Sign up failed", description: error.message });
      } else {
        toast({ title: "Welcome to CardLedger!", description: "Your account has been created." });
      }
    } else if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ variant: "destructive", title: "Sign in failed", description: error.message });
      }
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ variant: "destructive", title: "Email required", description: "Please enter your email address." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Reset failed", description: error.message });
    } else {
      toast({ title: "Check your email", description: "We've sent you a password reset link." });
      setMode("signin");
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/scan` },
    });
    if (error) {
      toast({ variant: "destructive", title: "Sign in failed", description: error.message });
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail(""); setPassword(""); setConfirmPassword(""); setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(212 100% 49% / 0.08) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-primary/3 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo Section — large and prominent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center mb-5">
            <Logo size={72} showText={false} animated />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {mode === "reset" ? "Reset Password" : (
              <>Card<span className="text-primary">Ledger</span></>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {mode === "reset"
              ? "Enter your email to receive a reset link"
              : "Track your cards. Know your worth."}
          </p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-3xl"
        >
          {mode !== "reset" && (
            <>
              {/* Tab Switcher */}
              <div className="flex gap-1 bg-secondary/30 rounded-2xl p-1 mb-6">
                <button
                  onClick={() => { setMode("signin"); resetForm(); }}
                  className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    mode === "signin"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMode("signup"); resetForm(); }}
                  className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    mode === "signup"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Social Login */}
              <div className="space-y-2.5 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-2xl gap-3 font-semibold border-border/40 hover:bg-secondary/50 active:scale-[0.97] transition-all"
                  onClick={() => handleSocialLogin("apple")}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continue with Apple
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-2xl gap-3 font-semibold border-border/40 hover:bg-secondary/50 active:scale-[0.97] transition-all"
                  onClick={() => handleSocialLogin("google")}
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-border/40" />
              </div>
            </>
          )}

          {mode === "reset" && (
            <button
              onClick={() => setMode("signin")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors active:scale-[0.97]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </button>
          )}

          {/* Email Form */}
          <form onSubmit={mode === "reset" ? handleResetPassword : handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  id="email" type="email" placeholder="your@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="h-12 pl-11 rounded-2xl bg-secondary/30 border-border/40 focus:border-primary/50"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {mode !== "reset" && (
                <motion.div
                  key="password-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <Input
                        id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                        className="h-12 pl-11 pr-11 rounded-2xl bg-secondary/30 border-border/40 focus:border-primary/50"
                      />
                      <button
                        type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {mode === "signup" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                          <Input
                            id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="••••••••"
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                            className="h-12 pl-11 rounded-2xl bg-secondary/30 border-border/40 focus:border-primary/50"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {mode === "signin" && (
              <button
                type="button" onClick={() => setMode("reset")}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </button>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-2xl text-base font-semibold mt-2 active:scale-[0.97] transition-all"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {mode === "reset" ? "Sending..." : mode === "signup" ? "Creating account..." : "Signing in..."}
                </span>
              ) : (
                mode === "reset" ? "Send Reset Link" : mode === "signup" ? "Create Account" : "Sign In"
              )}
            </Button>
          </form>

          {mode === "signup" && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              By signing up, you agree to our{" "}
              <a href="/legal" className="text-primary hover:underline">Terms</a>
              {" "}and{" "}
              <a href="/legal" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground/50 mt-8"
        >
          CardLedger v1.0.0
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Auth;
