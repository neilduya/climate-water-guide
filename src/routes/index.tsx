import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Droplets,
  Minus,
  Plus,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  Waves,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  computeWater,
  litres,
  MEMBER_LABELS,
  RISK_OUTLOOK,
  SCARCITY,
  USE_LABELS,
  USE_TIPS,
  type Household,
  type MemberType,
  type ScarcityLevel,
} from "@/lib/water";

const TITLE = "WAVE — Water Adaptation & Vulnerability Engine";
const DESC =
  "Work out how much water your household should save for drinking, bathing, laundry and more, and see what could tighten supply next.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const INITIAL: Household = {
  members: { infant: 0, child: 1, teen: 0, adult: 2, senior: 0 },
  pregnant: 0,
  nursing: 0,
  medicalCare: 0,
  hasGarden: false,
  gardenSize: 10,
  pets: 0,
  washesVehicle: false,
};

function Index() {
  const [household, setHousehold] = useState<Household>(INITIAL);
  const [level, setLevel] = useState<ScarcityLevel>("alert");

  const result = useMemo(() => computeWater(household, level), [household, level]);

  const setMember = (type: MemberType, delta: number) =>
    setHousehold((h) => ({
      ...h,
      members: { ...h.members, [type]: Math.max(0, Math.min(15, h.members[type] + delta)) },
    }));

  const setCount = (key: "pregnant" | "nursing" | "medicalCare" | "pets", delta: number) =>
    setHousehold((h) => ({ ...h, [key]: Math.max(0, Math.min(10, h[key] + delta)) }));

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <header className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-aqua shadow-[var(--shadow-float)]">
          <Droplets className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-semibold text-primary">WAVE</h1>
        <p className="mt-1 text-xs font-medium text-accent-foreground">
          Water Adaptation &amp; Vulnerability Engine
        </p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          A saving plan for your household, use by use, so you are ready when the dry
          spell hits.
        </p>
      </header>

      {/* Scarcity level */}
      <section className="mt-8">
        <SectionTitle icon={<Waves className="h-4 w-4" />} text="Current situation" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(Object.keys(SCARCITY) as ScarcityLevel[]).map((key) => (
            <Button
              key={key}
              onClick={() => setLevel(key)}
              variant="outline"
              className={`h-auto justify-start rounded-lg px-3 py-3 text-left shadow-none ${
                level === key
                  ? "border-primary bg-secondary text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-secondary/60"
              }`}
            >
              <span>
                <span className="block text-sm font-medium">{SCARCITY[key].label}</span>
                <span className="block text-xs opacity-80">
                  save {Math.round(SCARCITY[key].target * 100)}%
                </span>
              </span>
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{SCARCITY[level].blurb}</p>
      </section>

      {/* Household */}
      <section className="mt-8">
        <SectionTitle icon={<Sparkles className="h-4 w-4" />} text="Who lives here" />
        <Card className="surface-card mt-3 gap-0 border-0 p-2">
          {(Object.keys(MEMBER_LABELS) as MemberType[]).map((type) => (
            <Counter
              key={type}
              label={MEMBER_LABELS[type]}
              value={household.members[type]}
              onChange={(d) => setMember(type, d)}
            />
          ))}
        </Card>

        <Card className="surface-card mt-3 gap-0 border-0 p-2">
          <Counter
            label="Pregnant members"
            hint="Needs more drinking water and hygiene"
            value={household.pregnant}
            onChange={(d) => setCount("pregnant", d)}
          />
          <Counter
            label="Breastfeeding members"
            value={household.nursing}
            onChange={(d) => setCount("nursing", d)}
          />
          <Counter
            label="Needs bed or medical care"
            value={household.medicalCare}
            onChange={(d) => setCount("medicalCare", d)}
          />
          <Counter
            label="Pets"
            value={household.pets}
            onChange={(d) => setCount("pets", d)}
          />
        </Card>

        <Card className="surface-card mt-3 flex flex-col gap-4 border-0 p-4">
          <ToggleRow
            label="We water a garden"
            checked={household.hasGarden}
            onChange={(v) => setHousehold((h) => ({ ...h, hasGarden: v }))}
          />
          {household.hasGarden && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Garden area</span>
                <span>{household.gardenSize} m²</span>
              </div>
              <Slider
                className="mt-3"
                min={1}
                max={100}
                step={1}
                value={[household.gardenSize]}
                onValueChange={(v) => setHousehold((h) => ({ ...h, gardenSize: v[0] ?? 1 }))}
              />
            </div>
          )}
          <ToggleRow
            label="We wash a car or motorbike"
            checked={household.washesVehicle}
            onChange={(v) => setHousehold((h) => ({ ...h, washesVehicle: v }))}
          />
        </Card>
      </section>

      {/* Summary */}
      <section className="mt-8">
        <Card className="summary-card border-0 p-5 sm:p-6">
          <p className="text-xs uppercase text-primary-foreground/80">
            Daily target for {result.people || 0} {result.people === 1 ? "person" : "people"}
          </p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-4xl font-semibold">{litres(result.target)}</span>
            <span className="pb-1 text-sm text-primary-foreground/80">per day</span>
          </div>
          <p className="mt-1 text-sm text-primary-foreground/80">
            Down from {litres(result.baseline)} — save {litres(result.saved)} a day (
            {Math.round(result.savedPercent)}%), about {litres(result.saved * 30)} a month.
          </p>
          <Progress className="mt-4 h-2 bg-primary-foreground/25" value={Math.min(100, result.savedPercent * 2)} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Per person / day" value={litres(result.perPerson)} />
            <Stat label="3-day emergency store" value={litres(result.emergencyReserve)} />
          </div>
        </Card>
      </section>

      {/* Breakdown */}
      <section className="mt-8">
        <SectionTitle icon={<Droplets className="h-4 w-4" />} text="Where the water goes" />
        <Accordion type="single" collapsible className="mt-3 space-y-2">
          {result.breakdown.map((b) => {
            const share = result.baseline > 0 ? (b.baseline / result.baseline) * 100 : 0;
            return (
              <AccordionItem
                key={b.use}
                value={b.use}
                className="surface-card overflow-hidden border-0 px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="w-full pr-3 text-left">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium">{USE_LABELS[b.use]}</span>
                      <span className="text-sm text-muted-foreground">
                        {litres(b.target)}
                      </span>
                    </div>
                     <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-aqua" style={{ width: `${share}%` }} />
                    </div>
                    <span className="mt-1.5 block text-xs text-muted-foreground">
                      {b.saved < 0.5
                        ? "Essential — do not cut"
                        : `Save ${litres(b.saved)} a day here`}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pb-1">
                    {USE_TIPS[b.use].map((tip) => (
                      <li key={tip} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>

      {/* Risks */}
      <section className="mt-8">
        <SectionTitle icon={<ShieldAlert className="h-4 w-4" />} text="What could tighten supply" />
        <div className="mt-3 space-y-2">
          {RISK_OUTLOOK.map((r) => (
            <Card key={r.title} className="surface-card flex flex-col gap-2 border-0 p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium">{r.title}</span>
                <SeverityPill severity={r.severity} />
              </div>
              <p className="text-xs text-muted-foreground">{r.detail}</p>
              <p className="text-xs text-primary/80">{r.window}</p>
            </Card>
          ))}
        </div>
        <p className="mt-3 flex gap-2 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          These outlook notes are general guidance, not a live forecast. Always follow
          your local water utility's advisories.
        </p>
      </section>

      <div className="mt-8 text-center">
        <Button variant="secondary" onClick={() => setHousehold(INITIAL)}>
          Reset household
        </Button>
      </div>
    </main>
  );
}

function SectionTitle({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-primary">
      {icon}
      <span className="text-xs uppercase">{text}</span>
    </div>
  );
}

function Counter({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
      <div>
        <span className="block text-sm">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(-1)}
          aria-label={`Remove one from ${label}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-7 text-center text-sm tabular-nums">{value}</span>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(1)}
          aria-label={`Add one to ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-primary-foreground/15 px-3 py-2.5">
      <span className="block text-xs text-primary-foreground/75">{label}</span>
      <span className="block text-base font-medium">{value}</span>
    </div>
  );
}

function SeverityPill({ severity }: { severity: "low" | "moderate" | "high" }) {
  const styles = {
    low: "bg-primary/15 text-primary",
    moderate: "bg-warning/20 text-warning",
    high: "bg-destructive/20 text-destructive",
  } as const;
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}
