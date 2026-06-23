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
      <header className="sticky top-0 z-40 glass-header">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link
            to="/dashboard"
            className="font-display text-lg font-extrabold italic tracking-tight"
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, oklch(0.92 0.10 75) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            CATALYST
          </Link>
          <div className="flex items-center gap-3">
            <span className="mono-label hidden md:inline opacity-60">{profile?.role ?? "—"}</span>
            <Link
              to={profile ? "/profile/$id" : "/dashboard"}
              params={{ id: profile?.id ?? "" }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: "linear-gradient(135deg, var(--color-primary) 0%, oklch(0.75 0.18 78) 100%)",
                color: "var(--color-primary-foreground)",
                boxShadow: "0 0 12px oklch(0.83 0.155 86 / 0.4)",
              }}
            >
              {(profile?.full_name || profile?.email || "?").slice(0, 1).toUpperCase()}
            </Link>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="text-xs font-bold uppercase tracking-wider transition-colors"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-8 pb-28">{children}</main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]"
        style={{
          background: "oklch(0.11 0.004 60 / 0.92)",
          backdropFilter: "blur(24px) saturate(1.5)",
          borderTop: "1px solid oklch(0.83 0.155 86 / 0.1)",
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
                  className="flex h-14 flex-col items-center justify-center gap-1 transition-all"
                  style={{ color: active ? "var(--color-primary)" : "var(--color-muted-foreground)" }}
                >
                  <Icon
                    className="h-5 w-5 transition-all"
                    strokeWidth={active ? 2.5 : 1.8}
                    style={active ? { filter: "drop-shadow(0 0 6px oklch(0.83 0.155 86 / 0.7))" } : {}}
                  />
                  <span
                    className="rounded-full nav-active-dot transition-all"
                    style={{
                      width: active ? 16 : 0,
                      height: 3,
                      background: active ? "var(--color-primary)" : "transparent",
                      display: "block",
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
