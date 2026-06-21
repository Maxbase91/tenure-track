"use client";

// Top-level mode picker: solo (vs the communal pool) or a competitive match
// against AI opponents and pass-the-phone humans (spec §2, §16 M5).

import styles from "./Home.module.css";

export function Home({ onSolo, onMatch }: { onSolo: () => void; onMatch: () => void }) {
  return (
    <main className={styles.root}>
      {/* Masthead — feels like opening a journal */}
      <header className={styles.masthead}>
        <p className={styles.kicker}>Vol. I &nbsp;·&nbsp; Your Career Issue</p>
        <h1 className={styles.title}>Tenure Track</h1>
        <hr className={styles.rule} />
        <p className={styles.tagline}>A satirical academic-life strategy game.</p>
      </header>

      {/* Mode selection — two manuscript-style cards */}
      <nav className={styles.modes} aria-label="Game modes">
        <button className={styles.modeCard} onClick={onSolo}>
          <span className={styles.modeLabel}>Solo</span>
          <span className={styles.modeDesc}>
            Career or quick mode — results saved to the communal pool.
          </span>
          <span className={styles.modeArrow} aria-hidden="true">→</span>
        </button>

        <button className={styles.modeCard} onClick={onMatch}>
          <span className={styles.modeLabel}>Match</span>
          <span className={styles.modeDesc}>
            2–4 players vs rule-based AIs — pass the phone, highest score wins.
          </span>
          <span className={styles.modeArrow} aria-hidden="true">→</span>
        </button>
      </nav>

      <footer className={styles.footer}>
        <span>Peer-reviewed by nobody. Published regardless.</span>
      </footer>
    </main>
  );
}
