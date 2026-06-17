import { createFileRoute, Link } from "@tanstack/react-router";
import { DISCOVERY_CATEGORIES } from "@/lib/catalyst";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Catalyst — Precision matching for founders and investors" },
      { name: "description", content: "A high-signal discovery platform connecting founders and investors through proprietary weighted matching." },
    ],
  }),
  component: Landing,
});

const WEIGHTS = [
  { label: "Sector Fit", value: 35 },
  { label: "Stage Fit", value: 20 },
  { label: "Check Size", value: 15 },
  { label: "Location", value: 10 },
  { label: "Interests", value: 10 },
  { label: "Goals", value: 10 },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="font-display text-lg font-extrabold tracking-tight italic">CATALYST</Link>
          <div className="hidden gap-6 md:flex">
            <a href="#how" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#sectors" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground">Sectors</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="rounded-full border border-border px-4 py-1.5 text-xs font-bold hover:bg-accent">Log in</Link>
            <Link to="/auth" search={{ mode: "signup" }} className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground">Get access</Link>
          </div>
        </div>
      </nav>

      <section className="px-6 pt-24 pb-20 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="mono-label">Catalyst · v1.0</span>
          <h1 className="font-display mt-6 text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
            The liquidity layer<br/>for human capital.
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-lg text-muted-foreground">
            A high-signal discovery platform connecting founders and investors through institutional-grade matching logic.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth" search={{ mode: "signup", role: "founder" }} className="rounded-lg bg-foreground px-8 py-4 text-sm font-bold text-background hover:opacity-90">
              Join as Founder
            </Link>
            <Link to="/auth" search={{ mode: "signup", role: "investor" }} className="rounded-lg border border-border bg-surface px-8 py-4 text-sm font-bold shadow-sm hover:border-foreground/30">
              Join as Investor
            </Link>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-border bg-surface-2/40 px-6 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 md:flex-row">
          <div className="flex-1">
            <span className="mono-label" style={{ color: "var(--color-primary)" }}>Algorithm v1.0</span>
            <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight">Precision matching by default.</h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Our weighted criteria removes the noise of networking. Every connection is calculated across six vectors for high-conviction fit.
            </p>
          </div>
          <div className="grid flex-[1.5] grid-cols-2 gap-px bg-border md:grid-cols-3">
            {WEIGHTS.map((w) => (
              <div key={w.label} className="bg-surface p-5">
                <div className="font-display text-3xl font-extrabold" style={{ color: w.value >= 20 ? "var(--color-primary)" : undefined }}>{w.value}%</div>
                <div className="mono-label mt-1">{w.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sectors" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-8 flex items-end justify-between">
          <h3 className="font-display text-2xl font-extrabold tracking-tight">Market Segments</h3>
          <span className="mono-label">{DISCOVERY_CATEGORIES.length} active pools</span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4 lg:grid-cols-5">
          {DISCOVERY_CATEGORIES.slice(0, 10).map((c) => (
            <div key={c.slug} className="tile tile-hover p-5">
              <div className="text-xs font-bold">{c.label}</div>
              <div className="mono-label mt-6">{c.kind === "sector" ? "Sector" : "Curated"}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-foreground px-6 py-20 text-background">
        <div className="mx-auto max-w-7xl">
          <h3 className="font-display text-3xl font-extrabold tracking-tight">Two sides of the same table.</h3>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-8">
              <span className="mono-label" style={{ color: "rgba(255,255,255,0.5)" }}>For Founders</span>
              <h4 className="font-display mt-3 text-2xl font-bold">Stop cold-emailing investors.</h4>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>· Get matched with investors who fund your sector and stage</li>
                <li>· Share decks and one-pagers directly through chat</li>
                <li>· Track who's reviewing your materials</li>
              </ul>
              <Link to="/auth" search={{ mode: "signup", role: "founder" }} className="mt-6 inline-block rounded-lg bg-background px-6 py-3 text-sm font-bold text-foreground">Join as Founder</Link>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-8">
              <span className="mono-label" style={{ color: "rgba(255,255,255,0.5)" }}>For Investors</span>
              <h4 className="font-display mt-3 text-2xl font-bold">High-signal dealflow.</h4>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>· See only founders matching your thesis</li>
                <li>· Browse by sector, stage, and check size</li>
                <li>· Request decks without the broker dance</li>
              </ul>
              <Link to="/auth" search={{ mode: "signup", role: "investor" }} className="mt-6 inline-block rounded-lg bg-background px-6 py-3 text-sm font-bold text-foreground">Join as Investor</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <span className="font-display block text-lg font-extrabold italic tracking-tight">CATALYST</span>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Catalyst is a matchmaking platform. It does not provide financial advice, does not guarantee investment, and does not act as a broker-dealer. All matching is based on user-provided profile data and algorithmic relevance scores. Private market investing involves significant risk.
            </p>
          </div>
          <div className="mono-label flex gap-12">
            <span>© 2026 Catalyst</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
