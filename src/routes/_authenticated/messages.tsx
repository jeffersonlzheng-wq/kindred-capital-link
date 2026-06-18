import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/messages")({
  component: MessagesLayout,
});

function MessagesLayout() {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isDetail = path !== "/messages";

  const { data } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id, user_a, user_b, last_message_at")
        .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)
        .order("last_message_at", { ascending: false });
      if (!convs?.length) return [];
      const otherIds = convs.map(c => c.user_a === user!.id ? c.user_b : c.user_a);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, role").in("id", otherIds);
      const pMap = new Map((profiles ?? []).map(p => [p.id, p]));
      return convs.map(c => ({ id: c.id, other: pMap.get(c.user_a === user!.id ? c.user_b : c.user_a), last: c.last_message_at }));
    },
  });

  return (
    <div className="fixed inset-x-0 top-14 grid bg-background md:grid-cols-[300px_1fr]" style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom))" }}>
      <aside className={`flex flex-col border-r border-border ${isDetail ? "hidden md:flex" : "flex"}`}>
        <div className="border-b border-border p-4">
          <h2 className="font-display text-lg font-bold">Inbox</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {!data?.length ? (
            <p className="p-6 text-sm text-muted-foreground">No conversations yet. Start one from a profile.</p>
          ) : data.map(c => (
            <Link key={c.id} to="/messages/$id" params={{ id: c.id }} className="flex items-center gap-3 border-b border-border p-3 hover:bg-accent">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {c.other?.full_name?.slice(0, 1).toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{c.other?.full_name || "Unknown"}</div>
                <div className="mono-label">{c.other?.role}</div>
              </div>
            </Link>
          ))}
        </div>
      </aside>
      <section className={`min-w-0 ${isDetail ? "flex" : "hidden md:flex"} flex-col`}>
        <Outlet />
        {!isDetail && (
          <div className="hidden flex-1 items-center justify-center md:flex">
            <p className="text-sm text-muted-foreground">Select a conversation to start chatting.</p>
          </div>
        )}
      </section>
    </div>
  );
}

