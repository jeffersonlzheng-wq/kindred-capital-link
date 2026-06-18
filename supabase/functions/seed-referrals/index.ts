import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const FIRST = ["Avery", "Quinn", "Reese", "Sage", "Kai", "Hayden", "Jules"];
const LAST = ["Brooks", "Hale", "Vega", "Okafor", "Lindqvist"];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method", { status: 405 });
  const { code, count = 3 } = await req.json();

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: referrer, error: rErr } = await admin
    .from("profiles").select("id, full_name").eq("referral_code", code).maybeSingle();
  if (rErr || !referrer) {
    return new Response(JSON.stringify({ error: "Referral code not found" }), { status: 404 });
  }

  const created: { email: string; password: string; role: string; full_name: string }[] = [];
  for (let i = 0; i < count; i++) {
    const fn = pick(FIRST), ln = pick(LAST);
    const full_name = `${fn} ${ln}`;
    const ts = Date.now() + i;
    const email = `ref.${fn.toLowerCase()}.${ln.toLowerCase()}.${ts}@catalyst.test`;
    const password = "TestPass!2026";
    const role = i % 2 === 0 ? "founder" : "investor";

    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name },
    });
    if (error || !data.user) { console.log("createUser err", error?.message); continue; }
    const uid = data.user.id;

    await admin.from("profiles").update({
      full_name, role,
      location: role === "founder" ? "Austin, TX" : "New York, NY",
      bio: role === "founder" ? "Building in stealth — referred via Catalyst." : "Backing early-stage founders.",
      onboarded: true,
      referred_by: referrer.id,
    }).eq("id", uid);

    if (role === "founder") {
      await admin.from("founder_profiles").insert({
        user_id: uid,
        company_name: `${ln} Labs`,
        sector: "saas", stage: "seed", fundraising_status: "actively_raising",
        amount_raising: 1_500_000,
        description: "Early-stage SaaS company building developer tools.",
        traction: "10 design partners signed.",
        team_size: 5,
        target_customer: "Developers",
        business_model: "Subscription",
        interests: ["intros", "mentorship", "capital"],
        looking_for: ["capital", "intros"],
      });
    } else {
      await admin.from("investor_profiles").insert({
        user_id: uid,
        fund_name: `${ln} Capital`,
        role: "Partner",
        investor_type: "vc",
        sectors: ["saas", "ai", "fintech"],
        stages: ["seed", "series_a"],
        check_min: 250_000, check_max: 2_000_000,
        thesis: "We back technical founders at seed and Series A.",
        looking_for_founders: "Sharp insight, early traction.",
        interests: ["sourcing", "co-investment"],
        availability: ["leads", "follows"],
      });
    }

    await admin.from("referrals").insert({ referrer_id: referrer.id, referred_id: uid });
    created.push({ email, password, role, full_name });
  }

  return new Response(JSON.stringify({ ok: true, referrer: referrer.full_name, created }), {
    headers: { "content-type": "application/json" },
  });
});
