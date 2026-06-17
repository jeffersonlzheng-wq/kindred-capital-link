import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method", { status: 405 });
  const { email, password } = await req.json();

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Admin Test" },
  });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  const { error: rErr } = await admin
    .from("user_roles")
    .insert({ user_id: data.user!.id, role: "admin" });
  if (rErr) return new Response(JSON.stringify({ error: rErr.message }), { status: 400 });

  return new Response(JSON.stringify({ ok: true, userId: data.user!.id }), {
    headers: { "content-type": "application/json" },
  });
});
