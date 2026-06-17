import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

const search = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  role: z.enum(["founder", "investor"]).optional(),
  ref: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Sign in · Catalyst" }] }),
  component: AuthPage,
});

function AuthPage() {
  const sp = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(sp.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard" });
    }
  }, [loading, user, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const redirect = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: redirect, data: { full_name: name } },
        });
        if (error) throw error;
        // Set role + referral
        if (data.user) {
          await supabase.from("profiles").update({
            full_name: name,
            role: sp.role ?? null,
          }).eq("id", data.user.id);
          if (sp.ref) {
            const { data: refUser } = await supabase.from("profiles").select("id").eq("referral_code", sp.ref).maybeSingle();
            if (refUser?.id) {
              await supabase.from("profiles").update({ referred_by: refUser.id }).eq("id", data.user.id);
              await supabase.from("referrals").insert({ referrer_id: refUser.id, referred_id: data.user.id });
            }
          }
        }
        toast.success("Account created. Welcome to Catalyst.");
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden border-r border-border bg-foreground p-12 text-background md:flex md:flex-col md:justify-between">
        <Link to="/" className="font-display text-lg font-extrabold italic">CATALYST</Link>
        <div>
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Precision matching<br/>for the private market.
          </h2>
          <p className="mt-6 max-w-sm text-sm text-white/60">
            Join thousands of founders and investors building better connections through proprietary weighted matching.
          </p>
        </div>
        <p className="text-xs text-white/40">© 2026 Catalyst. Not a broker-dealer.</p>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-extrabold">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signup"
                ? sp.role === "investor" ? "Investor account" : sp.role === "founder" ? "Founder account" : "Get matched with the right partners"
                : "Sign in to continue to Catalyst"}
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={handleGoogle}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface text-sm font-semibold hover:bg-accent disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="mono-label">or email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <input
                required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
              />
            )}
            <input
              required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
            />
            <input
              required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit" disabled={busy}
              className="h-11 w-full rounded-lg bg-primary text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "signup" ? "Already have an account? " : "New to Catalyst? "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="font-semibold text-foreground underline-offset-4 hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
