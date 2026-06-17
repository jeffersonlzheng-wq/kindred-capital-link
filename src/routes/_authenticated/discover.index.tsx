import { createFileRoute, Link } from "@tanstack/react-router";
import { DISCOVERY_CATEGORIES } from "@/lib/catalyst";
import { useAuth } from "@/lib/auth";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/discover/")({
  component: Discover,
});

function Discover() {
  const { profile } = useAuth();
  const categories = DISCOVERY_CATEGORIES.filter((c) => {
    if (profile?.role === "founder" && c.slug === "trending-founders") return false;
    if (profile?.role === "investor" && c.slug === "active-investors") return false;
    return true;
  });

  const sectors = categories.filter((c) => c.kind === "sector");
  const curated = categories.filter((c) => c.kind !== "sector");
  const serif = { fontFamily: "Playfair Display, serif" } as const;

  return (
    <div className="flex flex-col gap-3">
      {/* Editorial header */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <div className="h-px w-5 bg-primary" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-primary">Collections</span>
        </div>
        <h1 style={serif} className="text-2xl italic text-foreground">Discover</h1>
      </div>

      {/* Hero — All */}
      <Link
        to="/discover/$category"
        params={{ category: "all" }}
        className="group relative flex h-14 items-center justify-between overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-card to-background px-4 transition-transform active:scale-[0.98]"
      >
        <div style={serif} className="pointer-events-none absolute right-3 top-0 select-none text-3xl italic text-primary/10">
          01
        </div>
        <div className="relative">
          <p className="text-[9px] font-medium uppercase tracking-widest text-primary">Comprehensive</p>
          <h3 style={serif} className="text-base text-foreground">All Sectors</h3>
        </div>
        <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40">
          <ArrowRight className="h-3.5 w-3.5 text-primary" />
        </div>
      </Link>

      {/* Curated row */}
      <div>
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Curated</p>
        <div className="grid grid-cols-2 gap-2">
          {curated.map((c) => (
            <Link
              key={c.slug}
              to="/discover/$category"
              params={{ category: c.slug }}
              className="group relative flex h-12 items-center overflow-hidden rounded-lg border border-border bg-card px-3 transition-all active:scale-[0.98] hover:border-primary/40"
            >
              <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 rounded-full bg-primary/10 blur-2xl" />
              <h3 style={serif} className="relative text-sm leading-tight text-foreground">{c.label}</h3>
            </Link>
          ))}
        </div>
      </div>

      {/* Sectors grid */}
      <div>
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Sectors</p>
        <div className="grid grid-cols-3 gap-1.5">
          {sectors.map((c) => (
            <Link
              key={c.slug}
              to="/discover/$category"
              params={{ category: c.slug }}
              className="flex h-10 items-center justify-center rounded-lg border border-border bg-card px-2 text-center text-[11px] font-medium leading-tight text-foreground transition-all active:scale-[0.98] hover:border-primary/40"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
