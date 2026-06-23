import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DISCOVERY_CATEGORIES, computeMatch } from "@/lib/catalyst";
import { useAuth } from "@/lib/auth";
import { MatchCard } from "@/components/MatchCard";
import { useMemo, useState } from "react";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/discover/$category")({
  component: CategoryPage,
});

type ProfileRow = { id: string; full_name: string; role: string | null; location: string | null; featured: boolean };
type FRow = { user_id: string; company_name: string; sector: string | null; stage: string | null; description: string | null; fundraising_status: string | null; amount_raising: number | null; interests: string[] | null; looking_for: string[] | null; created_at: string };
type IRow = { user_id: string; fund_name: string; role: string | null; investor_type: string | null; sectors: string[] | null; stages: string[] | null; check_min: number | null; check_max: number | null; thesis: string | null; interests: string[] | null; availability: string[] | null; looking_for_founders: string | null; created_at: string };

function CategoryPage() {
  const { category } = Route.useParams();
  const { profile } = useAuth();
  const [sort, setSort] = useState<"match" | "recent">("match");

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
        out.push({ other: { id: f.user_id, full_name: p.full_name, role: "founder", location: p.location, company_name: f.company_name, sector: f.sector, stage: f.stage, description: f.description, fundraising_status: f.fundraising_status, fInterests: f.interests ?? [] }, match: m, myInterests: data.meInvestor.interests ?? [], createdAt: f.created_at });
      }
    } else if (profile.role === "founder" && data.meFounder) {
      for (const i of data.investors) {
        if (i.user_id === profile.id) continue;
        const p = pMap.get(i.user_id);
        if (!p) continue;
        const m = computeMatch(data.meFounder, profile.location, i, p.location);
        out.push({ other: { id: i.user_id, full_name: p.full_name, role: "investor", location: p.location, fund_name: i.fund_name, iRole: i.role, investor_type: i.investor_type, sectors: i.sectors ?? [], stages: i.stages ?? [], thesis: i.thesis, iInterests: i.interests ?? [] }, match: m, myInterests: data.meFounder.interests ?? [], createdAt: i.created_at });
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
    if (profile?.role === "founder") filtered = filtered.filter(x => x.other.role === "investor");
    else if (profile?.role === "investor") filtered = filtered.filter(x => x.other.role === "founder");

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

    return sort === "match"
      ? filtered.sort((a, b) => b.match - a.match)
      : filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data, profile, category, sort]);

  const activeCat = category === "all"
    ? { slug: "all", label: "All Sectors", kind: "curated" as const }
    : DISCOVERY_CATEGORIES.find(c => c.slug === category) ?? null;

  const top = cards[0];
  const rest = cards.slice(1);

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/discover"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-white/5"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <p className="mono-label">Discovery</p>
            <h1 className="font-display text-2xl font-extrabold leading-tight">
              {activeCat?.label ?? "Matches"}
            </h1>
          </div>
        </div>

        {/* Sort + count */}
        <div className="flex items-center gap-3">
          {!isLoading && (
            <span className="mono-label">
              {cards.length} {cards.length === 1 ? "result" : "results"}
            </span>
          )}
          <div
            className="flex items-center gap-1 rounded-xl p-1"
            style={{ border: "1px solid var(--color-border)", background: "var(--color-card)" }}
          >
            {(["match", "recent"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className="rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
                style={{
                  background: sort === s ? "var(--color-primary)" : "transparent",
                  color: sort === s ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
                }}
              >
                {s === "match" ? "Best match" : "Newest"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
            <SlidersHorizontal size={12} />
            Filter
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl" style={{ background: "var(--color-card)" }} />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
          style={{ border: "1px solid var(--color-border)", background: "var(--color-card)" }}>
          <div className="mb-3 text-4xl">🔍</div>
          <p className="text-sm font-medium">No profiles here yet.</p>
          <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            Invite founders and investors from{" "}
            <Link to="/referrals" style={{ color: "var(--color-primary)" }}>Referrals →</Link>
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured top match */}
          {top && sort === "match" && (
            <div>
              <p className="mono-label mb-3">Top match</p>
              <MatchCard other={top.other} match={top.match} myInterests={top.myInterests} featured />
            </div>
          )}

          {/* Grid */}
          <div>
            {sort === "match" && rest.length > 0 && (
              <p className="mono-label mb-3">All results</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(sort === "match" ? rest : cards).map((c) => (
                <MatchCard key={c.other.id} other={c.other} match={c.match} myInterests={c.myInterests} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
