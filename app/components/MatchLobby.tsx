"use client";

import { useState } from "react";
import { AI_PROFILES } from "@/lib/game/ai";
import { FIELDS, randomField, type FieldId } from "@/lib/game/fields";
import type { MatchConfig, PlayerConfig } from "@/lib/game/match";
import { randomPersonName } from "@/lib/game/offers";
import { SCENARIOS } from "@/lib/game/scenarios";
import type { ScenarioId } from "@/lib/game/types";

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
    <main style={{ maxWidth: 560, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 4 }}>Tenure Track — Match</h1>
      <p style={{ color: "#666", marginTop: 0 }}>AI opponents + pass-the-phone. Same scenario, highest score wins.</p>
      <button onClick={onExit} style={{ padding: "4px 8px", fontSize: 12, color: "#888", marginBottom: 12 }}>← main menu</button>

      <h2 style={{ marginBottom: 8 }}>Scenario</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {QUICK.map((id) => (
          <button key={id} onClick={() => setScenario(id)} style={tile(scenario === id)}>{SCENARIOS[id].label}</button>
        ))}
      </div>

      <h2 style={{ margin: "16px 0 8px" }}>Field</h2>
      <select value={field} onChange={(e) => setField(e.target.value as FieldId)} style={{ padding: 8 }}>
        {FIELDS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
      </select>{" "}
      <button onClick={() => setField(randomField())} style={{ padding: "6px 10px" }}>Randomise</button>

      <h2 style={{ margin: "16px 0 8px" }}>Players ({players.length})</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {players.map((p, i) => (
          <div key={i} style={{ border: "1px solid #ccc", padding: 8, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <input value={p.name} onChange={(e) => setP(i, { name: e.target.value })} style={{ padding: 6, width: 140 }} />
            <button onClick={() => setP(i, { name: randomPersonName() })} style={{ padding: "4px 8px", fontSize: 12 }}>🎲</button>
            <button onClick={() => setP(i, { kind: "human", profileId: undefined })} style={tile(p.kind === "human")}>Human</button>
            <button onClick={() => setP(i, { kind: "ai", profileId: p.profileId ?? "careerist" })} style={tile(p.kind === "ai")}>AI</button>
            {p.kind === "ai" && (
              <select value={p.profileId ?? "careerist"} onChange={(e) => setP(i, { profileId: e.target.value })} style={{ padding: 6 }}>
                {AI_PROFILES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            )}
            {players.length > 2 && <button onClick={() => setPlayers((ps) => ps.filter((_, j) => j !== i))} style={{ padding: "4px 8px", fontSize: 12, color: "#b00" }}>remove</button>}
          </div>
        ))}
      </div>
      {players.length < 4 && (
        <button onClick={() => setPlayers((ps) => [...ps, { name: `AI ${ps.length + 1}`, kind: "ai", profileId: "plodder" }])} style={{ padding: "6px 10px", marginTop: 8 }}>
          + Add player
        </button>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={() => onStart({ scenario, field, players })} style={{ padding: "10px 18px", fontSize: 16, fontWeight: "bold", cursor: "pointer" }}>
          Start match ▶
        </button>
      </div>
    </main>
  );
}

function tile(active: boolean): React.CSSProperties {
  return { padding: "6px 12px", border: active ? "2px solid #333" : "1px solid #ccc", background: active ? "#f0f0f0" : "#fff", cursor: "pointer" };
}
