export type MemberType = "infant" | "child" | "teen" | "adult" | "senior";

export type UseKey =
  | "drinking"
  | "cooking"
  | "bathing"
  | "toilet"
  | "laundry"
  | "dishwashing"
  | "cleaning"
  | "garden"
  | "vehicle";

export type Household = {
  members: Record<MemberType, number>;
  pregnant: number;
  nursing: number;
  medicalCare: number;
  hasGarden: boolean;
  gardenSize: number; // sq meters
  pets: number;
  washesVehicle: boolean;
};

export type ScarcityLevel = "normal" | "watch" | "alert" | "critical";

export const MEMBER_LABELS: Record<MemberType, string> = {
  infant: "Infants (0-3)",
  child: "Children (4-12)",
  teen: "Teens (13-17)",
  adult: "Adults (18-59)",
  senior: "Seniors (60+)",
};

export const USE_LABELS: Record<UseKey, string> = {
  drinking: "Drinking",
  cooking: "Cooking & food prep",
  bathing: "Bathing & hygiene",
  toilet: "Toilet flushing",
  laundry: "Laundry",
  dishwashing: "Dishwashing",
  cleaning: "House cleaning",
  garden: "Garden & plants",
  vehicle: "Vehicle washing",
};

/** Litres per person per day, typical household use. */
const PER_PERSON: Record<MemberType, Partial<Record<UseKey, number>>> = {
  infant: { drinking: 0.8, cooking: 3, bathing: 22, toilet: 8, laundry: 26, dishwashing: 5, cleaning: 5 },
  child: { drinking: 1.6, cooking: 4, bathing: 35, toilet: 24, laundry: 18, dishwashing: 6, cleaning: 5 },
  teen: { drinking: 2.2, cooking: 5, bathing: 60, toilet: 30, laundry: 24, dishwashing: 9, cleaning: 6 },
  adult: { drinking: 2.5, cooking: 5, bathing: 55, toilet: 30, laundry: 22, dishwashing: 10, cleaning: 8 },
  senior: { drinking: 2.2, cooking: 5, bathing: 45, toilet: 32, laundry: 20, dishwashing: 9, cleaning: 7 },
};

/** Share of each use that can realistically be cut without harming health. */
const REDUCIBLE: Record<UseKey, number> = {
  drinking: 0,
  cooking: 0.1,
  bathing: 0.45,
  toilet: 0.4,
  laundry: 0.35,
  dishwashing: 0.3,
  cleaning: 0.5,
  garden: 0.8,
  vehicle: 0.9,
};

export const SCARCITY: Record<
  ScarcityLevel,
  { label: string; target: number; blurb: string }
> = {
  normal: { label: "Normal supply", target: 0.05, blurb: "Build good habits before the dry months." },
  watch: { label: "Dry-season watch", target: 0.15, blurb: "Rainfall below normal. Start trimming non-essential use." },
  alert: { label: "El Niño alert", target: 0.28, blurb: "Supply is stressed. Cut all discretionary use now." },
  critical: { label: "Critical shortage", target: 0.42, blurb: "Rationing likely. Protect drinking and cooking water only." },
};

export const USE_TIPS: Record<UseKey, string[]> = {
  drinking: [
    "Never ration drinking water — keep bottles chilled so nobody runs the tap to cool it.",
    "Store a 3-day drinking reserve in sealed food-grade containers.",
  ],
  cooking: [
    "Steam instead of boiling, and reuse the cooking water for soup stock.",
    "Rinse rice and vegetables in a basin, then pour that water onto plants.",
  ],
  bathing: [
    "Switch to a 4-minute shower or a pail-and-dipper bath.",
    "Catch the cold water while the shower warms up — it is clean water.",
  ],
  toilet: [
    "Put a filled bottle in the cistern to cut each flush.",
    "Flush with saved bath or laundry rinse water.",
  ],
  laundry: [
    "Only run full loads, and reuse the final rinse for the next wash.",
    "Re-wear lightly used outer clothes one extra time.",
  ],
  dishwashing: [
    "Wash in two basins — soap and rinse — instead of a running tap.",
    "Scrape plates dry before washing.",
  ],
  cleaning: [
    "Mop with laundry rinse water and sweep before wetting floors.",
    "Use a bucket, not a hose, for outdoor areas.",
  ],
  garden: [
    "Water at dawn or dusk and mulch beds to cut evaporation.",
    "Feed plants with saved rinse water; skip ornamentals during an alert.",
  ],
  vehicle: [
    "Use a bucket and sponge, or skip washing entirely during an alert.",
    "A waterless wash spray uses almost nothing.",
  ],
};

export type Breakdown = {
  use: UseKey;
  baseline: number;
  target: number;
  saved: number;
};

export type Result = {
  people: number;
  baseline: number;
  target: number;
  saved: number;
  savedPercent: number;
  perPerson: number;
  emergencyReserve: number;
  breakdown: Breakdown[];
};

export function computeWater(h: Household, level: ScarcityLevel): Result {
  const totals: Record<UseKey, number> = {
    drinking: 0,
    cooking: 0,
    bathing: 0,
    toilet: 0,
    laundry: 0,
    dishwashing: 0,
    cleaning: 0,
    garden: 0,
    vehicle: 0,
  };

  let people = 0;
  (Object.keys(h.members) as MemberType[]).forEach((type) => {
    const n = Math.max(0, h.members[type]);
    people += n;
    const profile = PER_PERSON[type];
    (Object.keys(profile) as UseKey[]).forEach((use) => {
      totals[use] += (profile[use] ?? 0) * n;
    });
  });

  // Pregnancy: more drinking water and more frequent bathing.
  totals.drinking += h.pregnant * 1.0 + h.nursing * 1.3;
  totals.bathing += (h.pregnant + h.nursing) * 12;
  totals.laundry += h.nursing * 8;

  // Someone needing medical or bed care: extra hygiene and laundry.
  totals.bathing += h.medicalCare * 18;
  totals.laundry += h.medicalCare * 15;
  totals.cleaning += h.medicalCare * 6;

  totals.drinking += h.pets * 1.2;
  totals.cleaning += h.pets * 3;

  if (h.hasGarden) totals.garden += Math.max(0, h.gardenSize) * 3.5;
  if (h.washesVehicle) totals.vehicle += 20;

  const baseline = sum(Object.values(totals));
  const targetCut = baseline * SCARCITY[level].target;
  const maxCut = (Object.keys(totals) as UseKey[]).reduce(
    (acc, use) => acc + totals[use] * REDUCIBLE[use],
    0,
  );
  const scale = maxCut > 0 ? Math.min(1, targetCut / maxCut) : 0;

  const breakdown: Breakdown[] = (Object.keys(totals) as UseKey[])
    .map((use) => {
      const base = totals[use];
      const saved = base * REDUCIBLE[use] * scale;
      return { use, baseline: base, target: base - saved, saved };
    })
    .filter((b) => b.baseline > 0.01)
    .sort((a, b) => b.baseline - a.baseline);

  const saved = sum(breakdown.map((b) => b.saved));
  const target = baseline - saved;

  return {
    people,
    baseline,
    target,
    saved,
    savedPercent: baseline > 0 ? (saved / baseline) * 100 : 0,
    perPerson: people > 0 ? target / people : 0,
    emergencyReserve: people * 15 * 3,
    breakdown,
  };
}

function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0);
}

export function litres(n: number) {
  return `${Math.round(n).toLocaleString()} L`;
}

export type RiskItem = {
  title: string;
  window: string;
  severity: "low" | "moderate" | "high";
  detail: string;
};

/** Illustrative outlook — replace with a live climate feed when available. */
export const RISK_OUTLOOK: RiskItem[] = [
  {
    title: "El Niño conditions strengthening",
    window: "Next 3-6 months",
    severity: "high",
    detail:
      "Warmer Pacific waters usually mean a longer, hotter dry stretch and weaker rainfall over the catchment.",
  },
  {
    title: "Reservoir drawdown",
    window: "Peak dry months",
    severity: "high",
    detail:
      "Storage typically falls fastest late in the dry season, which is when rotating supply cuts usually start.",
  },
  {
    title: "Fewer rain-bearing storms",
    window: "This season",
    severity: "moderate",
    detail: "A quieter storm season means less refill for rain barrels and shallow wells.",
  },
  {
    title: "Heat waves raising demand",
    window: "Hottest weeks",
    severity: "moderate",
    detail:
      "Everyone drinks and bathes more in extreme heat, so the household total climbs just as supply tightens.",
  },
  {
    title: "Saltwater intrusion in coastal wells",
    window: "Extended dry spells",
    severity: "low",
    detail: "Low groundwater lets seawater seep in, making well water unsafe for drinking and cooking.",
  },
  {
    title: "Pipe pressure drops and outages",
    window: "Anytime during rationing",
    severity: "low",
    detail: "Low pressure can pull contaminants into pipes — boil or treat water after an outage.",
  },
];
