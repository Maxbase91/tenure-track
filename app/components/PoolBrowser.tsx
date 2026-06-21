"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { listCareers, type CareerRow } from "@/lib/pool";
import styles from "./PoolBrowser.module.css";
import tok from "./tokens.module.css";

// Browse the communal pool and open any run to continue it (spec §14).
export function PoolBrowser({ onOpen, onBack }: { onOpen: (id: string) => void; onBack: () => void }) {
  const [rows, setRows] = useState<CareerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCareers(30)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={styles.root}>
      <header>
        <div className={styles.backRow}>
          <motion.button className={tok.btnGhost} onClick={onBack} whileTap={{ scale: 0.97 }}>
            ← New game
          </motion.button>
        </div>
        <p className={styles.kicker}>Communal pool</p>
        <h1 className={styles.title}>Tenure Track</h1>
        <p className={styles.subhead}>Open and continue anyone's run.</p>
      </header>

      {loading && <p className={styles.loading}>Loading…</p>}

      {error && <p className={styles.errorMsg}>{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <div className={styles.emptyCard}>
          <p className={styles.emptyText}>The pool is empty. Start a run and publish it.</p>
        </div>
      )}

      <div className={styles.list}>
        {rows.map((r) => (
          <motion.button
            key={r.id}
            className={styles.runCard}
            onClick={() => onOpen(r.id)}
            whileTap={{ scale: 0.98 }}
          >
            <span className={styles.runTitle}>{r.title}</span>
            <span className={styles.runData}>
              {r.mode} · {r.scenario} · {r.stage} · term {r.term} · score {r.score}
            </span>
            <span className={styles.runMeta}>
              last played by {r.last_player ?? "—"} · v{r.version} · {new Date(r.updated_at).toLocaleString()}
            </span>
          </motion.button>
        ))}
      </div>
    </main>
  );
}
