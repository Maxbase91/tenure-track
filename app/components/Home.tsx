"use client";

// Top-level mode picker: solo (vs the communal pool) or a competitive match
// against AI opponents and pass-the-phone humans (spec §2, §16 M5).
export function Home({ onSolo, onMatch }: { onSolo: () => void; onMatch: () => void }) {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 4 }}>Tenure Track</h1>
      <p style={{ color: "#666", marginTop: 0 }}>A satirical academic-life strategy game.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <button onClick={onSolo} style={btn}>
          <strong>Solo</strong>
          <div style={{ fontSize: 13, color: "#666" }}>Career or quick mode · save to the communal pool</div>
        </button>
        <button onClick={onMatch} style={btn}>
          <strong>Match — AI + hotseat</strong>
          <div style={{ fontSize: 13, color: "#666" }}>2–4 players vs rule-based AIs, pass the phone, highest score wins</div>
        </button>
      </div>
    </main>
  );
}

const btn: React.CSSProperties = {
  padding: "16px 18px",
  fontSize: 17,
  textAlign: "left",
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer",
};
