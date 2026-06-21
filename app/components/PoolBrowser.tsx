"use client";

import { useEffect, useState } from "react";
import { listCareers, type CareerRow } from "@/lib/pool";

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
    <main style={{ maxWidth: 560, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 4 }}>Tenure Track</h1>
      <p style={{ color: "#666", marginTop: 0 }}>The communal pool — open and continue anyone's run.</p>
      <button onClick={onBack} style={{ padding: "6px 10px", marginBottom: 12 }}>← New game</button>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "#b00" }}>{error}</p>}
      {!loading && !error && rows.length === 0 && <p style={{ color: "#888" }}>The pool is empty. Start a run and save it.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r) => (
          <button key={r.id} onClick={() => onOpen(r.id)} style={{ padding: "10px 12px", textAlign: "left", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>
            <div><strong>{r.title}</strong></div>
            <div style={{ fontSize: 13, color: "#555" }}>
              {r.mode} · {r.scenario} · {r.stage} · term {r.term} · score {r.score}
            </div>
            <div style={{ fontSize: 12, color: "#999" }}>
              last played by {r.last_player ?? "—"} · v{r.version} · {new Date(r.updated_at).toLocaleString()}
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
