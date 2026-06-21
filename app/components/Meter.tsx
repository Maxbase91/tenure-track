// Plain readable meter row. No styling beyond legibility (M1, keep it ugly).
// `muted` is used for the "under the hood" panel (hidden meters surfaced for
// this tuning build).
export function Meter({
  label,
  value,
  unit,
  muted,
}: {
  label: string;
  value: string;
  unit?: string;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: muted ? "4px 0" : "8px 0",
        borderBottom: "1px solid #ddd",
        color: muted ? "#888" : "inherit",
        fontSize: muted ? 13 : "inherit",
      }}
    >
      <span>{label}</span>
      <strong>
        {value}
        {unit ? ` ${unit}` : ""}
      </strong>
    </div>
  );
}
