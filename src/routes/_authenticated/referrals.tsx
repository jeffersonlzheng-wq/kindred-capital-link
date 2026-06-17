import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/referrals")({
  component: Referrals,
});

function Referrals() {
  const { profile, user } = useAuth();

  const { data } = useQuery({
    queryKey: ["referrals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: refs } = await supabase.from("referrals").select("id, referred_id, status, created_at").eq("referrer_id", user!.id);
      const ids = (refs ?? []).map(r => r.referred_id);
      const { data: profs } = ids.length ? await supabase.from("profiles").select("id, full_name, email").in("id", ids) : { data: [] };
      const pMap = new Map((profs ?? []).map(p => [p.id, p]));
      return (refs ?? []).map(r => ({ ...r, profile: pMap.get(r.referred_id) }));
    },
  });

  const link = typeof window !== "undefined" ? `${window.location.origin}/auth?mode=signup&ref=${profile?.referral_code ?? ""}` : "";
  const count = data?.length ?? 0;
  const progress = Math.min(5, count);
  const unlocked = count >= 5;

  const copy = () => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Referrals</h1>
        <p className="mt-1 text-sm text-muted-foreground">Invite 5 people to Catalyst — unlock 1 month free.</p>
      </div>

      <div className="tile rounded-xl p-8">
        <div className="flex items-end justify-between">
          <span className="mono-label">Progress</span>
          <span className="font-display text-3xl font-extrabold">{progress}/5</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
          <div className="h-full bg-primary transition-all" style={{ width: `${(progress / 5) * 100}%` }} />
        </div>
        {unlocked && <p className="mt-3 text-sm font-semibold" style={{ color: "var(--color-match)" }}>🎉 Reward unlocked — pending admin approval</p>}
      </div>

      <div className="tile rounded-xl p-6">
        <div className="mono-label">Your code</div>
        <div className="font-display mt-1 text-2xl font-extrabold">{profile?.referral_code ?? "—"}</div>
        <div className="mt-4 flex gap-2">
          <input readOnly value={link} className="h-10 flex-1 rounded-md border border-border bg-surface px-3 text-xs" />
          <button onClick={copy} className="rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground">Copy</button>
        </div>
      </div>

      <div className="tile rounded-xl">
        <div className="border-b border-border p-4"><h2 className="font-display text-lg font-bold">Invites</h2></div>
        {!data?.length ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No invites yet. Share your link above.</p>
        ) : (
          <ul>
            {data.map(r => (
              <li key={r.id} className="flex items-center justify-between border-b border-border p-4 last:border-b-0">
                <div>
                  <div className="font-semibold">{r.profile?.full_name || r.profile?.email || "—"}</div>
                  <div className="mono-label mt-0.5">{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                <span className="chip" style={{ color: r.status === "completed" ? "var(--color-match)" : undefined }}>{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
