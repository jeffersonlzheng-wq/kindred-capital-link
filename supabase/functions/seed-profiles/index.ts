import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SECTORS = ["saas","fintech","health_tech","ai","consumer","climate","real_estate","marketplace","education","ecommerce"];
const STAGES = ["idea","mvp","pre_seed","seed","series_a","series_b_plus"];
const RAISING = ["not_raising","raising_soon","actively_raising"];
const ITYPES = ["angel","vc","family_office","operator","scout","syndicate"];
const CITIES = ["San Francisco, CA","New York, NY","Austin, TX","London, UK","Berlin, DE","Singapore","Paris, FR","Toronto, CA","Miami, FL","Los Angeles, CA","Seattle, WA","Boston, MA"];
const FIRST = ["Alex","Sam","Jordan","Taylor","Morgan","Casey","Riley","Jamie","Quinn","Avery","Drew","Reese","Skyler","Hayden","Cameron","Rowan","Emerson","Parker","Sage","Blake","Finley","Harper","Kendall","Logan","Marlowe","Noor","Priya","Yuki","Mateo","Zara"];
const LAST = ["Chen","Patel","Nguyen","Smith","Johnson","Garcia","Kim","Müller","Rossi","Ivanov","Silva","Dubois","Khan","Tanaka","Park","Singh","Andersen","Costa","Mensah","Rahman"];
const COMPANY_SUFFIX = ["Labs","AI","Health","Pay","Capital","Works","Cloud","Bio","Robotics","Studio"];
const FUND_PREFIX = ["North","Atlas","Beacon","Cedar","Delta","Echo","Forge","Granite","Helio","Indigo","Juno","Kestrel","Lumen","Meridian","Nexus","Orbit","Polaris","Quartz","Riverstone","Summit"];
const FUND_SUFFIX = ["Ventures","Capital","Partners","Fund","Holdings","Group"];
const INTERESTS_F = ["intros","mentorship","capital","hiring","feedback","press","customers"];
const INTERESTS_I = ["sourcing","co-investment","scouting","advising","portfolio support"];
const AVAIL = ["leads","follows","intros only","advising"];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const pickN = <T,>(a: T[], n: number) => [...a].sort(() => Math.random() - 0.5).slice(0, n);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method", { status: 405 });
  const { count = 40 } = await req.json().catch(() => ({}));
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const created: { email: string; role: string }[] = [];
  for (let i = 0; i < count; i++) {
    const fn = pick(FIRST), ln = pick(LAST);
    const full_name = `${fn} ${ln}`;
    const email = `seed.${fn.toLowerCase()}.${ln.toLowerCase()}.${Date.now()}${i}@catalyst.test`;
    const isFounder = i % 2 === 0;
    const role = isFounder ? "founder" : "investor";
    const city = pick(CITIES);

    const { data, error } = await admin.auth.admin.createUser({
      email, password: "SeedPass!2026", email_confirm: true,
      user_metadata: { full_name },
    });
    if (error || !data.user) { console.log("createUser err", error?.message); continue; }
    const uid = data.user.id;

    await admin.from("profiles").update({
      full_name, role, location: city,
      bio: isFounder ? "Building something useful." : "Backing exceptional founders early.",
      linkedin: `linkedin.com/in/${fn.toLowerCase()}-${ln.toLowerCase()}`,
      onboarded: true,
    }).eq("id", uid);

    if (isFounder) {
      const sector = pick(SECTORS), stage = pick(STAGES), fr = pick(RAISING);
      await admin.from("founder_profiles").insert({
        user_id: uid,
        company_name: `${ln} ${pick(COMPANY_SUFFIX)}`,
        website: `https://${ln.toLowerCase()}.example`,
        sector, stage, fundraising_status: fr,
        amount_raising: fr === "not_raising" ? null : [500_000, 1_500_000, 3_000_000, 8_000_000][Math.floor(Math.random()*4)],
        description: `A ${sector} company at ${stage} solving a real problem.`,
        traction: "Early signal from design partners.",
        team_size: 2 + Math.floor(Math.random() * 20),
        target_customer: pick(["SMBs","Enterprise","Prosumers","Developers","Healthcare providers"]),
        business_model: pick(["Subscription","Transaction fees","Usage-based","Marketplace take rate"]),
        interests: pickN(INTERESTS_F, 3),
        looking_for: pickN(INTERESTS_F, 2),
      });
    } else {
      const sectors = pickN(SECTORS, 3), stages = pickN(STAGES, 2);
      const min = [25_000, 50_000, 250_000, 500_000][Math.floor(Math.random()*4)];
      const max = min * (3 + Math.floor(Math.random() * 8));
      await admin.from("investor_profiles").insert({
        user_id: uid,
        fund_name: `${pick(FUND_PREFIX)} ${pick(FUND_SUFFIX)}`,
        role: pick(["Partner","Principal","Investor","Founder & GP"]),
        website: `https://${pick(FUND_PREFIX).toLowerCase()}.example`,
        investor_type: pick(ITYPES),
        sectors, stages, check_min: min, check_max: max,
        thesis: `We back ${sectors[0]} and ${sectors[1]} founders at ${stages[0]}.`,
        looking_for_founders: "Technical founders with sharp insight and early traction.",
        interests: pickN(INTERESTS_I, 3),
        availability: pickN(AVAIL, 2),
      });
    }
    created.push({ email, role });
  }

  return new Response(JSON.stringify({ ok: true, count: created.length, sample: created.slice(0, 3) }), {
    headers: { "content-type": "application/json" },
  });
});
