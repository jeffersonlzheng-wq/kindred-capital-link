import { Link } from "@tanstack/react-router";
import { labelFor, SECTORS, STAGES, sharedInterests, INVESTOR_TYPES } from "@/lib/catalyst";
import { MapPin, Sparkles } from "lucide-react";

type Other = {
  id: string;
  full_name: string;
  role: "founder" | "investor" | null;
  location: string | null;
  company_name?: string;
  sector?: string | null;
  stage?: string | null;
  description?: string | null;
  fInterests?: string[];
  fundraising_status?: string | null;
  fund_name?: string;
  iRole?: string | null;
  investor_type?: string | null;
  sectors?: string[];
  stages?: string[];
  thesis?: string | null;
  iInterests?: string[];
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function matchColor(m: number) {
  if (m >= 80) return "oklch(0.82 0.145 85)";
  if (m >= 60) return "oklch(0.82 0.145 85 / 0.75)";
  return "oklch(0.82 0.145 85 / 0.45)";
}

export function MatchCard({
  other,
  match,
  myInterests = [],
  onMessage,
  featured = false,
}: {
  other: Other;
  match: number;
  myInterests?: string[];
  onMessage?: () => void;
  featured?: boolean;
}) {
  const isFounder = other.role === "founder";
  const interestsOther = isFounder ? other.fInterests : other.iInterests;
  const shared = sharedInterests(myInterests, interestsOther);
  const isHigh = match >= 70;

  /* ── Featured (wide) card ─────────────────── */
  if (featured) {
    return (
      <Link
        to="/profile/$id"
        params={{ id: other.id }}
        className="group block overflow-hidden rounded-2xl transition-transform active:scale-[0.995]"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderTopColor: "oklch(0.82 0.145 85 / 0.30)",
          boxShadow: "0 8px 40px -12px oklch(0.82 0.145 85 / 0.15)",
        }}
      >
        {/* Gold accent strip */}
        <div style={{ height: 3, background: "linear-gradient(90deg, oklch(0.82 0.145 85) 0%, oklch(0.82 0.145 85 / 0.2) 100%)" }} />

        <div className="p-6 sm:flex sm:items-start sm:gap-6">
          {/* Left: avatar + name */}
          <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:w-40 sm:shrink-0">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl font-display text-xl font-bold shrink-0"
              style={{ background: "oklch(0.82 0.145 85 / 0.12)", border: "1px solid oklch(0.82 0.145 85 / 0.22)", color: "var(--color-primary)" }}
            >
              {getInitials(other.full_name)}
            </div>
            <div>
              <h3 className="font-display text-lg font-extrabold leading-tight">{other.full_name}</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                {isFounder ? other.company_name || "Founder" : other.fund_name || "Investor"}
              </p>
            </div>
          </div>

          {/* Middle: details */}
          <div className="mt-4 flex-1 sm:mt-0">
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {isFounder ? (
                <>
                  {other.sector && <span className="chip">{labelFor(SECTORS, other.sector)}</span>}
                  {other.stage && <span className="chip">{labelFor(STAGES, other.stage)}</span>}
                  {other.fundraising_status === "actively_raising" && <span className="chip chip-gold">Raising</span>}
                </>
              ) : (
                <>
                  {other.investor_type && <span className="chip">{labelFor(INVESTOR_TYPES, other.investor_type)}</span>}
                  {other.stages?.slice(0, 2).map(s => <span key={s} className="chip">{labelFor(STAGES, s)}</span>)}
                </>
              )}
              {other.location && (
                <span className="chip" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={9} /> {other.location}
                </span>
              )}
            </div>

            {/* Desc */}
            <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--color-muted-foreground)" }}>
              {isFounder ? other.description : other.thesis}
            </p>

            {/* Shared interests */}
            {shared.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                <Sparkles size={11} style={{ color: "var(--color-primary)" }} />
                {shared.join(" · ")}
              </div>
            )}
          </div>

          {/* Right: score */}
          <div className="mt-4 flex items-center gap-3 sm:mt-0 sm:flex-col sm:items-end sm:gap-1">
            <div>
              <div className="font-mono text-4xl font-bold tabular-nums text-right leading-none" style={{ color: matchColor(match) }}>
                {match}%
              </div>
              <div className="mono-label text-right mt-1">Match</div>
            </div>
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: "oklch(0.82 0.145 85 / 0.12)", color: "var(--color-primary)" }}
            >
              <Sparkles size={10} /> Top pick
            </span>
          </div>
        </div>
      </Link>
    );
  }

  /* ── Standard card ────────────────────────── */
  return (
    <Link
      to="/profile/$id"
      params={{ id: other.id }}
      className="group flex flex-col overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5 active:scale-[0.98]"
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderTopColor: isHigh ? "oklch(0.82 0.145 85 / 0.28)" : "var(--color-border)",
        boxShadow: isHigh ? "0 4px 24px -8px oklch(0.82 0.145 85 / 0.10)" : "none",
      }}
    >
      {/* Top section */}
      <div className="flex items-start justify-between p-5">
        {/* Avatar */}
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl font-display text-base font-bold shrink-0"
          style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
        >
          {getInitials(other.full_name)}
        </div>

        {/* Match score */}
        <div className="text-right">
          <div className="font-mono text-3xl font-bold tabular-nums leading-none" style={{ color: matchColor(match) }}>
            {match}%
          </div>
          <div className="mono-label mt-0.5">Match</div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 pb-5 flex flex-col">
        <h4 className="font-display text-base font-bold leading-tight">{other.full_name}</h4>
        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-muted-foreground)" }}>
          {isFounder
            ? `${other.company_name || "Founder"}${other.sector ? " · " + labelFor(SECTORS, other.sector) : ""}`
            : `${other.fund_name || "Investor"}${other.iRole ? " · " + other.iRole : ""}`}
        </p>

        {/* Location */}
        {other.location && (
          <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "var(--color-muted-foreground)", opacity: 0.65 }}>
            <MapPin size={9} /> {other.location}
          </p>
        )}

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1">
          {isFounder ? (
            <>
              {other.stage && <span className="chip">{labelFor(STAGES, other.stage)}</span>}
              {other.fundraising_status === "actively_raising" && <span className="chip chip-gold">Raising</span>}
            </>
          ) : (
            <>
              {other.investor_type && <span className="chip">{labelFor(INVESTOR_TYPES, other.investor_type)}</span>}
              {other.stages?.slice(0, 1).map(s => <span key={s} className="chip">{labelFor(STAGES, s)}</span>)}
            </>
          )}
        </div>

        {/* Description */}
        <p className="mt-3 text-xs leading-relaxed line-clamp-2 flex-1" style={{ color: "var(--color-muted-foreground)" }}>
          {isFounder ? other.description : other.thesis}
        </p>

        {/* Shared interests */}
        {shared.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            <Sparkles size={10} style={{ color: "var(--color-primary)" }} />
            {shared.slice(0, 2).join(" · ")}
            {shared.length > 2 && ` +${shared.length - 2}`}
          </div>
        )}

        {/* Divider + CTA */}
        <div
          className="mt-4 pt-4 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <span className="text-xs font-semibold transition-colors" style={{ color: "var(--color-primary)" }}>
            View profile →
          </span>
          <button
            onClick={e => { e.preventDefault(); onMessage?.(); }}
            className="text-xs font-medium transition-opacity hover:opacity-70 rounded-lg px-3 py-1.5"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}
          >
            Message
          </button>
        </div>
      </div>
    </Link>
  );
}
