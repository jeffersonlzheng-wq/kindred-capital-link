import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { computeMatch, labelFor, SECTORS, STAGES, INVESTOR_TYPES, sharedInterests } from "@/lib/catalyst";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, ArrowRight, TrendingUp, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type MatchRow = {
  id: string;
  full_name: string;
  role: "founder" | "investor";
  location: string | null;
  subtitle: string;
  tag: string | null;
  stage: string | null;
  match: number;
  description: string | null;
  isRaising?: boolean;
  myInterests: string[];
  theirInterests: string[];
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border">
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-36 bg-muted animate-pulse rounded" />
        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-5 w-12 bg-muted animate-pulse rounded" />
    </div>
  );
}

function FeaturedCard({ match }: { match: MatchRow }) {
  const navigate = useNavigate();
  const shared = sharedInterests(match.myInterests, match.theirInterests);

  return (
    <div
      className="rounded-lg p-5 mb-6"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-4">
        <span className="mono-label" style={{ color: "var(--color-primary)" }}>
          Top match
        </span>
        <span
          className="mono-label px-2 py-0.5 rounded"
          style={{ background: "oklch(0.74 0.19 158 / 0.10)", color: "var(--color-primary)", border: "1px solid oklch(0.74 0.19 158 / 0.20)" }}
        >
          {match.match}% fit
        </span>
      </div>

      {/* Identity */}
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full shrink-0 text-sm font-bold"
          style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
        >
          {getInitials(match.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-tight">{match.full_name}</h3>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{match.subtitle}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {match.tag && <span className="chip">{match.tag}</span>}
            {match.stage && <span className="chip">{labelFor(STAGES, match.stage)}</span>}
            {match.isRaising && <span className="chip chip-green">Raising</span>}
          </div>
        </div>
      </div>

      {/* Description */}
      {match.description && (
        <p className="mt-4 text-sm leading-relaxed line-clamp-2" style={{ color: "var(--color-muted-foreground)" }}>
          {match.description}
        </p>
      )}

      {/* Shared interests */}
      {shared.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <Zap size={11} style={{ color: "var(--color-primary)" }} />
          <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            In common: <span style={{ color: "var(--color-foreground)" }}>{shared.slice(0, 3).join(", ")}</span>
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Link
          to="/profile/$id"
          params={{ id: match.id }}
          className="flex-1 rounded py-2.5 text-center text-sm font-semibold transition-colors"
          style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
        >
          View profile
        </Link>
        <button
          onClick={() => navigate({ to: "/messages" })}
          className="flex items-center justify-center gap-1.5 rounded px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
        >
          <MessageCircle size={14} />
          Message
        </button>
      </div>
    </div>
  );
}

function MatchListRow({ match, rank }: { match: MatchRow; rank: number }) {
  const navigate = useNavigate();
  return (
    <div
      className="flex items-center gap-3 py-3.5 border-b cursor-pointer group transition-colors"
      style={{ borderColor: "var(--color-border)" }}
      onClick={() => navigate({ to: "/profile/$id", params: { id: match.id } })}
    >
      {/* Rank */}
      <span
        className="mono-label w-5 text-right shrink-0"
        style={{ opacity: 0.35 }}
      >
        {rank}
      </span>

      {/* Avatar */}
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full shrink-0 text-xs font-bold"
        style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
      >
        {getInitials(match.full_name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{match.full_name}</span>
          {match.isRaising && (
            <span className="chip chip-green shrink-0">Raising</span>
          )}
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-muted-foreground)" }}>
          {match.subtitle}
          {match.tag ? ` · ${match.tag}` : ""}
        </p>
      </div>

      {/* Match score */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="match-score text-sm"
          style={{ minWidth: 36, textAlign: "right" }}
        >
          {match.match}%
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); navigate({ to: "/messages" }); }}
          className="flex h-7 w-7 items-center justify-center rounded transition-colors opacity-0 group-hover:opacity-100"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <MessageCircle size={13} style={{ color: "var(--color-muted-foreground)" }} />
        </button>
        <ArrowRight size={14} style={{ color: "var(--color-muted-foreground)", opacity: 0.4 }} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div
      className="rounded-lg p-4 flex items-center gap-3"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded shrink-0"
        style={{ background: "oklch(0.74 0.19 158 / 0.10)" }}
      >
        <Icon size={15} style={{ color: "var(--color-primary)" }} />
      </div>
      <div>
        <div className="font-mono text-lg font-bold leading-none">{value}</div>
        <div className="mono-label mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { profile, user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "top">("all");

  useEffect(() => {
    if (loading || !profile) return;
    if (!profile.role || !profile.onboarded) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [loading, profile, navigate]);

  const { data, isLoading } = useQuery({
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

  const matches = useMemo((): MatchRow[] => {
    if (!data || !profile) return [];
    const pMap = new Map(data.profiles.map((p: { id: string; full_name: string; location: string | null }) => [p.id, p]));
    const out: MatchRow[] = [];

    if (profile.role === "investor" && data.me) {
      const me = data.me as { interests: string[] | null; sectors: string[] | null; stages: string[] | null; check_min: number | null; check_max: number | null; availability: string[] | null };
      for (const f of data.founders as Array<{ user_id: string; company_name: string; sector: string | null; stage: string | null; description: string | null; fundraising_status: string | null; amount_raising: number | null; interests: string[] | null; looking_for: string[] | null }>) {
        const p = pMap.get(f.user_id); if (!p) continue;
        const m = computeMatch(f, p.location, me, profile.location);
        out.push({
          id: f.user_id,
          full_name: p.full_name,
          role: "founder",
          location: p.location,
          subtitle: f.company_name || "Founder",
          tag: f.sector ? labelFor(SECTORS, f.sector) : null,
          stage: f.stage,
          match: m,
          description: f.description,
          isRaising: f.fundraising_status === "actively_raising",
          myInterests: me.interests ?? [],
          theirInterests: f.interests ?? [],
        });
      }
    } else if (profile.role === "founder" && data.me) {
      const me = data.me as { interests: string[] | null; sector: string | null; stage: string | null; amount_raising: number | null; looking_for: string[] | null };
      for (const i of data.investors as Array<{ user_id: string; fund_name: string; role: string | null; investor_type: string | null; sectors: string[] | null; stages: string[] | null; check_min: number | null; check_max: number | null; thesis: string | null; interests: string[] | null; availability: string[] | null }>) {
        const p = pMap.get(i.user_id); if (!p) continue;
        const m = computeMatch(me, profile.location, i, p.location);
        out.push({
          id: i.user_id,
          full_name: p.full_name,
          role: "investor",
          location: p.location,
          subtitle: i.fund_name || "Investor",
          tag: i.investor_type ? labelFor(INVESTOR_TYPES, i.investor_type) : null,
          stage: i.stages?.[0] ?? null,
          match: m,
          description: i.thesis,
          myInterests: me.interests ?? [],
          theirInterests: i.interests ?? [],
        });
      }
    }

    return out.sort((a, b) => b.match - a.match);
  }, [data, profile]);

  const displayed = tab === "top" ? matches.filter((m) => m.match >= 60) : matches;
  const topMatch = matches[0] ?? null;
  const highMatchCount = matches.filter((m) => m.match >= 70).length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  if (loading || !profile || !profile.role || !profile.onboarded) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-7 w-48 bg-muted animate-pulse rounded mb-1" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded mb-8" />
        <div className="h-48 bg-muted animate-pulse rounded-lg mb-6" />
        {[0,1,2,3].map(i => <SkeletonRow key={i} />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold">
          {greeting}{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          {isLoading
            ? "Loading matches…"
            : matches.length === 0
              ? "No matches yet — complete your profile to start matching."
              : `${matches.length} match${matches.length !== 1 ? "es" : ""} found${highMatchCount > 0 ? ` · ${highMatchCount} above 70%` : ""}.`}
        </p>
      </div>

      {/* Stats row */}
      {!isLoading && matches.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard icon={Users} label="Total matches" value={String(matches.length)} />
          <StatCard icon={TrendingUp} label="Above 70%" value={String(highMatchCount)} />
          <StatCard icon={Zap} label="Top score" value={`${topMatch?.match ?? 0}%`} />
        </div>
      )}

      {/* Featured top match */}
      {!isLoading && topMatch && <FeaturedCard match={topMatch} />}

      {/* Match list */}
      {!isLoading && matches.length > 1 && (
        <div>
          {/* Tab bar */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex gap-0">
              {(["all", "top"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
                  style={{
                    color: tab === t ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                    borderBottom: tab === t ? "2px solid var(--color-primary)" : "2px solid transparent",
                  }}
                >
                  {t === "all" ? "All matches" : "Strong fits"}
                </button>
              ))}
            </div>
            <Link
              to="/discover"
              className="text-xs transition-colors"
              style={{ color: "var(--color-primary)" }}
            >
              Discover more →
            </Link>
          </div>

          {/* Rows — skip the first one (already shown as featured) */}
          <div>
            {displayed.slice(1).map((m, i) => (
              <MatchListRow key={m.id} match={m} rank={i + 2} />
            ))}
            {displayed.slice(1).length === 0 && (
              <p className="py-8 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                No matches in this filter.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && matches.length === 0 && (
        <div
          className="rounded-lg p-10 text-center"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            No matches yet.{" "}
            <Link to="/discover" style={{ color: "var(--color-primary)" }}>
              Explore discovery →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
