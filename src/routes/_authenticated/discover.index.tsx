import { createFileRoute, Link } from "@tanstack/react-router";
import { DISCOVERY_CATEGORIES, SECTORS } from "@/lib/catalyst";
import { useAuth } from "@/lib/auth";
import {
  Zap, TrendingUp, Clock, Star, Rocket,
  Cpu, DollarSign, Heart, Leaf, Building2, ShoppingBag,
  GraduationCap, Store, FlaskConical, Layers, Globe,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/discover/")({
  component: Discover,
});

const SECTOR_ICONS: Record<string, React.ReactNode> = {
  saas:        <Layers size={13} />,
  fintech:     <DollarSign size={13} />,
  health_tech: <Heart size={13} />,
  ai:          <Cpu size={13} />,
  consumer:    <Star size={13} />,
  climate:     <Leaf size={13} />,
  real_estate: <Building2 size={13} />,
  marketplace: <Store size={13} />,
  education:   <GraduationCap size={13} />,
  ecommerce:   <ShoppingBag size={13} />,
  biotech:     <FlaskConical size={13} />,
  deeptech:    <Globe size={13} />,
};

const META_CONFIG: Record<string, { icon: React.ReactNode; desc: string }> = {
  "high-match":        { icon: <Star size={14} />,       desc: "≥ 70% compatibility" },
  "raising-now":       { icon: <Rocket size={14} />,     desc: "Actively fundraising" },
  "new-this-week":     { icon: <Clock size={14} />,      desc: "Joined in last 7 days" },
  "trending-founders": { icon: <TrendingUp size={14} />, desc: "Most interest right now" },
  "active-investors":  { icon: <Zap size={14} />,        desc: "Reviewing deals now" },
};

function Discover() {
  const { profile } = useAuth();
  const sectors = SECTORS.filter(s => s.value !== "other");

  const visibleMeta = ["high-match", "raising-now", "new-this-week", "trending-founders", "active-investors"].filter(slug => {
    if (profile?.role === "founder" && slug === "trending-founders") return false;
    if (profile?.role === "investor" && slug === "active-investors") return false;
    return true;
  });

  return (
    /* Fixed height = viewport minus shell chrome (header 56px + main padding 32px top + 112px bottom + bottom-nav 56px) */
    <div
      className="flex flex-col gap-3 overflow-hidden"
      style={{ height: "calc(100dvh - 16rem)" }}
    >

      {/* ── Header + Hero row ──────────────────────── */}
      <div className="flex items-stretch gap-3 shrink-0">
        {/* Page title */}
        <div className="flex flex-col justify-center min-w-0">
          <p className="mono-label">Discovery</p>
          <h1 className="font-display text-xl font-extrabold leading-tight tracking-tight">
            Find your next<br />
            <span style={{ color: "var(--color-primary)" }}>connection.</span>
          </h1>
        </div>

        {/* Hero: All Sectors — pushed to the right */}
        <Link
          to="/discover/$category"
          params={{ category: "all" }}
          className="group relative ml-auto flex shrink-0 flex-col justify-end overflow-hidden rounded-xl p-4 transition-transform active:scale-[0.97]"
          style={{
            width: 160,
            background: "linear-gradient(135deg, oklch(0.17 0.022 65) 0%, oklch(0.12 0.010 55) 100%)",
            border: "1px solid oklch(0.82 0.145 85 / 0.22)",
            boxShadow: "0 0 40px -12px oklch(0.82 0.145 85 / 0.20)",
          }}
        >
          {/* Decorative rings */}
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full"
            style={{ border: "1px solid oklch(0.82 0.145 85 / 0.12)" }} />
          <div className="pointer-events-none absolute -right-1 -top-1 h-12 w-12 rounded-full"
            style={{ border: "1px solid oklch(0.82 0.145 85 / 0.18)" }} />
          <p className="mono-label mb-0.5" style={{ color: "var(--color-primary)" }}>All sectors</p>
          <p className="text-xs font-bold text-foreground leading-tight">Browse everyone →</p>
        </Link>
      </div>

      {/* ── Curated collections ───────────────────── */}
      <div className="shrink-0">
        <p className="mono-label mb-2">Curated</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visibleMeta.map(slug => {
            const conf = META_CONFIG[slug];
            const cat = DISCOVERY_CATEGORIES.find(c => c.slug === slug);
            if (!cat || !conf) return null;
            return (
              <Link
                key={slug}
                to="/discover/$category"
                params={{ category: slug }}
                className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all active:scale-[0.97] hover:border-primary/40"
                style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: "oklch(0.82 0.145 85 / 0.10)",
                    border: "1px solid oklch(0.82 0.145 85 / 0.20)",
                    color: "var(--color-primary)",
                  }}
                >
                  {conf.icon}
                </div>
                <div>
                  <p className="text-xs font-bold leading-snug">{cat.label}</p>
                  <p className="text-[10px] leading-snug" style={{ color: "var(--color-muted-foreground)" }}>
                    {conf.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Sectors — fills remaining height ─────── */}
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="mono-label mb-2 shrink-0">Sectors</p>
        <div className="grid grid-cols-3 gap-1.5 content-start sm:grid-cols-4">
          {sectors.map(s => (
            <Link
              key={s.value}
              to="/discover/$category"
              params={{ category: s.value }}
              className="group flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-center transition-all active:scale-[0.96] hover:border-primary/30"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: "oklch(0.82 0.145 85 / 0.08)",
                  color: "var(--color-primary)",
                  border: "1px solid oklch(0.82 0.145 85 / 0.12)",
                }}
              >
                {SECTOR_ICONS[s.value] ?? <Globe size={13} />}
              </span>
              <span className="text-[11px] font-semibold leading-tight">{s.label}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
