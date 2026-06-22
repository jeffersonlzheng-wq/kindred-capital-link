import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AutofillInput = {
  role: "founder" | "investor";
  text?: string;
  file?: { name: string; mime: string; dataBase64: string } | null;
};

type AutofillResult = {
  full_name?: string;
  linkedin?: string;
  location?: string;
  bio?: string;
  // founder
  company_name?: string;
  website?: string;
  sector?: string;
  subsector?: string;
  stage?: string;
  fundraising_status?: string;
  amount_raising?: number;
  description?: string;
  traction?: string;
  team_size?: number;
  target_customer?: string;
  business_model?: string;
  interests?: string[];
  looking_for?: string[];
  // investor
  fund_name?: string;
  investor_role?: string;
  investor_type?: string;
  sectors?: string[];
  stages?: string[];
  check_min?: number;
  check_max?: number;
  thesis?: string;
  looking_for_founders?: string[];
  availability?: string[];
};

const SECTORS = ["saas","fintech","health_tech","ai","consumer","climate","real_estate","marketplace","education","ecommerce","biotech","deeptech","other"];
const STAGES = ["idea","mvp","pre_seed","seed","series_a","series_b_plus"];
const FUNDRAISING = ["not_raising","raising_soon","actively_raising"];
const INVESTOR_TYPES = ["angel","vc","family_office","operator","scout","syndicate","other"];
const INTERESTS = ["sports","fitness","investing","gaming","fashion","food","music","travel","volunteering","tech","media","other"];
const FOUNDER_GOALS = ["capital","mentorship","introductions","hiring","partnerships","customers","feedback"];
const INVESTOR_AVAILABILITY = ["open to calls","reviewing decks","mentoring","events only","not actively investing"];

function buildSystemPrompt(role: "founder" | "investor") {
  const shared = `You extract structured profile data for a founder-investor networking platform called Catalyst. Read the user's provided resume / LinkedIn text / pitch deck and return ONLY a single JSON object — no prose, no markdown fences. Only include fields you can confidently infer. Omit unknown fields entirely (do not invent).

Shared fields:
- full_name (string)
- linkedin (string URL if present)
- location (e.g. "San Francisco, CA")
- bio (1-2 sentence professional summary, first person)
- interests (subset of: ${INTERESTS.join(", ")})
`;

  if (role === "founder") {
    return shared + `
Founder fields:
- company_name
- website
- sector (one of: ${SECTORS.join(", ")})
- subsector (free text, e.g. "vertical SaaS for dentists")
- stage (one of: ${STAGES.join(", ")})
- fundraising_status (one of: ${FUNDRAISING.join(", ")})
- amount_raising (USD number, no commas)
- description (2-4 sentences about the company)
- traction (key metrics: ARR, users, growth)
- team_size (integer)
- target_customer
- business_model
- looking_for (subset of: ${FOUNDER_GOALS.join(", ")})
`;
  }
  return shared + `
Investor fields:
- fund_name
- investor_role (e.g. "Managing Partner")
- website
- investor_type (one of: ${INVESTOR_TYPES.join(", ")})
- sectors (subset of: ${SECTORS.join(", ")})
- stages (subset of: ${STAGES.join(", ")})
- check_min (USD number)
- check_max (USD number)
- thesis (2-4 sentences)
- looking_for_founders (free text on what they look for in founders)
- availability (subset of: ${INVESTOR_AVAILABILITY.join(", ")})
`;
}

export const autofillOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: AutofillInput) => {
    if (d.role !== "founder" && d.role !== "investor") throw new Error("Invalid role");
    if (!d.text && !d.file) throw new Error("Provide resume text or a file");
    if (d.text && d.text.length > 50_000) throw new Error("Text too long");
    if (d.file && d.file.dataBase64.length > 8_000_000) throw new Error("File too large");
    return d;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    const userContent: Array<Record<string, unknown>> = [];
    if (data.text?.trim()) {
      userContent.push({ type: "text", text: data.text.trim() });
    }
    if (data.file) {
      const url = `data:${data.file.mime};base64,${data.file.dataBase64}`;
      if (data.file.mime.startsWith("image/")) {
        userContent.push({ type: "image_url", image_url: { url } });
      } else {
        userContent.push({
          type: "file",
          file: { filename: data.file.name, file_data: url },
        });
      }
    }
    if (userContent.length === 0) throw new Error("Empty input");
    userContent.unshift({
      type: "text",
      text: "Extract a profile from the following. Return JSON only.",
    });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt(data.role) },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("AI is rate-limited. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
      throw new Error(`AI error: ${body.slice(0, 200)}`);
    }
    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: AutofillResult = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }
    return parsed as AutofillResult;
  });

export type { AutofillResult };
