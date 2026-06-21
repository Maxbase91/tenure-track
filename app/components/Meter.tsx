// Plain readable meter row. No styling beyond legibility (M0).
export function Meter({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid #ddd",
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
