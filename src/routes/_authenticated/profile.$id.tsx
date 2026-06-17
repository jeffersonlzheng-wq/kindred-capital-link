import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { labelFor, SECTORS, STAGES, INVESTOR_TYPES, FUNDRAISING } from "@/lib/catalyst";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile/$id")({
  component: ProfilePage,
});

function ProfilePage() {
  const { id } = Route.useParams();
  const { user, profile } = useAuth();
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const [{ data: p }, { data: f }, { data: i }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("founder_profiles").select("*").eq("user_id", id).maybeSingle(),
        supabase.from("investor_profiles").select("*").eq("user_id", id).maybeSingle(),
      ]);
      return { p, f, i };
    },
  });

  const startConversation = async () => {
    if (!user) return;
    const a = user.id < id ? user.id : id;
    const b = user.id < id ? id : user.id;
    const { data: existing } = await supabase.from("conversations").select("id").eq("user_a", a).eq("user_b", b).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data: newC, error } = await supabase.from("conversations").insert({ user_a: a, user_b: b }).select("id").single();
      if (error) { toast.error(error.message); return; }
      convId = newC.id;
    }
    nav({ to: "/messages/$id", params: { id: convId! } });
  };

  if (isLoading) return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!data?.p) return <div className="py-12 text-center">Profile not found.</div>;
  const { p, f, i } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="tile rounded-xl p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-2xl font-bold text-primary-foreground">
              {p.full_name?.slice(0, 1).toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold">{p.full_name || "Unnamed"}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="chip">{p.role}</span>
                {p.location && <span>· {p.location}</span>}
                {p.linkedin && <a href={p.linkedin} target="_blank" rel="noreferrer" className="text-primary hover:underline">LinkedIn ↗</a>}
              </div>
            </div>
          </div>
          {user?.id !== id && (profile?.role === "admin" || p.role === "admin" || (profile?.role && p.role && profile.role !== p.role)) && (
            <button onClick={startConversation} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Message</button>
          )}
          {user?.id === id && (
            <Link to="/onboarding" className="rounded-lg border border-border px-4 py-2 text-sm font-bold">Edit profile</Link>
          )}
        </div>
        {p.bio && <p className="mt-6 text-sm">{p.bio}</p>}
      </div>

      {f && p.role === "founder" && (
        <section className="tile rounded-xl p-8">
          <h2 className="font-display text-lg font-bold">{f.company_name || "Company"}</h2>
          {f.website && <a href={f.website} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">{f.website}</a>}
          <p className="mt-4 text-sm">{f.description}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Sector" value={labelFor(SECTORS, f.sector)} />
            <Stat label="Stage" value={labelFor(STAGES, f.stage)} />
            <Stat label="Fundraising" value={labelFor(FUNDRAISING, f.fundraising_status)} />
            <Stat label="Raising" value={f.amount_raising ? `$${Number(f.amount_raising).toLocaleString()}` : "—"} />
            <Stat label="Team size" value={f.team_size ?? "—"} />
            <Stat label="Target customer" value={f.target_customer || "—"} />
            <Stat label="Business model" value={f.business_model || "—"} />
            <Stat label="Subsector" value={f.subsector || "—"} />
          </div>
          {f.traction && <div className="mt-6"><div className="mono-label mb-1">Traction</div><p className="text-sm">{f.traction}</p></div>}
          {f.looking_for?.length ? <div className="mt-6"><div className="mono-label mb-2">Looking for</div><div className="flex flex-wrap gap-1.5">{f.looking_for.map((x: string) => <span key={x} className="chip">{x}</span>)}</div></div> : null}
          {f.interests?.length ? <div className="mt-6"><div className="mono-label mb-2">Interests</div><div className="flex flex-wrap gap-1.5">{f.interests.map((x: string) => <span key={x} className="chip">{x}</span>)}</div></div> : null}
        </section>
      )}

      {i && p.role === "investor" && (
        <section className="tile rounded-xl p-8">
          <h2 className="font-display text-lg font-bold">{i.fund_name || "Fund"}</h2>
          {i.website && <a href={i.website} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">{i.website}</a>}
          <p className="mt-4 text-sm">{i.thesis}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Type" value={labelFor(INVESTOR_TYPES, i.investor_type)} />
            <Stat label="Role" value={i.role || "—"} />
            <Stat label="Check min" value={i.check_min ? `$${Number(i.check_min).toLocaleString()}` : "—"} />
            <Stat label="Check max" value={i.check_max ? `$${Number(i.check_max).toLocaleString()}` : "—"} />
          </div>
          {i.sectors?.length ? <div className="mt-6"><div className="mono-label mb-2">Sectors</div><div className="flex flex-wrap gap-1.5">{i.sectors.map((s: string) => <span key={s} className="chip">{labelFor(SECTORS, s)}</span>)}</div></div> : null}
          {i.stages?.length ? <div className="mt-6"><div className="mono-label mb-2">Stages</div><div className="flex flex-wrap gap-1.5">{i.stages.map((s: string) => <span key={s} className="chip">{labelFor(STAGES, s)}</span>)}</div></div> : null}
          {i.looking_for_founders && <div className="mt-6"><div className="mono-label mb-1">Looking for in founders</div><p className="text-sm">{i.looking_for_founders}</p></div>}
          {i.availability?.length ? <div className="mt-6"><div className="mono-label mb-2">Availability</div><div className="flex flex-wrap gap-1.5">{i.availability.map((s: string) => <span key={s} className="chip">{s}</span>)}</div></div> : null}
          {i.interests?.length ? <div className="mt-6"><div className="mono-label mb-2">Interests</div><div className="flex flex-wrap gap-1.5">{i.interests.map((s: string) => <span key={s} className="chip">{s}</span>)}</div></div> : null}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="mono-label">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
