"use client";

import { isFinished, standings, type Match } from "@/lib/game/match";
import { useMatchStore } from "@/lib/game/matchStore";
import { SCENARIOS } from "@/lib/game/scenarios";
import { GameBoard } from "./GameBoard";
import { MatchLobby } from "./MatchLobby";

// A live scoreboard so the human sees opponents' progress between turns.
function Scoreboard({ match }: { match: Match }) {
  return (
    <section aria-label="Scoreboard" style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, color: "#aaa", textTransform: "uppercase" }}>standings</div>
      {match.players.map((p, i) => (
        <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #eee", fontWeight: i === match.current && match.phase !== "done" ? "bold" : "normal" }}>
          <span>{p.name} {p.kind === "ai" ? `(${p.profile?.label})` : ""}{i === match.current && match.phase !== "done" ? " ←" : ""}</span>
          <span style={{ color: "#666" }}>
            {isFinished(p) ? `done · ${p.state.outcome === "win" ? "🎓" : "💀"} score ${p.state.score}` : `term ${p.state.term} · Rep ${p.state.meters.reputation} · ${p.state.publications}p`}
          </span>
        </div>
      ))}
    </section>
  );
}

export function MatchApp({ onExit }: { onExit: () => void }) {
  const { match, create, ready, act, choose, endTurn, reset } = useMatchStore();

  if (!match) return <MatchLobby onStart={create} onExit={onExit} />;

  const cur = match.players[match.current];

  // Pass-the-phone handoff before a human's turn (hides the prior board).
  if (match.phase === "handoff") {
    return (
      <main style={{ maxWidth: 520, margin: "0 auto", padding: 16, textAlign: "center" }}>
        <h1>Pass the phone</h1>
        <p style={{ fontSize: 18 }}>Hand it to <strong>{cur.name}</strong>.</p>
        <button onClick={ready} style={{ padding: "12px 24px", fontSize: 18, fontWeight: "bold", cursor: "pointer" }}>
          I'm {cur.name} — ready ▶
        </button>
        <div style={{ maxWidth: 420, margin: "20px auto 0", textAlign: "left" }}><Scoreboard match={match} /></div>
      </main>
    );
  }

  // Final standings.
  if (match.phase === "done") {
    const ranked = standings(match);
    return (
      <main style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
        <h1>Match over</h1>
        <p style={{ fontSize: 18 }}>🏆 <strong>{ranked[0].name}</strong> wins with {ranked[0].state.score} points.</p>
        <ol>
          {ranked.map((p) => (
            <li key={p.id} style={{ marginBottom: 4 }}>
              <strong>{p.name}</strong> — score {p.state.score} · {p.state.outcome === "win" ? "🎓 made it" : "💀 fell short"}
              {p.kind === "ai" ? ` (${p.profile?.label})` : ""}
            </li>
          ))}
        </ol>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={reset} style={{ padding: "10px 16px", fontSize: 16, cursor: "pointer" }}>New match</button>
          <button onClick={() => { reset(); onExit(); }} style={{ padding: "10px 16px", fontSize: 16, cursor: "pointer" }}>Main menu</button>
        </div>
      </main>
    );
  }

  // A human is playing their term.
  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 4 }}>Tenure Track — Match</h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        <strong>{cur.name}</strong>'s turn · {SCENARIOS[match.scenario].label}
      </p>
      <GameBoard state={cur.state} onAct={act} onChoose={choose} onEndTurn={endTurn} />
      <Scoreboard match={match} />
    </main>
  );
}
