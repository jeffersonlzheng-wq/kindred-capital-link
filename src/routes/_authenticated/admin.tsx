import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: Admin,
});

function Admin() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "founder" | "investor">("all");
  const [referralsOpen, setReferralsOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, founders, investors, msgs, refs] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "founder"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "investor"),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("referrals").select("id", { count: "exact", head: true }),
      ]);
      return {
        users: users.count ?? 0,
        founders: founders.count ?? 0,
        investors: investors.count ?? 0,
        messages: msgs.count ?? 0,
        referrals: refs.count ?? 0,
      };
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users", filter],
    queryFn: async () => {
      let q = supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("role", filter);
      const { data } = await q;
      return data ?? [];
    },
  });

  const toggleFeature = async (id: string, featured: boolean) => {
    await supabase.from("profiles").update({ featured: !featured }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    toast.success(!featured ? "Featured" : "Unfeatured");
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this user profile?")) return;
    await supabase.from("profiles").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Admin</h1>

      <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-5">
        {[
          { label: "Users", v: stats?.users },
          { label: "Founders", v: stats?.founders },
          { label: "Investors", v: stats?.investors },
          { label: "Messages", v: stats?.messages },
          { label: "Referrals", v: stats?.referrals },
        ].map(s => (
          <div key={s.label} className="tile p-5">
            <div className="mono-label">{s.label}</div>
            <div className="font-display mt-2 text-3xl font-extrabold">{s.v ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setReferralsOpen(true)} className="rounded-md bg-primary px-4 py-2 text-xs font-bold uppercase text-primary-foreground">
          See Referrals
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "founder", "investor"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase ${filter === f ? "bg-primary text-primary-foreground" : "border border-border"}`}>{f}</button>
        ))}
      </div>

      <div className="tile rounded-xl">
        <div className="border-b border-border p-4"><h2 className="font-display text-lg font-bold">Users</h2></div>
        <ul>
          {users?.map(u => (
            <li key={u.id} className="flex items-center justify-between border-b border-border p-4 last:border-b-0">
              <Link to="/profile/$id" params={{ id: u.id }} className="flex-1">
                <div className="font-semibold">{u.full_name || u.email}</div>
                <div className="mono-label mt-0.5">{u.role || "—"} · {u.location || "—"}</div>
              </Link>
              <div className="flex gap-2">
                <button onClick={() => toggleFeature(u.id, u.featured)} className="rounded-md border border-border px-2 py-1 text-xs font-bold">
                  {u.featured ? "★ Featured" : "Feature"}
                </button>
                <button onClick={() => remove(u.id)} className="rounded-md border border-destructive px-2 py-1 text-xs font-bold text-destructive">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={referralsOpen} onOpenChange={setReferralsOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle className="font-display text-lg font-bold">Referrals</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <ReferralsAdmin />
          </div>
        </DialogContent>
      </Dialog>

      <AllMessages />
    </div>
  );
}

type ReferralRow = {
  id: string;
  status: string | null;
  created_at: string;
  referrer: { id: string; full_name: string | null; email: string } | null;
  referred: { id: string; full_name: string | null; email: string; role: string | null; onboarded: boolean } | null;
};

function ReferralsAdmin() {
  const qc = useQueryClient();
  const [referrerFilter, setReferrerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "active">("all");

  const { data: rows } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async (): Promise<ReferralRow[]> => {
      const { data: refs } = await supabase
        .from("referrals")
        .select("id, referrer_id, referred_id, status, created_at")
        .order("created_at", { ascending: false });
      if (!refs?.length) return [];
      const ids = Array.from(new Set(refs.flatMap(r => [r.referrer_id, r.referred_id])));
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, onboarded")
        .in("id", ids);
      const map = new Map((profs ?? []).map(p => [p.id, p]));
      return refs.map(r => ({
        id: r.id,
        status: r.status,
        created_at: r.created_at,
        referrer: map.get(r.referrer_id) ?? null,
        referred: map.get(r.referred_id) ?? null,
      }));
    },
  });

  const referrers = Array.from(
    new Map((rows ?? []).filter(r => r.referrer).map(r => [r.referrer!.id, r.referrer!])).values(),
  );

  const effectiveStatus = (r: ReferralRow) =>
    r.referred?.onboarded ? "active" : (r.status || "pending");

  const filtered = (rows ?? []).filter(r => {
    if (referrerFilter !== "all" && r.referrer?.id !== referrerFilter) return false;
    if (statusFilter !== "all" && effectiveStatus(r) !== statusFilter) return false;
    return true;
  });

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("referrals").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-referrals"] });
    toast.success(`Marked ${status}`);
  };

  const counts = {
    all: rows?.length ?? 0,
    pending: rows?.filter(r => effectiveStatus(r) === "pending").length ?? 0,
    active: rows?.filter(r => effectiveStatus(r) === "active").length ?? 0,
  };

  return (
    <div className="tile rounded-xl">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
        <h2 className="font-display text-lg font-bold">
          Referred users <span className="mono-label ml-2">{filtered.length} of {rows?.length ?? 0}</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={referrerFilter}
            onChange={e => setReferrerFilter(e.target.value)}
            className="h-9 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          >
            <option value="all">All referrers</option>
            {referrers.map(p => (
              <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
            ))}
          </select>
          <div className="flex overflow-hidden rounded-md border border-border">
            {(["all", "pending", "active"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-bold uppercase ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-surface"}`}
              >
                {s} ({counts[s]})
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {!filtered.length ? (
          <p className="p-4 text-sm text-muted-foreground">No referrals match these filters.</p>
        ) : (
          <ul>
            {filtered.map(r => {
              const status = effectiveStatus(r);
              return (
                <li key={r.id} className="flex flex-col gap-3 border-b border-border p-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/profile/$id"
                      params={{ id: r.referred?.id ?? "" }}
                      className="font-semibold hover:underline"
                    >
                      {r.referred?.full_name || r.referred?.email || "Unknown user"}
                    </Link>
                    <div className="mono-label mt-0.5">
                      {r.referred?.role || "no role"} · referred by {r.referrer?.full_name || r.referrer?.email || "?"} · {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`chip ${status === "active" ? "bg-primary text-primary-foreground" : ""}`}>
                      {status}
                    </span>
                    {status !== "active" && (
                      <button
                        onClick={() => updateStatus(r.id, "active")}
                        className="rounded-md border border-border px-2 py-1 text-xs font-bold"
                      >
                        Mark active
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function AllMessages() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: convs } = useQuery({
    queryKey: ["admin-all-convs"],
    queryFn: async () => {
      const { data: c } = await supabase
        .from("conversations")
        .select("id, user_a, user_b, last_message_at")
        .order("last_message_at", { ascending: false });
      if (!c?.length) return [];
      const ids = Array.from(new Set(c.flatMap(x => [x.user_a, x.user_b])));
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email, role").in("id", ids);
      const map = new Map((profs ?? []).map(p => [p.id, p]));
      return c.map(x => ({ ...x, a: map.get(x.user_a), b: map.get(x.user_b) }));
    },
  });

  const { data: msgs } = useQuery({
    queryKey: ["admin-conv-msgs", selected],
    enabled: !!selected,
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", selected!)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const filtered = convs?.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Boolean(
      c.a?.full_name?.toLowerCase().includes(s) ||
      c.b?.full_name?.toLowerCase().includes(s) ||
      c.a?.email?.toLowerCase().includes(s) ||
      c.b?.email?.toLowerCase().includes(s)
    );
  });

  const selectedConv = convs?.find(c => c.id === selected);

  return (
    <div className="tile rounded-xl">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
        <h2 className="font-display text-lg font-bold">All Messages <span className="mono-label ml-2">{convs?.length ?? 0} conversations</span></h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary md:w-64"
        />
      </div>
      <div className="max-h-[70vh] overflow-y-auto">
        {!filtered?.length ? (
          <p className="p-4 text-sm text-muted-foreground">No conversations.</p>
        ) : (
          <ul>
            {filtered.map(c => (
              <li key={c.id} className="flex items-center justify-between border-b border-border p-4 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {c.a?.full_name || "?"} ↔ {c.b?.full_name || "?"}
                  </div>
                  <div className="mono-label mt-0.5">{new Date(c.last_message_at).toLocaleString()}</div>
                </div>
                <button
                  onClick={() => setSelected(c.id)}
                  className="ml-4 shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-bold"
                >
                  View
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle className="font-display text-lg font-bold">
              {selectedConv ? `${selectedConv.a?.full_name || "?"} ↔ ${selectedConv.b?.full_name || "?"}` : "Conversation"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4">
            {!msgs?.length ? (
              <p className="text-sm text-muted-foreground">No messages.</p>
            ) : (
              <div className="space-y-3">
                {msgs.map(m => {
                  const fromA = m.sender_id === selectedConv?.user_a;
                  const sender = fromA ? selectedConv?.a : selectedConv?.b;
                  return (
                    <div key={m.id} className="border-b border-border pb-3 last:border-b-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-bold">{sender?.full_name || sender?.email || "?"} <span className="mono-label ml-1">{sender?.role}</span></span>
                        <span className="mono-label">{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-sm">{m.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

