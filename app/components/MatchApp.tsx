"use client";

import { motion } from "framer-motion";
import { isFinished, standings, type Match } from "@/lib/game/match";
import { useMatchStore } from "@/lib/game/matchStore";
import { SCENARIOS } from "@/lib/game/scenarios";
import { GameBoard } from "./GameBoard";
import { MatchLobby } from "./MatchLobby";
import styles from "./MatchApp.module.css";
import tok from "./tokens.module.css";

// A live scoreboard so the human sees opponents' progress between turns.
function ScoreboardDark({ match }: { match: Match }) {
  return (
    <div className={styles.scoreboardDark}>
      <p className={styles.scoreboardDarkKicker}>Standings</p>
      {match.players.map((p, i) => (
        <div key={p.id} className={styles.scoreRowDark}>
          <span
            className={`${styles.scorePlayerDark} ${i === match.current && match.phase !== "done" ? styles.scorePlayerDarkActive : ""}`}
          >
            {p.name}
            {p.kind === "ai" ? ` (${p.profile?.label})` : ""}
            {i === match.current && match.phase !== "done" ? " ←" : ""}
          </span>
          <span className={styles.scoreValueDark}>
            {isFinished(p)
              ? `score ${p.state.score}`
              : `term ${p.state.term} · Rep ${p.state.meters.reputation} · ${p.state.publications}p`}
          </span>
        </div>
      ))}
    </div>
  );
}

function ScoreboardLight({ match }: { match: Match }) {
  return (
    <section className={styles.scoreboardLight} aria-label="Scoreboard">
      <p className={styles.scoreboardLightKicker}>Standings</p>
      {match.players.map((p, i) => (
        <div key={p.id} className={styles.scoreRowLight}>
          <span
            className={`${styles.scorePlayerLight} ${i === match.current && match.phase !== "done" ? styles.scorePlayerLightActive : ""}`}
          >
            {p.name}
            {p.kind === "ai" ? ` (${p.profile?.label})` : ""}
            {i === match.current && match.phase !== "done" ? " ←" : ""}
          </span>
          <span className={styles.scoreValueLight}>
            {isFinished(p)
              ? `done · score ${p.state.score}`
              : `term ${p.state.term} · Rep ${p.state.meters.reputation} · ${p.state.publications}p`}
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
      <div className={styles.handoffRoot}>
        <div className={styles.handoffInner}>
          <p className={styles.handoffKicker}>Pass the phone</p>
          <h1 className={styles.handoffHeading}>{cur.name}'s turn</h1>
          <p className={styles.handoffSub}>Hand it to {cur.name} and let them tap ready.</p>
          <motion.button
            className={`${tok.btnPrimary} ${styles.handoffBtn}`}
            onClick={ready}
            whileTap={{ scale: 0.97 }}
          >
            I'm {cur.name} — Ready
          </motion.button>
          <ScoreboardDark match={match} />
        </div>
      </div>
    );
  }

  // Final standings.
  if (match.phase === "done") {
    const ranked = standings(match);
    return (
      <main className={styles.standingsRoot}>
        <header>
          <p className={styles.standingsKicker}>Final standings</p>
          <h1 className={styles.standingsHeading}>Match over.</h1>
          <p className={styles.standingsWinner}>
            <span className={styles.standingsWinnerName}>{ranked[0].name}</span> earned tenure with {ranked[0].state.score} points.
          </p>
        </header>

        <div className={styles.standingsList}>
          {ranked.map((p, rank) => (
            <div key={p.id} className={styles.standingsRow}>
              <span className={styles.standingsRank}>{rank + 1}.</span>
              <span className={styles.standingsName}>
                {p.name}
                {p.kind === "ai" ? ` (${p.profile?.label})` : ""}
              </span>
              <span className={styles.standingsMeta}>
                <span className={p.state.outcome === "win" ? styles.standingsWinTag : styles.standingsLoseTag}>
                  {p.state.outcome === "win" ? "tenure" : "fell short"}
                </span>
                {" · "}
                score {p.state.score}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.standingsActions}>
          <motion.button className={tok.btnGhost} onClick={reset} whileTap={{ scale: 0.97 }}>
            New match
          </motion.button>
          <motion.button
            className={tok.btnGhost}
            onClick={() => {
              reset();
              onExit();
            }}
            whileTap={{ scale: 0.97 }}
          >
            Main menu
          </motion.button>
        </div>
      </main>
    );
  }

  // A human is playing their term.
  return (
    <main className={styles.playRoot}>
      <header className={styles.playHeader}>
        <button className={styles.playBackBtn} onClick={onExit} aria-label="Main menu">
          ‹
        </button>
        <div className={styles.playHeaderText}>
          <span className={styles.playTitle}>Tenure Track</span>
          <span className={styles.playSubtitle}>
            {cur.name}'s turn · {SCENARIOS[match.scenario].label}
          </span>
        </div>
      </header>

      <div className={styles.device}>
        <GameBoard state={cur.state} onAct={act} onChoose={choose} onEndTurn={endTurn} />
      </div>

      <ScoreboardLight match={match} />
    </main>
  );
}
