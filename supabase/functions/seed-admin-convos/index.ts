// Seed full conversations between the Admin Test account and existing onboarded
// test users. The validate_conversation_roles trigger allows admin participation
// with any role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

const adminScript = [
  "Hey! Welcome to Catalyst — quick check-in from the team. How's onboarding going?",
  "Glad to hear it. Anyone you'd like a warm intro to this week?",
  "Got it. I'll line up a couple of relevant matches and ping you Friday.",
  "Also — would you be up for a short testimonial once you close your first intro?",
  "Perfect. Thanks for being an early user 🙌",
];
const userScriptByRole: Record<string, string[]> = {
  founder: [
    "Hey! Onboarding was smooth — already getting a few profile views.",
    "Yes — any seed-stage investors active in our sector would be amazing.",
    "Amazing, looking forward to it.",
    "Happy to. Just send over the format whenever.",
    "Appreciate you — talk soon!",
  ],
  investor: [
    "Hey! All good — profile is live and I've already saved a few founders.",
    "Yes — anyone raising seed in SaaS / AI would be great to see.",
    "Sounds good, thanks for curating.",
    "Of course, happy to share a quote once a deal lands.",
    "Cheers — talk Friday.",
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("method", { status: 405, headers: cors });

  const body = await req.json().catch(() => ({}));
  const limit: number = body.limit ?? 6;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: adminProfile } = await admin
    .from("profiles").select("id").eq("full_name", "Admin Test").maybeSingle();
  if (!adminProfile) return new Response(JSON.stringify({ error: "no admin" }), { status: 400, headers: cors });
  const adminId = adminProfile.id;

  const { data: users } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .eq("onboarded", true)
    .neq("id", adminId)
    .in("role", ["founder", "investor"])
    .limit(limit);

  const created: any[] = [];
  for (const u of users ?? []) {
    // skip if a conversation already exists
    const { data: existing } = await admin
      .from("conversations").select("id")
      .or(`and(user_a.eq.${adminId},user_b.eq.${u.id}),and(user_a.eq.${u.id},user_b.eq.${adminId})`)
      .maybeSingle();
    if (existing) { created.push({ user: u.full_name, skipped: true }); continue; }

    const { data: convo, error: cErr } = await admin
      .from("conversations").insert({ user_a: adminId, user_b: u.id })
      .select("id").single();
    if (cErr || !convo) { console.log("convo err", cErr?.message); continue; }

    const script = userScriptByRole[u.role as string] ?? userScriptByRole.founder;
    const base = Date.now() - 1000 * 60 * 60;
    const rows: any[] = [];
    for (let k = 0; k < adminScript.length; k++) {
      rows.push({ conversation_id: convo.id, sender_id: adminId, content: adminScript[k], created_at: new Date(base + k*2*60*1000).toISOString() });
      rows.push({ conversation_id: convo.id, sender_id: u.id,    content: script[k],      created_at: new Date(base + (k*2+1)*60*1000).toISOString() });
    }
    await admin.from("messages").insert(rows);
    await admin.from("conversations").update({ last_message_at: rows[rows.length-1].created_at }).eq("id", convo.id);
    created.push({ user: u.full_name, role: u.role, messages: rows.length });
  }

  return new Response(JSON.stringify({ ok: true, created }, null, 2), {
    headers: { ...cors, "content-type": "application/json" },
  });
});
