import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DISCOVERY_CATEGORIES, computeMatch } from "@/lib/catalyst";
import { useAuth } from "@/lib/auth";
import { MatchCard } from "@/components/MatchCard";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/discover/$category")({
  component: CategoryPage,
});

type ProfileRow = { id: string; full_name: string; role: string | null; location: string | null; featured: boolean };
type FRow = { user_id: string; company_name: string; sector: string | null; stage: string | null; description: string | null; fundraising_status: string | null; amount_raising: number | null; interests: string[] | null; looking_for: string[] | null; created_at: string };
type IRow = { user_id: string; fund_name: string; role: string | null; investor_type: string | null; sectors: string[] | null; stages: string[] | null; check_min: number | null; check_max: number | null; thesis: string | null; interests: string[] | null; availability: string[] | null; looking_for_founders: string | null; created_at: string };

function CategoryPage() {
  const { category } = Route.useParams();
  const { profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["discover-all"],
    queryFn: async () => {
      const [{ data: profiles }, { data: founders }, { data: investors }, { data: meFounder }, { data: meInvestor }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role, location, featured"),
        supabase.from("founder_profiles").select("*"),
        supabase.from("investor_profiles").select("*"),
        profile?.role === "founder" ? supabase.from("founder_profiles").select("*").eq("user_id", profile.id).maybeSingle() : Promise.resolve({ data: null }),
        profile?.role === "investor" ? supabase.from("investor_profiles").select("*").eq("user_id", profile.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      return {
        profiles: (profiles ?? []) as ProfileRow[],
        founders: (founders ?? []) as FRow[],
        investors: (investors ?? []) as IRow[],
        meFounder: meFounder as FRow | null,
        meInvestor: meInvestor as IRow | null,
      };
    },
  });

  const cards = useMemo(() => {
    if (!data || !profile) return [];
    const pMap = new Map(data.profiles.map(p => [p.id, p]));
    const out: { other: Parameters<typeof MatchCard>[0]["other"]; match: number; myInterests: string[]; createdAt: string }[] = [];

    if (profile.role === "investor" && data.meInvestor) {
      for (const f of data.founders) {
        if (f.user_id === profile.id) continue;
        const p = pMap.get(f.user_id);
        if (!p) continue;
        const m = computeMatch(f, p.location, data.meInvestor, profile.location);
        out.push({
          other: { id: f.user_id, full_name: p.full_name, role: "founder", location: p.location, company_name: f.company_name, sector: f.sector, stage: f.stage, description: f.description, fundraising_status: f.fundraising_status, fInterests: f.interests ?? [] },
          match: m, myInterests: data.meInvestor.interests ?? [], createdAt: f.created_at,
        });
      }
    } else if (profile.role === "founder" && data.meFounder) {
      for (const i of data.investors) {
        if (i.user_id === profile.id) continue;
        const p = pMap.get(i.user_id);
        if (!p) continue;
        const m = computeMatch(data.meFounder, profile.location, i, p.location);
        out.push({
          other: { id: i.user_id, full_name: p.full_name, role: "investor", location: p.location, fund_name: i.fund_name, iRole: i.role, investor_type: i.investor_type, sectors: i.sectors ?? [], stages: i.stages ?? [], thesis: i.thesis, iInterests: i.interests ?? [] },
          match: m, myInterests: data.meFounder.interests ?? [], createdAt: i.created_at,
        });
      }
    } else {
      for (const f of data.founders) {
        const p = pMap.get(f.user_id); if (!p) continue;
        out.push({ other: { id: f.user_id, full_name: p.full_name, role: "founder", location: p.location, company_name: f.company_name, sector: f.sector, stage: f.stage, description: f.description, fundraising_status: f.fundraising_status, fInterests: f.interests ?? [] }, match: 0, myInterests: [], createdAt: f.created_at });
      }
      for (const i of data.investors) {
        const p = pMap.get(i.user_id); if (!p) continue;
        out.push({ other: { id: i.user_id, full_name: p.full_name, role: "investor", location: p.location, fund_name: i.fund_name, iRole: i.role, investor_type: i.investor_type, sectors: i.sectors ?? [], stages: i.stages ?? [], thesis: i.thesis, iInterests: i.interests ?? [] }, match: 0, myInterests: [], createdAt: i.created_at });
      }
    }

    let filtered = out;
    // Investors only see founders; founders only see investors.
    if (profile?.role === "founder") {
      filtered = filtered.filter(x => x.other.role === "investor");
    } else if (profile?.role === "investor") {
      filtered = filtered.filter(x => x.other.role === "founder");
    }
    if (category && category !== "all") {
      const cat = DISCOVERY_CATEGORIES.find(c => c.slug === category);
      if (cat?.kind === "sector") {
        filtered = filtered.filter(x => x.other.role === "founder" ? x.other.sector === category : x.other.sectors?.includes(category));
      } else if (category === "raising-now") {
        filtered = filtered.filter(x => x.other.fundraising_status === "actively_raising");
      } else if (category === "high-match") {
        filtered = filtered.filter(x => x.match >= 70);
      } else if (category === "trending-founders") {
        filtered = filtered.filter(x => x.other.role === "founder");
      } else if (category === "active-investors") {
        filtered = filtered.filter(x => x.other.role === "investor");
      } else if (category === "new-this-week") {
        const wk = Date.now() - 7 * 24 * 3600 * 1000;
        filtered = filtered.filter(x => new Date(x.createdAt).getTime() > wk);
      }
    }
    return filtered.sort((a, b) => b.match - a.match);
  }, [data, profile, category]);

  const activeCat = category === "all"
    ? { slug: "all", label: "All", kind: "curated" as const }
    : DISCOVERY_CATEGORIES.find(c => c.slug === category) ?? null;

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/discover" className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{activeCat?.label ?? "Matches"}</h1>
          <p className="text-sm text-muted-foreground">
            {cards.length} {cards.length === 1 ? "match" : "matches"} · ranked by score
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
      ) : cards.length === 0 ? (
        <div className="tile rounded-xl p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No profiles in this category yet. Invite friends from{" "}
            <Link to="/referrals" className="text-primary underline">Referrals</Link>.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((c) => (
            <MatchCard key={c.other.id} other={c.other} match={c.match} myInterests={c.myInterests} />
          ))}
        </div>
      )}
    </div>
  );
}
