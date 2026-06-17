import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { computeMatch } from "@/lib/catalyst";
import { MatchCard } from "@/components/MatchCard";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { profile, user } = useAuth();

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: profiles }, { data: founders }, { data: investors }, { data: me }, { data: docs }, { data: refs }, { data: msgs }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role, location, featured"),
        supabase.from("founder_profiles").select("*"),
        supabase.from("investor_profiles").select("*"),
        profile?.role === "founder"
          ? supabase.from("founder_profiles").select("*").eq("user_id", user!.id).maybeSingle()
          : profile?.role === "investor"
            ? supabase.from("investor_profiles").select("*").eq("user_id", user!.id).maybeSingle()
            : Promise.resolve({ data: null }),
        supabase.from("documents").select("id").eq("owner_id", user!.id),
        supabase.from("referrals").select("id").eq("referrer_id", user!.id),
        supabase.from("conversations").select("id").or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`),
      ]);
      return { profiles: profiles ?? [], founders: founders ?? [], investors: investors ?? [], me, docCount: docs?.length ?? 0, refCount: refs?.length ?? 0, convCount: msgs?.length ?? 0 };
    },
  });

  const topMatches = useMemo(() => {
    if (!data || !profile) return [];
    const pMap = new Map(data.profiles.map((p: { id: string; full_name: string; location: string | null }) => [p.id, p]));
    const out: { other: Parameters<typeof MatchCard>[0]["other"]; match: number; myInterests: string[] }[] = [];
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
    return out.sort((a, b) => b.match - a.match).slice(0, 5);
  }, [data, profile]);

  // Profile completion
  const completion = useMemo(() => {
    if (!profile) return 0;
    let score = 0;
    if (profile.full_name) score += 20;
    if (profile.location) score += 10;
    if (profile.linkedin) score += 10;
    if (profile.role) score += 10;
    if (profile.onboarded) score += 20;
    if (data?.me) score += 30;
    return Math.min(100, score);
  }, [profile, data]);

  const refProgress = Math.min(5, data?.refCount ?? 0);

  if (!profile?.onboarded) {
    return (
      <div className="tile rounded-xl p-8 text-center">
        <h2 className="font-display text-xl font-bold">Finish setting up your profile</h2>
        <p className="mt-2 text-sm text-muted-foreground">Complete onboarding to start getting matched.</p>
        <Link to="/onboarding" className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">Continue onboarding</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-bold">Top matches</h2>
          <Link to="/discover" className="text-xs font-bold uppercase tracking-wider text-primary">View all</Link>
        </div>
        {topMatches.length === 0 ? (
          <div className="tile rounded-xl p-8 text-center text-sm text-muted-foreground">
            No matches yet. <Link to="/discover" className="text-primary">Explore discovery</Link>.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {topMatches.map((m) => <MatchCard key={m.other.id} {...m} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display mb-4 text-xl font-bold">Suggested next actions</h2>
        <div className="grid gap-px border border-border bg-border md:grid-cols-3">
          <Link to="/documents" className="tile tile-hover p-5">
            <div className="font-bold">Upload your pitch deck</div>
            <p className="mt-1 text-xs text-muted-foreground">Share it directly through chat with matched investors.</p>
          </Link>
          <Link to="/referrals" className="tile tile-hover p-5">
            <div className="font-bold">Invite 5 friends, get 1 month free</div>
            <p className="mt-1 text-xs text-muted-foreground">You're at {refProgress}/5.</p>
          </Link>
          <Link to="/onboarding" className="tile tile-hover p-5">
            <div className="font-bold">Polish your profile</div>
            <p className="mt-1 text-xs text-muted-foreground">{completion}% complete — higher completion, better matches.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
