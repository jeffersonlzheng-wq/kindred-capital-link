import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { computeMatch } from "@/lib/catalyst";
import { SwipeMatchCard } from "@/components/SwipeMatchCard";
import { useEffect, useMemo } from "react";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { profile, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !profile) return;
    if (!profile.role || !profile.onboarded) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [loading, profile, navigate]);

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id, profile?.role],
    enabled: !!user && !!profile?.onboarded,
    queryFn: async () => {
      const [{ data: profiles }, { data: founders }, { data: investors }, { data: me }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role, location, featured"),
        supabase.from("founder_profiles").select("*"),
        supabase.from("investor_profiles").select("*"),
        profile?.role === "founder"
          ? supabase.from("founder_profiles").select("*").eq("user_id", user!.id).maybeSingle()
          : profile?.role === "investor"
            ? supabase.from("investor_profiles").select("*").eq("user_id", user!.id).maybeSingle()
            : Promise.resolve({ data: null }),
      ]);
      return { profiles: profiles ?? [], founders: founders ?? [], investors: investors ?? [], me };
    },
  });

  const topMatches = useMemo(() => {
    if (!data || !profile) return [];
    const pMap = new Map(data.profiles.map((p: { id: string; full_name: string; location: string | null }) => [p.id, p]));
    const out: { other: Parameters<typeof SwipeMatchCard>[0]["matches"][number]["other"]; match: number; myInterests: string[] }[] = [];

    if (profile.role === "investor" && data.me) {
      const me = data.me as { interests: string[] | null; sectors: string[] | null; stages: string[] | null; check_min: number | null; check_max: number | null; availability: string[] | null; looking_for_founders: string | null };
      for (const f of data.founders as Array<{ user_id: string; company_name: string; sector: string | null; stage: string | null; description: string | null; fundraising_status: string | null; amount_raising: number | null; interests: string[] | null; looking_for: string[] | null }>) {
        const p = pMap.get(f.user_id); if (!p) continue;
        const m = computeMatch(f, p.location, me, profile.location);
        out.push({ other: { id: f.user_id, full_name: p.full_name, role: "founder", location: p.location, company_name: f.company_name, sector: f.sector, stage: f.stage, description: f.description, fundraising_status: f.fundraising_status, fInterests: f.interests ?? [] }, match: m, myInterests: me.interests ?? [] });
      }
    } else if (profile.role === "founder" && data.me) {
      const me = data.me as { interests: string[] | null; sector: string | null; stage: string | null; amount_raising: number | null; looking_for: string[] | null };
      for (const i of data.investors as Array<{ user_id: string; fund_name: string; role: string | null; investor_type: string | null; sectors: string[] | null; stages: string[] | null; check_min: number | null; check_max: number | null; thesis: string | null; interests: string[] | null; availability: string[] | null; looking_for_founders: string | null }>) {
        const p = pMap.get(i.user_id); if (!p) continue;
        const m = computeMatch(me, profile.location, i, p.location);
        out.push({ other: { id: i.user_id, full_name: p.full_name, role: "investor", location: p.location, fund_name: i.fund_name, iRole: i.role, investor_type: i.investor_type, sectors: i.sectors ?? [], stages: i.stages ?? [], thesis: i.thesis, iInterests: i.interests ?? [] }, match: m, myInterests: me.interests ?? [] });
      }
    }

    return out.sort((a, b) => b.match - a.match).slice(0, 8);
  }, [data, profile]);

  if (loading || !profile || !profile.role || !profile.onboarded) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-[560px] w-full max-w-[440px] animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 pb-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="mono-label mb-1.5 opacity-50">
              {profile.role === "founder" ? "Top investors for you" : "Top founders for you"}
            </p>
            <h2 className="font-display text-2xl font-bold">Your matches</h2>
          </div>
          <Link
            to="/discover"
            className="text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-70"
            style={{ color: "var(--color-primary)" }}
          >
            See all
          </Link>
        </div>

        {topMatches.length === 0 ? (
          <div
            className="rounded-3xl p-12 text-center"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <Sparkles size={28} className="mx-auto mb-3" style={{ color: "var(--color-primary)", opacity: 0.4 }} />
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              No matches yet.{" "}
              <Link to="/discover" style={{ color: "var(--color-primary)" }}>
                Explore discovery
              </Link>
              .
            </p>
          </div>
        ) : (
          <SwipeMatchCard matches={topMatches} />
        )}
      </div>
    </div>
  );
}
