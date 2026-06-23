import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { MessageCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { labelFor, SECTORS, STAGES, sharedInterests, INVESTOR_TYPES } from "@/lib/catalyst";

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

type MatchEntry = {
  other: Other;
  match: number;
  myInterests: string[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function matchColor(score: number) {
  if (score >= 70) return "var(--color-match)";
  if (score >= 45) return "var(--color-primary)";
  return "var(--color-muted-foreground)";
}

function CardFace({ entry, style, isDragging }: { entry: MatchEntry; style?: React.CSSProperties; isDragging?: boolean }) {
  const { other, match, myInterests } = entry;
  const isFounder = other.role === "founder";
  const shared = sharedInterests(myInterests, isFounder ? other.fInterests : other.iInterests);
  const navigate = useNavigate();

  function handleMessage(e: React.MouseEvent) {
    e.stopPropagation();
    navigate({ to: "/messages" });
  }

  return (
    <div
      className="absolute inset-0 flex flex-col rounded-2xl overflow-hidden select-none"
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        boxShadow: isDragging
          ? "0 32px 64px -12px rgba(0,0,0,0.35)"
          : "0 8px 32px -8px rgba(0,0,0,0.2)",
        transition: isDragging ? "none" : "box-shadow 0.2s ease",
        ...style,
      }}
    >
      <div className="flex-1 flex flex-col p-7 overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-xl font-display text-xl font-bold"
            style={{ background: "color-mix(in oklab, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}
          >
            {getInitials(other.full_name || "?")}
          </div>
          <div className="text-right">
            <div
              className="font-display text-5xl font-extrabold leading-none tabular-nums"
              style={{ color: matchColor(match) }}
            >
              {match}%
            </div>
            <div className="mono-label mt-1 opacity-60">Match</div>
          </div>
        </div>

        <div>
          <h3 className="font-display text-2xl font-bold leading-tight">{other.full_name || "Unnamed"}</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            {isFounder
              ? `${other.company_name || "Founder"}${other.sector ? " · " + labelFor(SECTORS, other.sector) : ""}`
              : `${other.fund_name || "Investor"}${other.iRole ? " · " + other.iRole : ""}`}
          </p>
          {other.location && (
            <p className="mt-0.5 text-xs" style={{ color: "var(--color-muted-foreground)", opacity: 0.7 }}>
              {other.location}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {isFounder ? (
            <>
              {other.stage && <span className="chip">{labelFor(STAGES, other.stage)}</span>}
              {other.fundraising_status === "actively_raising" && (
                <span
                  className="chip"
                  style={{
                    background: "color-mix(in oklab, var(--color-match) 18%, transparent)",
                    color: "var(--color-match)",
                  }}
                >
                  Raising
                </span>
              )}
            </>
          ) : (
            <>
              {other.investor_type && <span className="chip">{labelFor(INVESTOR_TYPES, other.investor_type)}</span>}
              {other.stages?.slice(0, 2).map((s) => (
                <span key={s} className="chip">{labelFor(STAGES, s)}</span>
              ))}
            </>
          )}
        </div>

        <p className="mt-5 text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
          {isFounder ? other.description : other.thesis}
        </p>

        {shared.length > 0 && (
          <div
            className="mt-5 rounded-xl p-4"
            style={{ background: "color-mix(in oklab, var(--color-primary) 8%, transparent)" }}
          >
            <span className="mono-label" style={{ opacity: 0.7 }}>Shared interests</span>
            <p className="mt-1 text-sm font-medium">{shared.join(" · ")}</p>
          </div>
        )}
      </div>

      <div
        className="flex gap-3 px-7 py-5"
        style={{ borderTop: "1px solid var(--color-border)" }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Link
          to="/profile/$id"
          params={{ id: other.id }}
          className="flex-1 rounded-xl py-3 text-center text-sm font-bold"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
        >
          View profile
        </Link>
        <button
          onClick={handleMessage}
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <MessageCircle size={15} />
          Message
        </button>
      </div>
    </div>
  );
}

export function SwipeMatchCard({
  matches,
}: {
  matches: MatchEntry[];
}) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (matches.length === 0) return null;

  const current = matches[index];
  const next = matches[index + 1];
  const canGoBack = index > 0;
  const canGoForward = index < matches.length - 1;

  const SWIPE_THRESHOLD = 100;

  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("a, button")) return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointerStart.current || !isDragging) return;
    setDragX(e.clientX - pointerStart.current.x);
    setDragY(e.clientY - pointerStart.current.y);
  }

  function onPointerUp() {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX < -SWIPE_THRESHOLD && canGoForward) {
      setExitDir("left");
      setTimeout(() => {
        setIndex((i) => i + 1);
        setDragX(0);
        setDragY(0);
        setExitDir(null);
      }, 260);
    } else if (dragX > SWIPE_THRESHOLD && canGoBack) {
      setExitDir("right");
      setTimeout(() => {
        setIndex((i) => i - 1);
        setDragX(0);
        setDragY(0);
        setExitDir(null);
      }, 260);
    } else {
      setDragX(0);
      setDragY(0);
    }
    pointerStart.current = null;
  }

  const rotation = (dragX / 300) * 12;

  let topCardStyle: React.CSSProperties = {
    transform: "translateX(0) rotate(0deg)",
    transition: "transform 0.3s cubic-bezier(0.34,1.2,0.64,1)",
    zIndex: 10,
    cursor: "grab",
  };

  if (isDragging && pointerStart.current) {
    topCardStyle = {
      transform: `translateX(${dragX}px) translateY(${dragY * 0.3}px) rotate(${rotation}deg)`,
      transition: "none",
      zIndex: 10,
      cursor: "grabbing",
    };
  } else if (exitDir === "left") {
    topCardStyle = {
      transform: "translateX(-140%) rotate(-20deg)",
      transition: "transform 0.26s ease-in",
      zIndex: 10,
    };
  } else if (exitDir === "right") {
    topCardStyle = {
      transform: "translateX(140%) rotate(20deg)",
      transition: "transform 0.26s ease-in",
      zIndex: 10,
    };
  }

  const dragProgress = Math.min(1, Math.abs(dragX) / SWIPE_THRESHOLD);
  const nextScale = 0.94 + dragProgress * 0.06;
  const nextTranslateY = 12 - dragProgress * 12;

  return (
    <div className="flex flex-col items-center w-full">
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: 540, maxWidth: 440, touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {next && (
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${nextScale}) translateY(${nextTranslateY}px)`,
              transition: isDragging ? "none" : "transform 0.3s ease",
              zIndex: 5,
              transformOrigin: "bottom center",
            }}
          >
            <CardFace entry={next} />
          </div>
        )}

        {matches[index + 2] && (
          <div
            className="absolute inset-0"
            style={{
              transform: "scale(0.88) translateY(24px)",
              zIndex: 1,
              transformOrigin: "bottom center",
              opacity: 0.5,
            }}
          >
            <CardFace entry={matches[index + 2]} />
          </div>
        )}

        <div className="absolute inset-0" style={topCardStyle}>
          {isDragging && (
            <>
              {dragX > 30 && (
                <div
                  className="absolute top-8 left-8 rounded-xl px-3 py-1.5 text-sm font-bold z-20"
                  style={{
                    background: "color-mix(in oklab, var(--color-match) 20%, transparent)",
                    color: "var(--color-match)",
                    border: "2px solid var(--color-match)",
                    opacity: Math.min(1, dragX / 80),
                  }}
                >
                  ← Back
                </div>
              )}
              {dragX < -30 && (
                <div
                  className="absolute top-8 right-8 rounded-xl px-3 py-1.5 text-sm font-bold z-20"
                  style={{
                    background: "color-mix(in oklab, var(--color-primary) 15%, transparent)",
                    color: "var(--color-primary)",
                    border: "2px solid var(--color-primary)",
                    opacity: Math.min(1, Math.abs(dragX) / 80),
                  }}
                >
                  Next →
                </div>
              )}
            </>
          )}
          <CardFace entry={current} isDragging={isDragging} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={() => canGoBack && setIndex((i) => i - 1)}
          disabled={!canGoBack}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity"
          style={{
            border: "1px solid var(--color-border)",
            opacity: canGoBack ? 1 : 0.3,
          }}
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex gap-1.5">
          {matches.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="rounded-full transition-all"
              style={{
                width: i === index ? 20 : 6,
                height: 6,
                background: i === index ? "var(--color-primary)" : "var(--color-border)",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => canGoForward && setIndex((i) => i + 1)}
          disabled={!canGoForward}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity"
          style={{
            border: "1px solid var(--color-border)",
            opacity: canGoForward ? 1 : 0.3,
          }}
        >
          <ArrowRight size={16} />
        </button>
      </div>

      <p className="mt-3 text-xs" style={{ color: "var(--color-muted-foreground)", opacity: 0.6 }}>
        {index + 1} of {matches.length} · Swipe or use arrows
      </p>
    </div>
  );
}
