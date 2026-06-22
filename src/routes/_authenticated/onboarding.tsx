import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { SECTORS, STAGES, FUNDRAISING, INVESTOR_TYPES, INTERESTS, FOUNDER_GOALS, INVESTOR_AVAILABILITY } from "@/lib/catalyst";
import { autofillOnboarding, type AutofillResult } from "@/lib/onboarding.functions";
import { toast } from "sonner";
import { Sparkles, Upload, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function intersect<T extends string>(allowed: readonly T[], values: unknown): T[] {
  if (!Array.isArray(values)) return [];
  const set = new Set<string>(allowed as readonly string[]);
  return values.filter((v): v is T => typeof v === "string" && set.has(v));
}
function pickEnum<T extends string>(allowed: readonly { value: T }[] | readonly T[], v: unknown): T | "" {
  if (typeof v !== "string") return "";
  const vals = (allowed as readonly unknown[]).map((x) => (typeof x === "string" ? x : (x as { value: T }).value));
  return (vals.includes(v) ? (v as T) : "") as T | "";
}
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      resolve(s.includes(",") ? s.split(",")[1] : s);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-accent"}`}>
      {children}
    </button>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mono-label mb-1.5 block">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const input = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-primary";

function Onboarding() {
  const { user, profile, refresh } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState<"founder" | "investor" | null>(profile?.role as "founder" | "investor" | null);
  const [step, setStep] = useState(role ? 1 : 0);

  // Shared
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [linkedin, setLinkedin] = useState(profile?.linkedin ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");

  // Founder
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [sector, setSector] = useState<string>("");
  const [subsector, setSubsector] = useState("");
  const [stage, setStage] = useState<string>("");
  const [fundraisingStatus, setFundraisingStatus] = useState<string>("not_raising");
  const [amountRaising, setAmountRaising] = useState("");
  const [description, setDescription] = useState("");
  const [traction, setTraction] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  const [fInterests, setFInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);

  // Investor
  const [fundName, setFundName] = useState("");
  const [iRole, setIRole] = useState("");
  const [iWebsite, setIWebsite] = useState("");
  const [investorType, setInvestorType] = useState<string>("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [checkMin, setCheckMin] = useState("");
  const [checkMax, setCheckMax] = useState("");
  const [thesis, setThesis] = useState("");
  const [lookingForFounders, setLookingForFounders] = useState("");
  const [iInterests, setIInterests] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);

  // Hydrate role-specific fields when editing an existing profile.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      if (role === "founder") {
        const { data } = await supabase.from("founder_profiles").select("*").eq("user_id", user.id).maybeSingle();
        if (cancelled || !data) return;
        setCompanyName(data.company_name ?? "");
        setWebsite(data.website ?? "");
        setSector((data.sector as string) ?? "");
        setSubsector(data.subsector ?? "");
        setStage((data.stage as string) ?? "");
        setFundraisingStatus((data.fundraising_status as string) ?? "not_raising");
        setAmountRaising(data.amount_raising != null ? String(data.amount_raising) : "");
        setDescription(data.description ?? "");
        setTraction(data.traction ?? "");
        setTeamSize(data.team_size != null ? String(data.team_size) : "");
        setTargetCustomer(data.target_customer ?? "");
        setBusinessModel(data.business_model ?? "");
        setFInterests(data.interests ?? []);
        setLookingFor(data.looking_for ?? []);
      } else if (role === "investor") {
        const { data } = await supabase.from("investor_profiles").select("*").eq("user_id", user.id).maybeSingle();
        if (cancelled || !data) return;
        setFundName(data.fund_name ?? "");
        setIRole(data.role ?? "");
        setIWebsite(data.website ?? "");
        setInvestorType((data.investor_type as string) ?? "");
        setSectors((data.sectors as string[]) ?? []);
        setStages((data.stages as string[]) ?? []);
        setCheckMin(data.check_min != null ? String(data.check_min) : "");
        setCheckMax(data.check_max != null ? String(data.check_max) : "");
        setThesis(data.thesis ?? "");
        setLookingForFounders(data.looking_for_founders ?? "");
        setIInterests(data.interests ?? []);
        setAvailability(data.availability ?? []);
      }
    })();
    return () => { cancelled = true; };
  }, [user, role]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, v: string) => {
    setArr(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };

  const save = async () => {
    if (!user) return;
    try {
      await supabase.from("profiles").update({
        full_name: fullName, linkedin, location, bio, role, onboarded: true,
      }).eq("id", user.id);

      if (role === "founder") {
        await supabase.from("founder_profiles").upsert({
          user_id: user.id,
          company_name: companyName,
          website: website || null,
          sector: (sector || null) as never,
          subsector: subsector || null,
          stage: (stage || null) as never,
          fundraising_status: (fundraisingStatus || null) as never,
          amount_raising: amountRaising ? Number(amountRaising) : null,
          description, traction,
          team_size: teamSize ? Number(teamSize) : null,
          target_customer: targetCustomer,
          business_model: businessModel,
          interests: fInterests,
          looking_for: lookingFor,
        });
      } else if (role === "investor") {
        await supabase.from("investor_profiles").upsert({
          user_id: user.id,
          fund_name: fundName,
          role: iRole, website: iWebsite || null,
          investor_type: (investorType || null) as never,
          sectors: sectors as never,
          stages: stages as never,
          check_min: checkMin ? Number(checkMin) : null,
          check_max: checkMax ? Number(checkMax) : null,
          thesis, looking_for_founders: lookingForFounders,
          interests: iInterests, availability,
        });
      }
      await refresh();
      toast.success("Profile saved");
      nav({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  if (step === 0) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Welcome to Catalyst.</h1>
        <p className="mt-2 text-muted-foreground">First — are you raising capital or deploying it?</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button onClick={() => { setRole("founder"); setStep(1); }} className="tile tile-hover rounded-xl p-8 text-left">
            <div className="font-display text-2xl font-bold">Founder</div>
            <p className="mt-2 text-sm text-muted-foreground">I'm building a company and looking for capital, intros, or mentorship.</p>
          </button>
          <button onClick={() => { setRole("investor"); setStep(1); }} className="tile tile-hover rounded-xl p-8 text-left">
            <div className="font-display text-2xl font-bold">Investor</div>
            <p className="mt-2 text-sm text-muted-foreground">I deploy capital — angel, VC, family office, or operator-investor.</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Tell us about you</h1>
        <span className="chip">{role}</span>
      </div>

      <div className="space-y-6">
        <Field label="Full name"><input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="LinkedIn"><input className={input} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/…" /></Field>
          <Field label="Location"><input className={input} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="San Francisco, CA" /></Field>
        </div>
        <Field label="Short bio"><textarea className={input + " h-20 py-2"} value={bio} onChange={(e) => setBio(e.target.value)} /></Field>

        {role === "founder" && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Company name"><input className={input} value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></Field>
              <Field label="Website"><input className={input} value={website} onChange={(e) => setWebsite(e.target.value)} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Sector">
                <select className={input} value={sector} onChange={(e) => setSector(e.target.value)}>
                  <option value="">Select…</option>
                  {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Subsector / category"><input className={input} value={subsector} onChange={(e) => setSubsector(e.target.value)} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Stage">
                <select className={input} value={stage} onChange={(e) => setStage(e.target.value)}>
                  <option value="">Select…</option>
                  {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Fundraising status">
                <select className={input} value={fundraisingStatus} onChange={(e) => setFundraisingStatus(e.target.value)}>
                  {FUNDRAISING.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Amount raising (USD)"><input className={input} type="number" value={amountRaising} onChange={(e) => setAmountRaising(e.target.value)} /></Field>
              <Field label="Team size"><input className={input} type="number" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} /></Field>
            </div>
            <Field label="Company description"><textarea className={input + " h-20 py-2"} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
            <Field label="Traction metrics" hint="ARR, users, growth rate, etc."><textarea className={input + " h-20 py-2"} value={traction} onChange={(e) => setTraction(e.target.value)} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Target customer"><input className={input} value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)} /></Field>
              <Field label="Business model"><input className={input} value={businessModel} onChange={(e) => setBusinessModel(e.target.value)} /></Field>
            </div>
            <Field label="Interests / hobbies">
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(i => <Pill key={i} active={fInterests.includes(i)} onClick={() => toggle(fInterests, setFInterests, i)}>{i}</Pill>)}
              </div>
            </Field>
            <Field label="What you're looking for">
              <div className="flex flex-wrap gap-2">
                {FOUNDER_GOALS.map(i => <Pill key={i} active={lookingFor.includes(i)} onClick={() => toggle(lookingFor, setLookingFor, i)}>{i}</Pill>)}
              </div>
            </Field>
          </>
        )}

        {role === "investor" && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Fund / company"><input className={input} value={fundName} onChange={(e) => setFundName(e.target.value)} /></Field>
              <Field label="Your role"><input className={input} value={iRole} onChange={(e) => setIRole(e.target.value)} placeholder="Managing Partner" /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Website"><input className={input} value={iWebsite} onChange={(e) => setIWebsite(e.target.value)} /></Field>
              <Field label="Investor type">
                <select className={input} value={investorType} onChange={(e) => setInvestorType(e.target.value)}>
                  <option value="">Select…</option>
                  {INVESTOR_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Preferred sectors">
              <div className="flex flex-wrap gap-2">
                {SECTORS.map(s => <Pill key={s.value} active={sectors.includes(s.value)} onClick={() => toggle(sectors, setSectors, s.value)}>{s.label}</Pill>)}
              </div>
            </Field>
            <Field label="Preferred stages">
              <div className="flex flex-wrap gap-2">
                {STAGES.map(s => <Pill key={s.value} active={stages.includes(s.value)} onClick={() => toggle(stages, setStages, s.value)}>{s.label}</Pill>)}
              </div>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Check size — min (USD)"><input className={input} type="number" value={checkMin} onChange={(e) => setCheckMin(e.target.value)} /></Field>
              <Field label="Check size — max (USD)"><input className={input} type="number" value={checkMax} onChange={(e) => setCheckMax(e.target.value)} /></Field>
            </div>
            <Field label="Investment thesis"><textarea className={input + " h-20 py-2"} value={thesis} onChange={(e) => setThesis(e.target.value)} /></Field>
            <Field label="What you look for in founders"><textarea className={input + " h-20 py-2"} value={lookingForFounders} onChange={(e) => setLookingForFounders(e.target.value)} /></Field>
            <Field label="Interests / hobbies">
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(i => <Pill key={i} active={iInterests.includes(i)} onClick={() => toggle(iInterests, setIInterests, i)}>{i}</Pill>)}
              </div>
            </Field>
            <Field label="Availability">
              <div className="flex flex-wrap gap-2">
                {INVESTOR_AVAILABILITY.map(i => <Pill key={i} active={availability.includes(i)} onClick={() => toggle(availability, setAvailability, i)}>{i}</Pill>)}
              </div>
            </Field>
          </>
        )}

        <div className="flex items-center justify-between pt-6">
          <button onClick={() => setStep(0)} className="text-sm font-semibold text-muted-foreground hover:text-foreground">Back</button>
          <button onClick={save} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">
            Save and continue
          </button>
        </div>
        <p className="text-center"><Link to="/dashboard" className="text-xs text-muted-foreground hover:underline">Skip for now</Link></p>
      </div>
    </div>
  );
}
