// Seed: pending referrals from non-admin referrers + onboarded founder/investor
// pairs that hold a full conversation.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const FIRST = ["Avery","Quinn","Reese","Sage","Kai","Hayden","Jules","Nico","Indi","Theo","Mira","Cleo"];
const LAST  = ["Brooks","Hale","Vega","Okafor","Lindqvist","Romano","Aoki","Bauer","Castel","Duarte"];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random()*a.length)];
const rand = () => Math.random().toString(36).slice(2,10).toUpperCase();

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("method", { status: 405, headers: cors });

  const body = await req.json().catch(() => ({}));
  const pendingCount: number = body.pending ?? 4;
  const convoCount: number   = body.conversations ?? 3;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ---- pick non-admin existing onboarded users as referrers
  const { data: referrers } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .eq("onboarded", true)
    .neq("full_name", "Admin Test")
    .limit(20);

  const pendingCreated: any[] = [];
  for (let i = 0; i < pendingCount; i++) {
    const referrer = referrers?.[i % (referrers?.length || 1)];
    if (!referrer) break;
    const fn = pick(FIRST), ln = pick(LAST);
    const full_name = `${fn} ${ln}`;
    const ts = Date.now() + i;
    const email = `pending.${fn.toLowerCase()}.${ln.toLowerCase()}.${ts}@catalyst.test`;
    const password = "TestPass!2026";

    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name },
    });
    if (error || !data.user) { console.log("pending createUser err", error?.message); continue; }
    const uid = data.user.id;

    // Profile exists via trigger; mark as referred but NOT onboarded → stays "pending"
    await admin.from("profiles").update({
      full_name, referred_by: referrer.id, onboarded: false, referral_code: rand(),
    }).eq("id", uid);

    await admin.from("referrals").insert({
      referrer_id: referrer.id, referred_id: uid, status: "pending",
    });
    pendingCreated.push({ email, password, full_name, referrer: referrer.full_name });
  }

  // ---- conversation pairs (founder + investor), full chat
  const founderScript = [
    "Hey — thanks for connecting! We're building dev-tools infra for AI agents.",
    "Sure — we're $40k MRR, 12 design partners, growing ~25% MoM. Raising a $2M seed.",
    "Lead would be ideal. We have $500k soft-circled from angels.",
    "Yes, happy to share the deck and a Loom — sending now.",
    "Awesome, Tuesday 2pm PT works. Calendar invite coming over.",
    "Talk soon — appreciate the time!",
  ];
  const investorScript = [
    "Hey! Saw your profile via the Catalyst intro. Tell me a bit about the company.",
    "Nice traction. Who's on the cap table today and how much are you raising?",
    "Got it. Are you looking for a lead or filling a round?",
    "Perfect — can you share a deck and a short Loom of the product?",
    "Reviewed both. Want to do a 30-min call this week? Tuesday 2pm PT?",
    "Confirmed. Looking forward to it.",
  ];

  const convoCreated: any[] = [];
  for (let i = 0; i < convoCount; i++) {
    const fn1 = pick(FIRST), ln1 = pick(LAST);
    const fn2 = pick(FIRST), ln2 = pick(LAST);
    const ts = Date.now() + i*1000;
    const founderEmail  = `chat.f.${fn1.toLowerCase()}.${ln1.toLowerCase()}.${ts}@catalyst.test`;
    const investorEmail = `chat.i.${fn2.toLowerCase()}.${ln2.toLowerCase()}.${ts}@catalyst.test`;
    const password = "TestPass!2026";

    const f = await admin.auth.admin.createUser({ email: founderEmail,  password, email_confirm: true, user_metadata: { full_name: `${fn1} ${ln1}` } });
    const v = await admin.auth.admin.createUser({ email: investorEmail, password, email_confirm: true, user_metadata: { full_name: `${fn2} ${ln2}` } });
    if (!f.data.user || !v.data.user) { console.log("chat createUser err", f.error?.message, v.error?.message); continue; }
    const fid = f.data.user.id, vid = v.data.user.id;

    await admin.from("profiles").update({
      full_name: `${fn1} ${ln1}`, role: "founder", onboarded: true,
      location: "San Francisco, CA", bio: "Founder building in stealth.",
    }).eq("id", fid);
    await admin.from("profiles").update({
      full_name: `${fn2} ${ln2}`, role: "investor", onboarded: true,
      location: "New York, NY", bio: "Seed-stage investor.",
    }).eq("id", vid);

    await admin.from("founder_profiles").insert({
      user_id: fid, company_name: `${ln1} Labs`, sector: "saas", stage: "seed",
      fundraising_status: "actively_raising", amount_raising: 2_000_000,
      description: "AI infrastructure for builders.", traction: "$40k MRR, 25% MoM",
      team_size: 6, target_customer: "Engineers", business_model: "Subscription",
      interests: ["capital","intros"], looking_for: ["capital","intros"],
    });
    await admin.from("investor_profiles").insert({
      user_id: vid, fund_name: `${ln2} Capital`, role: "Partner", investor_type: "vc",
      sectors: ["saas","ai"], stages: ["seed","series_a"],
      check_min: 250_000, check_max: 2_000_000,
      thesis: "Backing technical founders at seed.",
      looking_for_founders: "Sharp insight, early traction.",
      interests: ["sourcing"], availability: ["leads","follows"],
    });

    const { data: convo, error: cErr } = await admin.from("conversations").insert({
      user_a: fid, user_b: vid,
    }).select("id").single();
    if (cErr || !convo) { console.log("convo err", cErr?.message); continue; }

    const base = Date.now() - 1000 * 60 * 60;
    const rows: any[] = [];
    for (let k = 0; k < founderScript.length; k++) {
      // investor opens
      rows.push({ conversation_id: convo.id, sender_id: vid, content: investorScript[k], created_at: new Date(base + k*2*60*1000).toISOString() });
      rows.push({ conversation_id: convo.id, sender_id: fid, content: founderScript[k],  created_at: new Date(base + (k*2+1)*60*1000).toISOString() });
    }
    await admin.from("messages").insert(rows);
    await admin.from("conversations").update({ last_message_at: rows[rows.length-1].created_at }).eq("id", convo.id);

    convoCreated.push({
      founder: { email: founderEmail, password, name: `${fn1} ${ln1}` },
      investor:{ email: investorEmail, password, name: `${fn2} ${ln2}` },
      messages: rows.length,
    });
  }

  return new Response(JSON.stringify({ ok: true, pending: pendingCreated, conversations: convoCreated }, null, 2), {
    headers: { ...cors, "content-type": "application/json" },
  });
});
