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
      {/* Top bar: brand + profile + sign out */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link to="/dashboard" className="font-display text-lg font-extrabold italic tracking-tight">CATALYST</Link>
          <div className="flex items-center gap-3">
            <span className="mono-label hidden md:inline">{profile?.role ?? "—"}</span>
            <Link to={profile ? "/profile/$id" : "/dashboard"} params={{ id: profile?.id ?? "" }} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {(profile?.full_name || profile?.email || "?").slice(0, 1).toUpperCase()}
            </Link>
            <button onClick={handleSignOut} aria-label="Sign out" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-8 pb-28">{children}</main>

      {/* Bottom icon nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex max-w-7xl items-center justify-around px-2">
          {items.map(({ to, label, Icon }) => {
            const active = path === to || path.startsWith(to + "/");
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  aria-label={label}
                  title={label}
                  className={`flex h-14 flex-col items-center justify-center gap-0.5 transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                  <span className={`h-0.5 w-6 rounded-full ${active ? "bg-primary" : "bg-transparent"}`} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
