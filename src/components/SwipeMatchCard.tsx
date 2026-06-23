import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { MessageCircle, ArrowLeft, ArrowRight, MapPin } from "lucide-react";
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

function matchGradient(score: number) {
  if (score >= 75) return "linear-gradient(135deg, oklch(0.83 0.155 86) 0%, oklch(0.78 0.18 78) 100%)";
  if (score >= 50) return "linear-gradient(135deg, oklch(0.78 0.12 86) 0%, oklch(0.70 0.10 82) 100%)";
  return "linear-gradient(135deg, oklch(0.60 0.04 80) 0%, oklch(0.52 0.03 75) 100%)";
}

function matchGlow(score: number) {
  if (score >= 75) return "0 0 24px oklch(0.83 0.155 86 / 0.45), 0 0 48px oklch(0.83 0.155 86 / 0.15)";
  if (score >= 50) return "0 0 16px oklch(0.83 0.155 86 / 0.2)";
  return "none";
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

  const isHighMatch = match >= 75;

  return (
    <div
      className="absolute inset-0 flex flex-col rounded-3xl overflow-hidden select-none"
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderTopColor: isHighMatch ? "oklch(0.83 0.155 86 / 0.35)" : "var(--color-border)",
        boxShadow: isDragging
          ? `0 40px 80px -16px rgba(0,0,0,0.6), ${isHighMatch ? "0 0 40px oklch(0.83 0.155 86 / 0.12)" : ""}`
          : `0 12px 40px -8px rgba(0,0,0,0.4), ${isHighMatch ? "0 0 30px oklch(0.83 0.155 86 / 0.08)" : ""}`,
        transition: isDragging ? "none" : "box-shadow 0.3s ease",
        ...style,
      }}
    >
      {/* Top gradient strip for premium look */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          background: isHighMatch
            ? "linear-gradient(180deg, oklch(0.83 0.155 86 / 0.07) 0%, transparent 100%)"
            : "linear-gradient(180deg, oklch(0.83 0.155 86 / 0.03) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div className="flex-1 flex flex-col p-7 overflow-y-auto relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl font-display text-xl font-bold shrink-0"
            style={{
              background: "linear-gradient(135deg, oklch(0.83 0.155 86 / 0.18) 0%, oklch(0.83 0.155 86 / 0.06) 100%)",
              border: "1px solid oklch(0.83 0.155 86 / 0.22)",
              color: "var(--color-primary)",
            }}
          >
            {getInitials(other.full_name || "?")}
          </div>

          {/* Match score */}
          <div className="text-right">
            <div
              className="font-display text-5xl font-extrabold leading-none tabular-nums"
              style={{
                background: matchGradient(match),
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: isHighMatch ? "drop-shadow(0 0 12px oklch(0.83 0.155 86 / 0.5))" : "none",
              }}
            >
              {match}%
            </div>
            <div className="mono-label mt-1">Match</div>
          </div>
        </div>

        {/* Name & subtitle */}
        <div>
          <h3 className="font-display text-2xl font-bold leading-tight">{other.full_name || "Unnamed"}</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            {isFounder
              ? `${other.company_name || "Founder"}${other.sector ? " · " + labelFor(SECTORS, other.sector) : ""}`
              : `${other.fund_name || "Investor"}${other.iRole ? " · " + other.iRole : ""}`}
          </p>
          {other.location && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} style={{ color: "var(--color-muted-foreground)", opacity: 0.6 }} />
              <span className="text-xs" style={{ color: "var(--color-muted-foreground)", opacity: 0.7 }}>
                {other.location}
              </span>
            </div>
          )}
        </div>

        {/* Chips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {isFounder ? (
            <>
              {other.stage && <span className="chip chip-neutral">{labelFor(STAGES, other.stage)}</span>}
              {other.fundraising_status === "actively_raising" && (
                <span className="chip">Raising</span>
              )}
            </>
          ) : (
            <>
              {other.investor_type && <span className="chip chip-neutral">{labelFor(INVESTOR_TYPES, other.investor_type)}</span>}
              {other.stages?.slice(0, 2).map((s) => (
                <span key={s} className="chip chip-neutral">{labelFor(STAGES, s)}</span>
              ))}
            </>
          )}
        </div>

        {/* Description / thesis */}
        <p className="mt-5 text-sm leading-relaxed line-clamp-3" style={{ color: "var(--color-muted-foreground)" }}>
          {isFounder ? other.description : other.thesis}
        </p>

        {/* Shared interests */}
        {shared.length > 0 && (
          <div
            className="mt-5 rounded-2xl p-4"
            style={{
              background: "linear-gradient(135deg, oklch(0.83 0.155 86 / 0.08) 0%, oklch(0.83 0.155 86 / 0.04) 100%)",
              border: "1px solid oklch(0.83 0.155 86 / 0.14)",
            }}
          >
            <span className="mono-label" style={{ opacity: 0.7 }}>In common</span>
            <p className="mt-1.5 text-sm font-medium" style={{ color: "var(--color-primary)" }}>
              {shared.join(" · ")}
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div
        className="flex gap-3 px-6 py-5 relative z-10"
        style={{ borderTop: "1px solid var(--color-border)" }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Link
          to="/profile/$id"
          params={{ id: other.id }}
          className="flex-1 rounded-2xl py-3 text-center text-sm font-bold transition-opacity hover:opacity-85"
          style={{
            background: "linear-gradient(135deg, var(--color-primary) 0%, oklch(0.75 0.18 78) 100%)",
            color: "var(--color-primary-foreground)",
            boxShadow: "0 4px 16px oklch(0.83 0.155 86 / 0.3)",
          }}
        >
          View profile
        </Link>
        <button
          onClick={handleMessage}
          className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-colors hover:bg-white/5"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <MessageCircle size={15} />
          Message
        </button>
      </div>
    </div>
  );
}

export function SwipeMatchCard({ matches }: { matches: MatchEntry[] }) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

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
        setDragX(0); setDragY(0); setExitDir(null);
      }, 260);
    } else if (dragX > SWIPE_THRESHOLD && canGoBack) {
      setExitDir("right");
      setTimeout(() => {
        setIndex((i) => i - 1);
        setDragX(0); setDragY(0); setExitDir(null);
      }, 260);
    } else {
      setDragX(0); setDragY(0);
    }
    pointerStart.current = null;
  }

  const rotation = (dragX / 300) * 12;
  const dragProgress = Math.min(1, Math.abs(dragX) / SWIPE_THRESHOLD);
  const nextScale = 0.94 + dragProgress * 0.06;
  const nextTranslateY = 14 - dragProgress * 14;

  let topCardStyle: React.CSSProperties = {
    transform: "translateX(0) rotate(0deg)",
    transition: "transform 0.35s cubic-bezier(0.34,1.15,0.64,1)",
    zIndex: 10,
    cursor: "grab",
  };

  if (isDragging && pointerStart.current) {
    topCardStyle = {
      transform: `translateX(${dragX}px) translateY(${dragY * 0.25}px) rotate(${rotation}deg)`,
      transition: "none",
      zIndex: 10,
      cursor: "grabbing",
    };
  } else if (exitDir === "left") {
    topCardStyle = {
      transform: "translateX(-150%) rotate(-22deg)",
      transition: "transform 0.28s ease-in",
      zIndex: 10,
    };
  } else if (exitDir === "right") {
    topCardStyle = {
      transform: "translateX(150%) rotate(22deg)",
      transition: "transform 0.28s ease-in",
      zIndex: 10,
    };
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="relative w-full"
        style={{ height: 560, maxWidth: 440, touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Third card (deep) */}
        {matches[index + 2] && (
          <div
            className="absolute inset-0"
            style={{
              transform: "scale(0.87) translateY(28px)",
              zIndex: 1,
              transformOrigin: "bottom center",
              opacity: 0.45,
              pointerEvents: "none",
            }}
          >
            <CardFace entry={matches[index + 2]} />
          </div>
        )}

        {/* Second card */}
        {next && (
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${nextScale}) translateY(${nextTranslateY}px)`,
              transition: isDragging ? "none" : "transform 0.35s ease",
              zIndex: 5,
              transformOrigin: "bottom center",
              pointerEvents: "none",
            }}
          >
            <CardFace entry={next} />
          </div>
        )}

        {/* Top card */}
        <div className="absolute inset-0" style={topCardStyle}>
          {/* Swipe hint overlays */}
          {isDragging && (
            <>
              {dragX > 30 && (
                <div
                  className="absolute top-7 left-7 rounded-xl px-3 py-1.5 text-xs font-bold z-20 pointer-events-none"
                  style={{
                    background: "oklch(0.83 0.155 86 / 0.15)",
                    color: "var(--color-primary)",
                    border: "1.5px solid var(--color-primary)",
                    opacity: Math.min(1, dragX / 70),
                  }}
                >
                  ← Back
                </div>
              )}
              {dragX < -30 && (
                <div
                  className="absolute top-7 right-7 rounded-xl px-3 py-1.5 text-xs font-bold z-20 pointer-events-none"
                  style={{
                    background: "oklch(0.83 0.155 86 / 0.15)",
                    color: "var(--color-primary)",
                    border: "1.5px solid var(--color-primary)",
                    opacity: Math.min(1, Math.abs(dragX) / 70),
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

      {/* Controls */}
      <div className="mt-6 flex items-center gap-5">
        <button
          onClick={() => canGoBack && setIndex((i) => i - 1)}
          disabled={!canGoBack}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all"
          style={{
            border: "1px solid var(--color-border)",
            opacity: canGoBack ? 1 : 0.25,
            color: canGoBack ? "var(--color-primary)" : "var(--color-muted-foreground)",
          }}
        >
          <ArrowLeft size={15} />
        </button>

        {/* Dot indicators */}
        <div className="flex gap-2 items-center">
          {matches.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="rounded-full transition-all"
              style={{
                width: i === index ? 22 : 6,
                height: 6,
                background: i === index ? "var(--color-primary)" : "var(--color-border)",
                boxShadow: i === index ? "0 0 8px oklch(0.83 0.155 86 / 0.5)" : "none",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => canGoForward && setIndex((i) => i + 1)}
          disabled={!canGoForward}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all"
          style={{
            border: "1px solid var(--color-border)",
            opacity: canGoForward ? 1 : 0.25,
            color: canGoForward ? "var(--color-primary)" : "var(--color-muted-foreground)",
          }}
        >
          <ArrowRight size={15} />
        </button>
      </div>

      <p className="mt-3 mono-label opacity-40">
        {index + 1} / {matches.length} · swipe or tap arrows
      </p>
    </div>
  );
}
