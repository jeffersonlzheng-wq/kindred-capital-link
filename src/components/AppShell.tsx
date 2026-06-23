import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { type ReactNode } from "react";
import { LayoutDashboard, Compass, MessageSquare, FileText, Gift, Shield } from "lucide-react";

const NAV = [
  { to: "/dashboard",  label: "Dashboard", Icon: LayoutDashboard },
  { to: "/discover",   label: "Discover",  Icon: Compass },
  { to: "/messages",   label: "Messages",  Icon: MessageSquare },
  { to: "/documents",  label: "Documents", Icon: FileText },
  { to: "/referrals",  label: "Referrals", Icon: Gift },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const items = [
    ...NAV,
    ...(isAdmin ? [{ to: "/admin" as const, label: "Admin", Icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "oklch(0.10 0.005 55 / 0.92)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link
            to="/dashboard"
            className="font-display text-base font-extrabold italic tracking-tight"
            style={{ color: "var(--color-primary)" }}
          >
            CATALYST
          </Link>

          <div className="flex items-center gap-4">
            <span className="mono-label hidden md:inline">{profile?.role ?? "—"}</span>

            <Link
              to={profile ? "/profile/$id" : "/dashboard"}
              params={{ id: profile?.id ?? "" }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0"
              style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
            >
              {(profile?.full_name || profile?.email || "?").slice(0, 1).toUpperCase()}
            </Link>

            <button
              onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              className="text-xs font-semibold transition-opacity hover:opacity-60 hidden sm:inline"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      {/* pb-24 ensures content never hides behind the bottom nav */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-28">
        {children}
      </main>

      {/* ── Bottom nav (all screen sizes) ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: "oklch(0.10 0.005 55 / 0.94)",
          backdropFilter: "blur(18px)",
          borderTop: "1px solid var(--color-border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <ul className="mx-auto flex max-w-7xl items-center justify-around px-2">
          {items.map(({ to, label, Icon }) => {
            const active = path === to || path.startsWith(to + "/");
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  aria-label={label}
                  title={label}
                  className="flex h-14 flex-col items-center justify-center gap-0.5 transition-colors"
                  style={{ color: active ? "var(--color-primary)" : "var(--color-muted-foreground)" }}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  {/* Gold underline dot */}
                  <span
                    className="rounded-full transition-all"
                    style={{
                      display: "block",
                      height: 3,
                      width: active ? 18 : 0,
                      background: "var(--color-primary)",
                    }}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
