"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AI_PROFILES } from "@/lib/game/ai";
import { FIELDS, randomField, type FieldId } from "@/lib/game/fields";
import type { MatchConfig, PlayerConfig } from "@/lib/game/match";
import { randomPersonName } from "@/lib/game/offers";
import { SCENARIOS } from "@/lib/game/scenarios";
import type { ScenarioId } from "@/lib/game/types";
import styles from "./MatchLobby.module.css";
import tok from "./tokens.module.css";

const QUICK: ScenarioId[] = ["phd-crunch", "postdoc-gamble", "new-pi", "tenure-sprint"];

// Configure a competitive match: 2–4 players, each human (pass-the-phone) or a
// rule-based AI, all running the same scenario (spec §16 M5).
export function MatchLobby({ onStart, onExit }: { onStart: (c: MatchConfig) => void; onExit: () => void }) {
  const [scenario, setScenario] = useState<ScenarioId>("postdoc-gamble");
  const [field, setField] = useState<FieldId>("molecular-biology");
  const [players, setPlayers] = useState<PlayerConfig[]>([
    { name: "You", kind: "human" },
    { name: "The Careerist", kind: "ai", profileId: "careerist" },
  ]);

  const setP = (i: number, patch: Partial<PlayerConfig>) =>
    setPlayers((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  return (
    <main className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.backRow}>
          <motion.button className={tok.btnGhost} onClick={onExit} whileTap={{ scale: 0.97 }}>
            ← Main menu
          </motion.button>
        </div>
        <p className={styles.kicker}>Match setup</p>
        <h1 className={styles.title}>Tenure Track</h1>
      </header>

      {/* Scenario section */}
      <section>
        <p className={styles.sectionLabel}>Scenario</p>
        <div className={styles.scenarioScroll}>
          {QUICK.map((id) => (
            <motion.button
              key={id}
              className={`${styles.scenarioTile} ${scenario === id ? styles.scenarioTileActive : ""}`}
              onClick={() => setScenario(id)}
              whileTap={{ scale: 0.97 }}
            >
              <span className={styles.scenarioTileLabel}>{SCENARIOS[id].label}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Field selector */}
      <section>
        <p className={styles.sectionLabel}>Field</p>
        <div className={styles.fieldCard}>
          <select
            className={styles.fieldSelect}
            value={field}
            onChange={(e) => setField(e.target.value as FieldId)}
          >
            {FIELDS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <div className={styles.fieldDivider} />
          <button className={styles.fieldRandomBtn} onClick={() => setField(randomField())}>
            Random
          </button>
        </div>
      </section>

      {/* Players section */}
      <section>
        <p className={styles.sectionLabel}>Players ({players.length})</p>
        <div className={styles.playersList}>
          {players.map((p, i) => (
            <motion.div key={i} className={styles.playerRow} whileTap={{ scale: 0.99 }}>
              <input
                className={styles.playerNameInput}
                value={p.name}
                onChange={(e) => setP(i, { name: e.target.value })}
              />

              <div className={styles.kindPills}>
                <button
                  className={`${styles.kindPill} ${p.kind === "human" ? styles.kindPillActive : ""}`}
                  onClick={() => setP(i, { kind: "human", profileId: undefined })}
                >
                  Human
                </button>
                <button
                  className={`${styles.kindPill} ${p.kind === "ai" ? styles.kindPillActive : ""}`}
                  onClick={() => setP(i, { kind: "ai", profileId: p.profileId ?? "careerist" })}
                >
                  AI
                </button>
              </div>

              {p.kind === "ai" && (
                <select
                  className={styles.aiSelect}
                  value={p.profileId ?? "careerist"}
                  onChange={(e) => setP(i, { profileId: e.target.value })}
                >
                  {AI_PROFILES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              )}

              {players.length > 2 && (
                <button
                  className={styles.removeBtn}
                  onClick={() => setPlayers((ps) => ps.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              )}
            </motion.div>
          ))}

          {players.length < 4 && (
            <motion.button
              className={styles.addPlayerCard}
              onClick={() =>
                setPlayers((ps) => [...ps, { name: `AI ${ps.length + 1}`, kind: "ai", profileId: "plodder" }])
              }
              whileTap={{ scale: 0.98 }}
            >
              + Add player
            </motion.button>
          )}
        </div>
      </section>

      {/* Start button */}
      <div className={styles.startRow}>
        <motion.button
          className={`${tok.btnPrimary} ${styles.startBtn}`}
          onClick={() => onStart({ scenario, field, players })}
          whileTap={{ scale: 0.97 }}
        >
          Start match ▶
        </motion.button>
      </div>
    </main>
  );
}
