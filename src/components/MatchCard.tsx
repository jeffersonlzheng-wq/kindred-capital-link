import { Link } from "@tanstack/react-router";
import { labelFor, SECTORS, STAGES, sharedInterests, INVESTOR_TYPES } from "@/lib/catalyst";

type Other = {
  id: string;
  full_name: string;
  role: "founder" | "investor" | null;
  location: string | null;
  // founder
  company_name?: string;
  sector?: string | null;
  stage?: string | null;
  description?: string | null;
  fInterests?: string[];
  fundraising_status?: string | null;
  // investor
  fund_name?: string;
  iRole?: string | null;
  investor_type?: string | null;
  sectors?: string[];
  stages?: string[];
  thesis?: string | null;
  iInterests?: string[];
};

export function MatchCard({
  other,
  match,
  myInterests = [],
  onMessage,
}: {
  other: Other;
  match: number;
  myInterests?: string[];
  onMessage?: () => void;
}) {
  const isFounder = other.role === "founder";
  const interestsOther = isFounder ? other.fInterests : other.iInterests;
  const shared = sharedInterests(myInterests, interestsOther);

  return (
    <div className="tile flex flex-col rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 font-display text-lg font-bold text-primary">
          {(other.full_name || "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="text-right">
          <div className="font-display text-3xl font-extrabold leading-none" style={{ color: match >= 70 ? "var(--color-match)" : "var(--color-primary)" }}>
            {match}%
          </div>
          <div className="mono-label mt-1">Match</div>
        </div>
      </div>

      <div className="mt-5">
        <h4 className="font-display text-lg font-bold">{other.full_name || "Unnamed"}</h4>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {isFounder
            ? `${other.company_name || "Founder"}${other.sector ? " · " + labelFor(SECTORS, other.sector) : ""}`
            : `${other.fund_name || "Investor"}${other.iRole ? " · " + other.iRole : ""}`}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {isFounder ? (
            <>
              {other.stage && <span className="chip">{labelFor(STAGES, other.stage)}</span>}
              {other.fundraising_status === "actively_raising" && <span className="chip" style={{ background: "color-mix(in oklab, var(--color-match) 18%, transparent)", color: "var(--color-match)" }}>Raising</span>}
            </>
          ) : (
            <>
              {other.investor_type && <span className="chip">{labelFor(INVESTOR_TYPES, other.investor_type)}</span>}
              {other.stages?.slice(0, 2).map(s => <span key={s} className="chip">{labelFor(STAGES, s)}</span>)}
            </>
          )}
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
        {isFounder ? other.description : other.thesis}
      </p>

      {shared.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <span className="mono-label">Shared interests</span>
          <p className="mt-1 text-xs">{shared.join(", ")}</p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link to="/profile/$id" params={{ id: other.id }} className="rounded-md bg-foreground py-2 text-center text-xs font-bold text-background">
          View profile
        </Link>
        <button onClick={onMessage} className="rounded-md border border-border py-2 text-xs font-bold hover:bg-accent">
          Message
        </button>
      </div>
    </div>
  );
}
