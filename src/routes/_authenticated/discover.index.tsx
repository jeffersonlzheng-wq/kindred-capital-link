import { createFileRoute, Link } from "@tanstack/react-router";
import { DISCOVERY_CATEGORIES, SECTORS } from "@/lib/catalyst";
import { useAuth } from "@/lib/auth";
import {
  Zap, TrendingUp, Clock, Star, Users, Rocket,
  Cpu, DollarSign, Heart, Leaf, Building2, ShoppingBag,
  GraduationCap, Store, FlaskConical, Layers, Globe,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/discover/")({
  component: Discover,
});

const SECTOR_ICONS: Record<string, React.ReactNode> = {
  saas:        <Layers size={16} />,
  fintech:     <DollarSign size={16} />,
  health_tech: <Heart size={16} />,
  ai:          <Cpu size={16} />,
  consumer:    <Users size={16} />,
  climate:     <Leaf size={16} />,
  real_estate: <Building2 size={16} />,
  marketplace: <Store size={16} />,
  education:   <GraduationCap size={16} />,
  ecommerce:   <ShoppingBag size={16} />,
  biotech:     <FlaskConical size={16} />,
  deeptech:    <Globe size={16} />,
};

const META_CONFIG: Record<string, { icon: React.ReactNode; desc: string; accent: string }> = {
  "high-match":        { icon: <Star size={20} />,      desc: "Profiles scoring ≥ 70% compatibility with you",  accent: "oklch(0.82 0.145 85)" },
  "raising-now":       { icon: <Rocket size={20} />,    desc: "Founders actively fundraising right now",         accent: "oklch(0.82 0.145 85)" },
  "new-this-week":     { icon: <Clock size={20} />,     desc: "Joined in the last 7 days",                       accent: "oklch(0.82 0.145 85)" },
  "trending-founders": { icon: <TrendingUp size={20} />,desc: "Founders generating the most interest",           accent: "oklch(0.82 0.145 85)" },
  "active-investors":  { icon: <Zap size={20} />,       desc: "Investors actively reviewing deals",              accent: "oklch(0.82 0.145 85)" },
};

function Discover() {
  const { profile } = useAuth();

  const sectors = SECTORS.filter(s => s.value !== "other");
  const metaSlugs = ["high-match", "raising-now", "new-this-week", "trending-founders", "active-investors"];
  const visibleMeta = metaSlugs
    .filter(slug => {
      if (profile?.role === "founder" && slug === "trending-founders") return false;
      if (profile?.role === "investor" && slug === "active-investors") return false;
      return true;
    });

  return (
    <div className="space-y-10">

      {/* ── Page header ────────────────────────────── */}
      <div>
        <p className="mono-label mb-2">Discovery</p>
        <h1 className="font-display text-3xl font-extrabold leading-none tracking-tight">
          Find your next<br />
          <span style={{ color: "var(--color-primary)" }}>connection.</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)", maxWidth: 360 }}>
          Browse by sector, filter by stage, or let the algorithm surface your highest-value matches.
        </p>
      </div>

      {/* ── Hero: All Sectors ───────────────────────── */}
      <Link
        to="/discover/$category"
        params={{ category: "all" }}
        className="group relative flex items-end overflow-hidden rounded-2xl p-6 transition-transform active:scale-[0.99]"
        style={{
          minHeight: 160,
          background: "linear-gradient(135deg, oklch(0.17 0.022 65) 0%, oklch(0.12 0.010 55) 100%)",
          border: "1px solid oklch(0.82 0.145 85 / 0.22)",
          boxShadow: "0 0 80px -20px oklch(0.82 0.145 85 / 0.18)",
        }}
      >
        {/* decorative rings */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full"
          style={{ border: "1px solid oklch(0.82 0.145 85 / 0.10)" }} />
        <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full"
          style={{ border: "1px solid oklch(0.82 0.145 85 / 0.15)" }} />
        <div className="pointer-events-none absolute right-6 top-6 h-10 w-10 rounded-full"
          style={{ background: "oklch(0.82 0.145 85 / 0.12)" }} />

        <div className="relative">
          <p className="mono-label mb-2" style={{ color: "var(--color-primary)" }}>Comprehensive</p>
          <h2 className="font-display text-2xl font-extrabold leading-none">All Sectors</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Every founder and investor on the platform
          </p>
          <div
            className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors group-hover:opacity-90"
            style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
          >
            Browse all →
          </div>
        </div>
      </Link>

      {/* ── Curated collections ─────────────────────── */}
      <div>
        <p className="mono-label mb-4">Curated</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleMeta.map(slug => {
            const conf = META_CONFIG[slug];
            const cat = DISCOVERY_CATEGORIES.find(c => c.slug === slug);
            if (!cat || !conf) return null;
            return (
              <Link
                key={slug}
                to="/discover/$category"
                params={{ category: slug }}
                className="group relative flex items-center gap-4 overflow-hidden rounded-xl p-4 transition-all active:scale-[0.98] hover:border-primary/40"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {/* gold icon circle */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors group-hover:opacity-90"
                  style={{
                    background: "oklch(0.82 0.145 85 / 0.12)",
                    border: "1px solid oklch(0.82 0.145 85 / 0.22)",
                    color: "var(--color-primary)",
                  }}
                >
                  {conf.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight">{cat.label}</p>
                  <p className="mt-0.5 truncate text-xs leading-tight" style={{ color: "var(--color-muted-foreground)" }}>
                    {conf.desc}
                  </p>
                </div>
                <div className="ml-auto shrink-0 opacity-30 transition-opacity group-hover:opacity-60" style={{ color: "var(--color-primary)" }}>
                  →
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Sectors ─────────────────────────────────── */}
      <div>
        <p className="mono-label mb-4">Sectors</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {sectors.map(s => (
            <Link
              key={s.value}
              to="/discover/$category"
              params={{ category: s.value }}
              className="group flex items-center gap-2.5 rounded-xl px-3 py-3 transition-all active:scale-[0.97] hover:border-primary/30"
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs"
                style={{
                  background: "oklch(0.82 0.145 85 / 0.08)",
                  color: "var(--color-primary)",
                  border: "1px solid oklch(0.82 0.145 85 / 0.12)",
                }}
              >
                {SECTOR_ICONS[s.value] ?? <Globe size={14} />}
              </span>
              <span className="text-sm font-medium leading-tight">{s.label}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
