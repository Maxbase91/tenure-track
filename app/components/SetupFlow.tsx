"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FIELDS, randomField, type FieldId } from "@/lib/game/fields";
import { generateOffers, randomPersonName, type Offer } from "@/lib/game/offers";
import { SCENARIOS, type SetupConfig } from "@/lib/game/scenarios";
import type { ScenarioId } from "@/lib/game/types";
import { PoolBrowser } from "./PoolBrowser";
import styles from "./SetupFlow.module.css";
import tok from "./tokens.module.css";

// The setup flow (spec §3): one to three screens, every step skippable with
// Randomise. Career: partner → field → PhD offer draft → name. Quick:
// entry-point tile → partner → name → field (optional). Kept ugly (M3).

const QUICK_SCENARIOS: ScenarioId[] = ["phd-crunch", "postdoc-gamble", "new-pi", "tenure-sprint"];

function Stars({ count }: { count: number }) {
  return (
    <span className={styles.offerStars}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < count ? "var(--hl)" : "var(--text3)" }}>
          {i < count ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

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

  const stepNum = String(step + 1).padStart(2, "0");
  const totalNum = String(steps.length).padStart(2, "0");
  const progressPct = ((step + 1) / steps.length) * 100;

  const Nav = ({ canNext = true, last = false }: { canNext?: boolean; last?: boolean }) => (
    <div className={styles.nav}>
      {step > 0 ? (
        <motion.button className={tok.btnGhost} onClick={back} whileTap={{ scale: 0.97 }}>
          ← Back
        </motion.button>
      ) : (
        <div className={styles.navSpacer} />
      )}
      <motion.button
        className={tok.btnPrimary}
        onClick={last ? finish : next}
        disabled={!canNext}
        whileTap={{ scale: 0.97 }}
      >
        {last ? "Start ▶" : "Next →"}
      </motion.button>
    </div>
  );

  if (browsing) return <PoolBrowser onOpen={onOpen} onBack={() => setBrowsing(false)} />;

  return (
    <main className={styles.root}>
      {/* Progress indicator */}
      <div className={styles.progress}>
        <span className={styles.progressCounter}>
          {stepNum} / {totalNum}
        </span>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Scenario step */}
      {key === "scenario" && (
        <section>
          <p className={styles.stepLabel}>Choose your game</p>
          <h2 className={styles.stepHeading}>Pick a scenario</h2>

          <div className={styles.scenarioList}>
            {/* Career mode */}
            <motion.button
              className={`${styles.scenarioCard} ${scenario === "career" ? styles.scenarioCardActive : ""}`}
              onClick={() => setScenario("career")}
              whileTap={{ scale: 0.97 }}
            >
              <span className={styles.scenarioName}>Career</span>
              <span className={styles.scenarioBlurb}>{SCENARIOS.career.blurb}</span>
            </motion.button>

            <p className={styles.scenarioDivider}>Quick mode — pick an entry point</p>

            {QUICK_SCENARIOS.map((id) => (
              <motion.button
                key={id}
                className={`${styles.scenarioCard} ${scenario === id ? styles.scenarioCardActive : ""}`}
                onClick={() => setScenario(id)}
                whileTap={{ scale: 0.97 }}
              >
                <span className={styles.scenarioName}>{SCENARIOS[id].label}</span>
                <span className={styles.scenarioBlurb}>{SCENARIOS[id].blurb}</span>
              </motion.button>
            ))}
          </div>

          <button className={styles.poolLink} onClick={() => setBrowsing(true)}>
            Browse the communal pool →
          </button>

          <Nav />
        </section>
      )}

      {/* Partner step */}
      {key === "partner" && (
        <section>
          <p className={styles.stepLabel}>Collaboration</p>
          <h2 className={styles.stepHeading}>Play with a partner?</h2>

          <div className={styles.partnerRow}>
            <motion.button
              className={`${styles.partnerCard} ${!hasPartner ? styles.partnerCardActive : ""}`}
              onClick={() => setHasPartner(false)}
              whileTap={{ scale: 0.97 }}
            >
              <span className={styles.partnerCardLabel}>Solo run</span>
              <span className={styles.partnerCardSub}>Just you and the institution.</span>
            </motion.button>
            <motion.button
              className={`${styles.partnerCard} ${hasPartner ? styles.partnerCardActive : ""}`}
              onClick={() => setHasPartner(true)}
              whileTap={{ scale: 0.97 }}
            >
              <span className={styles.partnerCardLabel}>Partner run</span>
              <span className={styles.partnerCardSub}>A collaborator shares the load.</span>
            </motion.button>
          </div>

          <AnimatePresence>
            {hasPartner && (
              <motion.div
                className={styles.partnerDetails}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                <div className={styles.partnerForm}>
                  <div>
                    <label className={styles.fieldLabel}>Partner name</label>
                    <div className={styles.inputRow}>
                      <input
                        className={styles.textInput}
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="Ellie"
                      />
                      <button
                        className={styles.btnRandomise}
                        onClick={() => setPartnerName(randomPersonName().split(" ")[0])}
                      >
                        Randomise
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={styles.fieldLabel}>Their field</label>
                    <select
                      className={styles.select}
                      value={partnerField}
                      onChange={(e) => setPartnerField(e.target.value as FieldId)}
                    >
                      {FIELDS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Nav />
        </section>
      )}

      {/* Field step */}
      {key === "field" && (
        <section>
          <p className={styles.stepLabel}>Research field</p>
          <h2 className={styles.stepHeading}>
            Pick a field{" "}
            {!isCareer && (
              <span style={{ fontFamily: "Hanken Grotesk, sans-serif", fontWeight: 400, fontSize: 16, color: "var(--text2)" }}>
                (optional)
              </span>
            )}
          </h2>

          <div className={styles.fieldList}>
            {FIELDS.map((f) => (
              <motion.button
                key={f.id}
                className={`${styles.fieldCard} ${field === f.id ? styles.fieldCardActive : ""}`}
                onClick={() => setField(f.id)}
                whileTap={{ scale: 0.97 }}
              >
                <span className={styles.fieldName}>{f.label}</span>
                <span className={styles.fieldFlavour}>{f.flavour}</span>
              </motion.button>
            ))}
          </div>

          <div className={styles.fieldRandomRow}>
            <button className={styles.poolLink} onClick={() => setField(randomField())}>
              Randomise field
            </button>
          </div>

          <Nav last={!isCareer} />
        </section>
      )}

      {/* Offers step (career only) */}
      {key === "offers" && (
        <section>
          <p className={styles.stepLabel}>PhD offer draft</p>
          <h2 className={styles.stepHeading}>Choose one.</h2>
          <p className={styles.stepSub}>This frames the entire run.</p>

          <div className={styles.offerList}>
            {offers.map((o, idx) => (
              <motion.button
                key={o.id}
                className={`${styles.offerCard} ${idx % 2 === 0 ? styles.offerCardOdd : styles.offerCardEven} ${offer?.id === o.id ? styles.offerCardActive : ""}`}
                onClick={() => setOffer(o)}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.offerTop}>
                  <span className={styles.offerUni}>{o.university}</span>
                  {o.hotTopic && <span className={styles.offerHot}>[hot]</span>}
                </div>
                <Stars count={o.stars} />
                <span className={styles.offerSupervisor}>
                  {o.supervisor} · {o.profile}
                </span>
                <span className={styles.offerStats}>
                  Inst-Rep {o.instRep} · Mentoring {o.mentoring} · Team {o.team} · Funding {o.funding}
                </span>
                <span className={styles.offerFeel}>{o.runFeel}</span>
              </motion.button>
            ))}
          </div>

          <Nav canNext={!!offer} />
        </section>
      )}

      {/* Name step */}
      {key === "name" && (
        <section>
          <p className={styles.stepLabel}>Your identity</p>
          <h2 className={styles.stepHeading}>Your name</h2>

          <div className={styles.nameCard}>
            <label className={styles.fieldLabel}>Scientist name</label>
            <div className={styles.inputRow}>
              <input
                className={styles.textInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Anonymous"
              />
              <button className={styles.btnRandomise} onClick={() => setName(randomPersonName())}>
                Randomise
              </button>
            </div>
          </div>

          <Nav last={isCareer} />
        </section>
      )}
    </main>
  );
}
