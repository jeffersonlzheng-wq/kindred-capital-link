import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { computeMatch, labelFor, SECTORS, STAGES, INVESTOR_TYPES, sharedInterests } from "@/lib/catalyst";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type MatchEntry = {
  id: string;
  full_name: string;
  role: "founder" | "investor";
  location: string | null;
  subtitle: string;
  sectorLabel: string | null;
  stageLabel: string | null;
  match: number;
  description: string | null;
  isRaising?: boolean;
  myInterests: string[];
  theirInterests: string[];
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

/* ── Swipeable hero card ─────────────────────────────────── */
function SwipeSection({ matches }: { matches: MatchEntry[] }) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const startX = useState<number | null>(null);
  const pointerStart = { current: startX[0] };
  const setPointerStart = (v: number | null) => startX[1](v as never);

  const navigate = useNavigate();

  const canBack = index > 0;
  const canNext = index < matches.length - 1;
  const THRESH = 90;

  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("a,button")) return;
    setPointerStart(e.clientX);
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging || pointerStart.current === null) return;
    setDragX(e.clientX - pointerStart.current);
  }
  function onPointerUp() {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX < -THRESH && canNext) {
      setExitDir("left");
      setTimeout(() => { setIndex(i => i + 1); setDragX(0); setExitDir(null); }, 240);
    } else if (dragX > THRESH && canBack) {
      setExitDir("right");
      setTimeout(() => { setIndex(i => i - 1); setDragX(0); setExitDir(null); }, 240);
    } else {
      setDragX(0);
    }
    setPointerStart(null);
  }

  if (!matches.length) return null;

  const cur = matches[index];
  const next = matches[index + 1];
  const prev = matches[index - 1];
  const shared = sharedInterests(cur.myInterests, cur.theirInterests);
  const rot = (dragX / 320) * 10;
  const dragProgress = Math.min(1, Math.abs(dragX) / THRESH);
  const nextScale = 0.94 + dragProgress * 0.06;
  const nextY = 14 - dragProgress * 14;

  let topStyle: React.CSSProperties = {
    transform: "translateX(0) rotate(0deg)",
    transition: "transform 0.32s cubic-bezier(0.34,1.1,0.64,1)",
    zIndex: 10,
    cursor: "grab",
  };
  if (isDragging) {
    topStyle = { transform: `translateX(${dragX}px) rotate(${rot}deg)`, transition: "none", zIndex: 10, cursor: "grabbing" };
  } else if (exitDir === "left") {
    topStyle = { transform: "translateX(-150%) rotate(-20deg)", transition: "transform 0.24s ease-in", zIndex: 10 };
  } else if (exitDir === "right") {
    topStyle = { transform: "translateX(150%) rotate(20deg)", transition: "transform 0.24s ease-in", zIndex: 10 };
  }

  return (
    <div className="flex flex-col items-center">
      {/* Card stack */}
      <div
        className="relative w-full select-none"
        style={{ height: 520, maxWidth: 460, touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Card behind (next) */}
        {next && (
          <div className="absolute inset-0" style={{
            transform: `scale(${nextScale}) translateY(${nextY}px)`,
            transformOrigin: "bottom center",
            transition: isDragging ? "none" : "transform 0.32s ease",
            zIndex: 5,
            pointerEvents: "none",
          }}>
            <ProfileCard entry={next} />
          </div>
        )}
        {/* Card further back */}
        {matches[index + 2] && (
          <div className="absolute inset-0" style={{
            transform: "scale(0.87) translateY(28px)",
            transformOrigin: "bottom center",
            zIndex: 1,
            opacity: 0.5,
            pointerEvents: "none",
          }}>
            <ProfileCard entry={matches[index + 2]} />
          </div>
        )}

        {/* Top card */}
        <div className="absolute inset-0" style={topStyle}>
          {/* Swipe hint labels */}
          {isDragging && dragX > 28 && (
            <div className="absolute top-6 left-6 z-20 pointer-events-none rounded px-2.5 py-1 text-xs font-bold"
              style={{ border: "1.5px solid var(--color-primary)", color: "var(--color-primary)", background: "oklch(0.82 0.145 85 / 0.10)", opacity: Math.min(1, dragX / 60) }}>
              ← Back
            </div>
          )}
          {isDragging && dragX < -28 && (
            <div className="absolute top-6 right-6 z-20 pointer-events-none rounded px-2.5 py-1 text-xs font-bold"
              style={{ border: "1.5px solid var(--color-primary)", color: "var(--color-primary)", background: "oklch(0.82 0.145 85 / 0.10)", opacity: Math.min(1, Math.abs(dragX) / 60) }}>
              Next →
            </div>
          )}
          <ProfileCard entry={cur} onMessage={() => navigate({ to: "/messages" })} />
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 flex items-center gap-5">
        <button
          onClick={() => canBack && setIndex(i => i - 1)}
          disabled={!canBack}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity"
          style={{ border: "1px solid var(--color-border)", opacity: canBack ? 1 : 0.25, color: "var(--color-primary)" }}
        >
          <ArrowLeft size={15} />
        </button>

        <div className="flex items-center gap-1.5">
          {matches.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)}
              className="rounded-full transition-all"
              style={{
                width: i === index ? 20 : 6, height: 6,
                background: i === index ? "var(--color-primary)" : "var(--color-border)",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => canNext && setIndex(i => i + 1)}
          disabled={!canNext}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity"
          style={{ border: "1px solid var(--color-border)", opacity: canNext ? 1 : 0.25, color: "var(--color-primary)" }}
        >
          <ArrowRight size={15} />
        </button>
      </div>

      <p className="mono-label mt-2 opacity-40">{index + 1} / {matches.length} · swipe or use arrows</p>
    </div>
  );
}

/* ── Single profile card face ───────────────────────────── */
function ProfileCard({ entry, onMessage }: { entry: MatchEntry; onMessage?: () => void }) {
  const shared = sharedInterests(entry.myInterests, entry.theirInterests);
  const isHigh = entry.match >= 70;

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{
        borderRadius: 20,
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderTopColor: isHigh ? "oklch(0.82 0.145 85 / 0.35)" : "var(--color-border)",
        boxShadow: "0 16px 48px -12px rgba(0,0,0,0.5)",
      }}
    >
      {/* Subtle gold wash at top for high matches */}
      {isHigh && (
        <div style={{
          position: "absolute", inset: 0, top: 0, height: 100, pointerEvents: "none", zIndex: 0,
          background: "linear-gradient(180deg, oklch(0.82 0.145 85 / 0.06) 0%, transparent 100%)",
          borderRadius: "inherit",
        }} />
      )}

      <div className="flex-1 flex flex-col p-7 overflow-y-auto relative z-10">
        {/* Header: avatar + match % */}
        <div className="flex items-start justify-between mb-5">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl font-display text-lg font-bold shrink-0"
            style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
          >
            {getInitials(entry.full_name)}
          </div>
          <div className="text-right">
            <div className="font-mono text-5xl font-bold tabular-nums leading-none" style={{ color: "var(--color-primary)" }}>
              {entry.match}%
            </div>
            <div className="mono-label mt-1">Match</div>
          </div>
        </div>

        {/* Name & subtitle */}
        <h3 className="font-display text-2xl font-bold leading-tight">{entry.full_name}</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          {entry.subtitle}
        </p>
        {entry.location && (
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)", opacity: 0.65 }}>
            {entry.location}
          </p>
        )}

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.sectorLabel && <span className="chip">{entry.sectorLabel}</span>}
          {entry.stageLabel && <span className="chip">{entry.stageLabel}</span>}
          {entry.isRaising && <span className="chip chip-gold">Raising</span>}
        </div>

        {/* Description */}
        {entry.description && (
          <p className="mt-4 text-sm leading-relaxed line-clamp-3" style={{ color: "var(--color-muted-foreground)" }}>
            {entry.description}
          </p>
        )}

        {/* Shared interests */}
        {shared.length > 0 && (
          <div
            className="mt-4 rounded-xl p-3.5"
            style={{ background: "oklch(0.82 0.145 85 / 0.07)", border: "1px solid oklch(0.82 0.145 85 / 0.15)" }}
          >
            <p className="mono-label mb-1">In common</p>
            <p className="text-sm" style={{ color: "var(--color-foreground)" }}>
              {shared.join(" · ")}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        className="flex gap-3 px-6 py-5 relative z-10 shrink-0"
        style={{ borderTop: "1px solid var(--color-border)" }}
        onPointerDown={e => e.stopPropagation()}
      >
        <Link
          to="/profile/$id"
          params={{ id: entry.id }}
          className="flex-1 rounded-lg py-3 text-center text-sm font-bold transition-opacity hover:opacity-85"
          style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
        >
          View profile
        </Link>
        <button
          onClick={onMessage}
          className="flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition-colors hover:bg-white/5"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <MessageCircle size={14} />
          Message
        </button>
      </div>
    </div>
  );
}

/* ── Compact list row ───────────────────────────────────── */
function MatchRow({ entry, rank }: { entry: MatchEntry; rank: number }) {
  const navigate = useNavigate();
  return (
    <div
      className="row-hover flex items-center gap-3 py-3 border-b cursor-pointer rounded-sm"
      style={{ borderColor: "var(--color-border)" }}
      onClick={() => navigate({ to: "/profile/$id", params: { id: entry.id } })}
    >
      <span className="mono-label w-5 text-right shrink-0" style={{ opacity: 0.3 }}>{rank}</span>
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 text-xs font-bold"
        style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
      >
        {getInitials(entry.full_name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.full_name}</p>
        <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>
          {entry.subtitle}{entry.sectorLabel ? ` · ${entry.sectorLabel}` : ""}
        </p>
      </div>
      <span className="match-score text-sm shrink-0">{entry.match}%</span>
      <ArrowRight size={13} style={{ color: "var(--color-muted-foreground)", opacity: 0.35 }} />
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
function Dashboard() {
  const { profile, user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "strong">("all");

  useEffect(() => {
    if (loading || !profile) return;
    if (!profile.role || !profile.onboarded) navigate({ to: "/onboarding", replace: true });
  }, [loading, profile, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id, profile?.role],
    enabled: !!user && !!profile?.onboarded,
    queryFn: async () => {
      const [{ data: profiles }, { data: founders }, { data: investors }, { data: me }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role, location"),
        supabase.from("founder_profiles").select("*"),
        supabase.from("investor_profiles").select("*"),
        profile?.role === "founder"
          ? supabase.from("founder_profiles").select("*").eq("user_id", user!.id).maybeSingle()
          : supabase.from("investor_profiles").select("*").eq("user_id", user!.id).maybeSingle(),
      ]);
      return { profiles: profiles ?? [], founders: founders ?? [], investors: investors ?? [], me };
    },
  });

  const matches = useMemo((): MatchEntry[] => {
    if (!data || !profile) return [];
    const pMap = new Map(data.profiles.map((p: { id: string; full_name: string; location: string | null }) => [p.id, p]));
    const out: MatchEntry[] = [];

    if (profile.role === "investor" && data.me) {
      const me = data.me as { interests: string[] | null; sectors: string[] | null; stages: string[] | null; check_min: number | null; check_max: number | null; availability: string[] | null };
      for (const f of data.founders as Array<{ user_id: string; company_name: string; sector: string | null; stage: string | null; description: string | null; fundraising_status: string | null; amount_raising: number | null; interests: string[] | null; looking_for: string[] | null }>) {
        const p = pMap.get(f.user_id); if (!p) continue;
        out.push({
          id: f.user_id, full_name: p.full_name, role: "founder", location: p.location,
          subtitle: f.company_name || "Founder",
          sectorLabel: f.sector ? labelFor(SECTORS, f.sector) : null,
          stageLabel: f.stage ? labelFor(STAGES, f.stage) : null,
          match: computeMatch(f, p.location, me, profile.location),
          description: f.description, isRaising: f.fundraising_status === "actively_raising",
          myInterests: me.interests ?? [], theirInterests: f.interests ?? [],
        });
      }
    } else if (profile.role === "founder" && data.me) {
      const me = data.me as { interests: string[] | null; sector: string | null; stage: string | null; amount_raising: number | null; looking_for: string[] | null };
      for (const i of data.investors as Array<{ user_id: string; fund_name: string; role: string | null; investor_type: string | null; sectors: string[] | null; stages: string[] | null; check_min: number | null; check_max: number | null; thesis: string | null; interests: string[] | null; availability: string[] | null }>) {
        const p = pMap.get(i.user_id); if (!p) continue;
        out.push({
          id: i.user_id, full_name: p.full_name, role: "investor", location: p.location,
          subtitle: i.fund_name || "Investor",
          sectorLabel: i.investor_type ? labelFor(INVESTOR_TYPES, i.investor_type) : null,
          stageLabel: i.stages?.[0] ? labelFor(STAGES, i.stages[0]) : null,
          match: computeMatch(me, profile.location, i, p.location),
          description: i.thesis,
          myInterests: me.interests ?? [], theirInterests: i.interests ?? [],
        });
      }
    }
    return out.sort((a, b) => b.match - a.match);
  }, [data, profile]);

  const swipeMatches = matches.slice(0, 8);
  const listMatches = matches.slice(1); // skip #1 — already in swipe hero
  const filtered = tab === "strong" ? listMatches.filter(m => m.match >= 60) : listMatches;

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  /* Loading skeleton */
  if (loading || !profile || !profile.role || !profile.onboarded) {
    return (
      <div className="max-w-xl mx-auto space-y-4 pt-2">
        <div className="h-6 w-44 bg-muted animate-pulse rounded" />
        <div className="h-[520px] w-full bg-muted animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold">
          {greeting}{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          {isLoading
            ? "Loading your matches…"
            : matches.length === 0
              ? "No matches yet — complete your profile to improve results."
              : `${matches.length} match${matches.length !== 1 ? "es" : ""}${matches.filter(m => m.match >= 70).length > 0 ? ` · ${matches.filter(m => m.match >= 70).length} above 70%` : ""}`}
        </p>
      </div>

      {/* Swipe cards */}
      {isLoading ? (
        <div className="h-[520px] w-full bg-muted animate-pulse rounded-2xl" />
      ) : swipeMatches.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: "1px solid var(--color-border)" }}>
          <Sparkles size={24} className="mx-auto mb-3" style={{ color: "var(--color-primary)", opacity: 0.5 }} />
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            No matches yet.{" "}
            <Link to="/discover" style={{ color: "var(--color-primary)" }}>Explore discovery →</Link>
          </p>
        </div>
      ) : (
        <SwipeSection matches={swipeMatches} />
      )}

      {/* All matches list */}
      {!isLoading && listMatches.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex">
              {(["all", "strong"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
                  style={{
                    color: tab === t ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                    borderBottom: tab === t ? "2px solid var(--color-primary)" : "2px solid transparent",
                  }}
                >
                  {t === "all" ? "All matches" : "Strong fits"}
                </button>
              ))}
            </div>
            <Link to="/discover" className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--color-primary)" }}>
              Discover more →
            </Link>
          </div>

          <div>
            {filtered.map((m, i) => <MatchRow key={m.id} entry={m} rank={i + 2} />)}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                No matches in this filter.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
