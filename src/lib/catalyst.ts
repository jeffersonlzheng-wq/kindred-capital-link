// Catalyst domain constants + matching logic

export const SECTORS = [
  { value: "saas", label: "SaaS" },
  { value: "fintech", label: "Fintech" },
  { value: "health_tech", label: "Health Tech" },
  { value: "ai", label: "AI" },
  { value: "consumer", label: "Consumer" },
  { value: "climate", label: "Climate" },
  { value: "real_estate", label: "Real Estate" },
  { value: "marketplace", label: "Marketplace" },
  { value: "education", label: "Education" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "biotech", label: "BioTech" },
  { value: "deeptech", label: "Deep Tech" },
  { value: "other", label: "Other" },
] as const;

export const STAGES = [
  { value: "idea", label: "Idea" },
  { value: "mvp", label: "MVP" },
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b_plus", label: "Series B+" },
] as const;

export const FUNDRAISING = [
  { value: "not_raising", label: "Not raising" },
  { value: "raising_soon", label: "Raising soon" },
  { value: "actively_raising", label: "Actively raising" },
] as const;

export const INVESTOR_TYPES = [
  { value: "angel", label: "Angel" },
  { value: "vc", label: "VC" },
  { value: "family_office", label: "Family Office" },
  { value: "operator", label: "Operator Investor" },
  { value: "scout", label: "Scout" },
  { value: "syndicate", label: "Syndicate" },
  { value: "other", label: "Other" },
] as const;

export const INTERESTS = [
  "sports", "fitness", "investing", "gaming", "fashion", "food",
  "music", "travel", "volunteering", "tech", "media", "other"
] as const;

export const FOUNDER_GOALS = [
  "capital", "mentorship", "introductions", "hiring", "partnerships", "customers", "feedback"
] as const;

export const INVESTOR_AVAILABILITY = [
  "open to calls", "reviewing decks", "mentoring", "events only", "not actively investing"
] as const;

export const DOC_TYPES = [
  "pitch_deck", "one_pager", "financial_model", "cap_table",
  "product_screenshots", "demo_video", "investment_memo", "other"
] as const;

export const DOC_TYPE_LABELS: Record<string, string> = {
  pitch_deck: "Pitch Deck",
  one_pager: "One-Pager",
  financial_model: "Financial Model",
  cap_table: "Cap Table",
  product_screenshots: "Product Screenshots",
  demo_video: "Demo Video",
  investment_memo: "Investment Memo",
  other: "Other",
};

export const DISCOVERY_CATEGORIES = [
  ...SECTORS.filter(s => s.value !== "other").map(s => ({ slug: s.value, label: s.label, kind: "sector" as const })),
  { slug: "trending-founders", label: "Trending Founders", kind: "meta" as const },
  { slug: "active-investors", label: "Active Investors", kind: "meta" as const },
  { slug: "raising-now", label: "Raising Now", kind: "meta" as const },
  { slug: "new-this-week", label: "New This Week", kind: "meta" as const },
  { slug: "high-match", label: "High Match %", kind: "meta" as const },
];

export function labelFor(list: readonly { value: string; label: string }[], v: string | null | undefined) {
  if (!v) return "—";
  return list.find(x => x.value === v)?.label ?? v;
}

// Match score 0..100
type Founder = {
  sector?: string | null;
  stage?: string | null;
  amount_raising?: number | null;
  fundraising_status?: string | null;
  interests?: string[] | null;
  looking_for?: string[] | null;
  location?: string | null;
};
type Investor = {
  sectors?: string[] | null;
  stages?: string[] | null;
  check_min?: number | null;
  check_max?: number | null;
  interests?: string[] | null;
  availability?: string[] | null;
  location?: string | null;
  looking_for_founders?: string | null;
};

export function computeMatch(
  founder: Founder,
  founderLocation: string | null | undefined,
  investor: Investor,
  investorLocation: string | null | undefined,
): number {
  let score = 0;

  // Sector 35
  if (founder.sector && investor.sectors?.includes(founder.sector)) score += 35;
  else if (founder.sector && investor.sectors?.length) score += 5;

  // Stage 20
  if (founder.stage && investor.stages?.includes(founder.stage)) score += 20;
  else if (founder.stage && investor.stages?.length) score += 4;

  // Check size 15
  const raise = Number(founder.amount_raising) || 0;
  const min = Number(investor.check_min) || 0;
  const max = Number(investor.check_max) || Infinity;
  if (raise && raise >= min && raise <= max) score += 15;
  else if (raise && (raise >= min * 0.5 && raise <= max * 1.5)) score += 8;
  else if (investor.check_min || investor.check_max) score += 2;

  // Location 10
  const fl = (founderLocation || "").toLowerCase().trim();
  const il = (investorLocation || "").toLowerCase().trim();
  if (fl && il) {
    if (fl === il) score += 10;
    else if (fl.split(",")[0] === il.split(",")[0]) score += 7;
    else score += 3;
  }

  // Shared interests 10
  const fi = new Set((founder.interests || []).map(x => x.toLowerCase()));
  const ii = (investor.interests || []).map(x => x.toLowerCase());
  const shared = ii.filter(x => fi.has(x));
  score += Math.min(10, shared.length * 3);

  // Relationship goals 10
  const goals = (founder.looking_for || []).map(x => x.toLowerCase());
  const investorOpen = (investor.availability || []).join(" ").toLowerCase();
  if (goals.includes("capital") && investorOpen.includes("not actively") === false) score += 5;
  if (investor.looking_for_founders && goals.length) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function sharedInterests(a?: string[] | null, b?: string[] | null) {
  if (!a || !b) return [];
  const set = new Set(a.map(x => x.toLowerCase()));
  return b.filter(x => set.has(x.toLowerCase()));
}
