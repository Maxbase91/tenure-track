"use client";

import { useMemo, useState } from "react";
import { FIELDS, randomField, type FieldId } from "@/lib/game/fields";
import { generateOffers, randomPersonName, type Offer } from "@/lib/game/offers";
import { SCENARIOS, type SetupConfig } from "@/lib/game/scenarios";
import type { ScenarioId } from "@/lib/game/types";
import { PoolBrowser } from "./PoolBrowser";

// The setup flow (spec §3): one to three screens, every step skippable with
// Randomise. Career: partner → field → PhD offer draft → name. Quick:
// entry-point tile → partner → name → field (optional). Kept ugly (M3).

const QUICK_SCENARIOS: ScenarioId[] = ["phd-crunch", "postdoc-gamble", "new-pi", "tenure-sprint"];

const card: React.CSSProperties = { padding: "10px 12px", fontSize: 15, textAlign: "left", cursor: "pointer", border: "1px solid #ccc", background: "#fff" };
const selected: React.CSSProperties = { ...card, border: "2px solid #333", background: "#f0f0f0" };

export function SetupFlow({ onStart, onOpen }: { onStart: (c: SetupConfig) => void; onOpen: (id: string) => void }) {
  const [browsing, setBrowsing] = useState(false);
  const [step, setStep] = useState(0);
  const [scenario, setScenario] = useState<ScenarioId>("postdoc-gamble");
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [partnerField, setPartnerField] = useState<FieldId>("neuroscience");
  const [field, setField] = useState<FieldId>("molecular-biology");
  const [name, setName] = useState("");
  const [offer, setOffer] = useState<Offer | null>(null);

  const isCareer = scenario === "career";
  // Generate the PhD offer draft once we know we're in career mode (§12).
  // Stable per career session so navigating back/forward doesn't reshuffle.
  const offers = useMemo(() => (isCareer ? generateOffers() : []), [isCareer]);

  // Step order differs by mode (§3). Build the ordered list of step keys.
  const steps = isCareer
    ? (["scenario", "partner", "field", "offers", "name"] as const)
    : (["scenario", "partner", "name", "field"] as const);
  const key = steps[Math.min(step, steps.length - 1)];

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = () =>
    onStart({
      mode: isCareer ? "career" : "quick",
      scenario,
      field,
      scientistName: name,
      hasPartner,
      partnerName: hasPartner ? partnerName || "Ellie" : null,
      partnerField: hasPartner ? partnerField : null,
      offer: isCareer ? offer ?? offers[0] : null,
    });

  const Heading = ({ children }: { children: React.ReactNode }) => (
    <h2 style={{ marginBottom: 8 }}>{children}</h2>
  );
  const Nav = ({ canNext = true, last = false }: { canNext?: boolean; last?: boolean }) => (
    <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
      {step > 0 && <button onClick={back} style={{ padding: "8px 12px" }}>← Back</button>}
      <button onClick={last ? finish : next} disabled={!canNext} style={{ padding: "8px 14px", fontWeight: "bold", cursor: canNext ? "pointer" : "not-allowed" }}>
        {last ? "Start ▶" : "Next →"}
      </button>
    </div>
  );

  if (browsing) return <PoolBrowser onOpen={onOpen} onBack={() => setBrowsing(false)} />;

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 4 }}>Tenure Track</h1>
      <p style={{ color: "#666", marginTop: 0 }}>New game — {step + 1} / {steps.length}</p>
      {step === 0 && (
        <button onClick={() => setBrowsing(true)} style={{ padding: "6px 10px", marginBottom: 12 }}>
          Browse the communal pool →
        </button>
      )}

      {key === "scenario" && (
        <section>
          <Heading>Choose your game</Heading>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button style={scenario === "career" ? selected : card} onClick={() => setScenario("career")}>
              <strong>Career</strong> — {SCENARIOS.career.blurb}
            </button>
            <div style={{ fontSize: 12, color: "#aaa", textTransform: "uppercase", marginTop: 8 }}>quick mode — pick an entry point</div>
            {QUICK_SCENARIOS.map((id) => (
              <button key={id} style={scenario === id ? selected : card} onClick={() => setScenario(id)}>
                <strong>{SCENARIOS[id].label}</strong> — {SCENARIOS[id].blurb}
              </button>
            ))}
          </div>
          <Nav />
        </section>
      )}

      {key === "partner" && (
        <section>
          <Heading>Play with a partner?</Heading>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={hasPartner ? selected : card} onClick={() => setHasPartner(true)}>Yes</button>
            <button style={!hasPartner ? selected : card} onClick={() => setHasPartner(false)}>No — solo</button>
          </div>
          {hasPartner && (
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Partner name</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="Ellie" style={{ padding: 8, flex: 1 }} />
                <button onClick={() => setPartnerName(randomPersonName().split(" ")[0])} style={{ padding: "8px 12px" }}>Randomise</button>
              </div>
              <label style={{ display: "block", margin: "12px 0 4px" }}>Their field</label>
              <select value={partnerField} onChange={(e) => setPartnerField(e.target.value as FieldId)} style={{ padding: 8 }}>
                {FIELDS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
          )}
          <Nav />
        </section>
      )}

      {key === "field" && (
        <section>
          <Heading>Pick a field {!isCareer && <span style={{ fontWeight: "normal", color: "#888" }}>(optional)</span>}</Heading>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FIELDS.map((f) => (
              <button key={f.id} style={field === f.id ? selected : card} onClick={() => setField(f.id)}>
                <strong>{f.label}</strong> <span style={{ color: "#888" }}>— {f.flavour}</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setField(randomField())} style={{ padding: "6px 10px" }}>Randomise</button>
          </div>
          <Nav last={!isCareer} />
        </section>
      )}

      {key === "offers" && (
        <section>
          <Heading>The PhD offer draft</Heading>
          <p style={{ color: "#666", marginTop: 0 }}>Choose one. This frames the run.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {offers.map((o) => (
              <button key={o.id} style={offer?.id === o.id ? selected : card} onClick={() => setOffer(o)}>
                <div><strong>{"★".repeat(o.stars)}{"☆".repeat(5 - o.stars)} {o.university}</strong>{o.hotTopic ? " 🔥 hot topic" : ""}</div>
                <div style={{ color: "#555" }}>{o.supervisor} · {o.profile}</div>
                <div style={{ fontSize: 13, color: "#777" }}>
                  Inst-Rep {o.instRep} · Mentoring {o.mentoring} · Team {o.team} · Funding {o.funding}
                </div>
                <div style={{ fontSize: 13, fontStyle: "italic", color: "#555" }}>{o.runFeel}</div>
              </button>
            ))}
          </div>
          <Nav canNext={!!offer} />
        </section>
      )}

      {key === "name" && (
        <section>
          <Heading>Your name</Heading>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Anonymous" style={{ padding: 8, flex: 1 }} />
            <button onClick={() => setName(randomPersonName())} style={{ padding: "8px 12px" }}>Randomise</button>
          </div>
          <Nav last={isCareer} />
        </section>
      )}
    </main>
  );
}
