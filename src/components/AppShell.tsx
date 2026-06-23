import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { type ReactNode } from "react";
import { LayoutDashboard, Compass, MessageSquare, FileText, Gift, Shield } from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/discover", label: "Discover", Icon: Compass },
  { to: "/messages", label: "Messages", Icon: MessageSquare },
  { to: "/documents", label: "Documents", Icon: FileText },
  { to: "/referrals", label: "Referrals", Icon: Gift },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const items = [
    ...NAV,
    ...(isAdmin ? [{ to: "/admin" as const, label: "Admin", Icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className="sticky top-0 z-40"
        style={{
          background: "oklch(0.095 0.008 248 / 0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="mx-auto flex h-13 max-w-5xl items-center justify-between px-5">
          <Link
            to="/dashboard"
            className="font-display text-sm font-bold tracking-tight"
            style={{ color: "var(--color-foreground)", letterSpacing: "0.04em" }}
          >
            CATALYST
          </Link>

          {/* Desktop center nav */}
          <nav className="hidden md:flex items-center gap-1">
            {items.map(({ to, label }) => {
              const active = path === to || path.startsWith(to + "/");
              return (
                <Link
                  key={to}
                  to={to}
                  className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  style={{
                    color: active ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                    background: active ? "var(--color-surface-2)" : "transparent",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span
              className="mono-label hidden md:inline px-2 py-1 rounded"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              {profile?.role ?? "—"}
            </span>
            <Link
              to={profile ? "/profile/$id" : "/dashboard"}
              params={{ id: profile?.id ?? "" }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: "var(--color-primary)",
                color: "var(--color-primary-foreground)",
              }}
            >
              {(profile?.full_name || profile?.email || "?").slice(0, 1).toUpperCase()}
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs transition-colors"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pt-7 pb-24">{children}</main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-[env(safe-area-inset-bottom)]"
        style={{
          background: "oklch(0.095 0.008 248 / 0.96)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <ul className="flex items-center justify-around px-2">
          {items.map(({ to, label, Icon }) => {
            const active = path === to || path.startsWith(to + "/");
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  aria-label={label}
                  className="flex h-14 flex-col items-center justify-center gap-1 transition-colors"
                  style={{ color: active ? "var(--color-primary)" : "var(--color-muted-foreground)" }}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                  <span
                    className="text-[9px] font-semibold tracking-wide uppercase"
                    style={{ opacity: active ? 1 : 0.5 }}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
