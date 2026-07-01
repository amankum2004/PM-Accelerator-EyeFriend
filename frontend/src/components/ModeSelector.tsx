

export type Mode = "scene" | "ocr" | "currency" | "shopping" | "compare";

const MODES: { id: Mode; label: string; emoji: string; description: string }[] = [
  { id: "scene", label: "Describe Scene", emoji: "🌍", description: "Describes your surroundings" },
  { id: "ocr", label: "Read Text", emoji: "📖", description: "Reads labels, signs, prices" },
  { id: "currency", label: "Currency", emoji: "💵", description: "Identifies bills and coins" },
  { id: "shopping", label: "Identify Product", emoji: "🛒", description: "Names the product" },
  { id: "compare", label: "Compare Products", emoji: "⚖️", description: "Compares two items" },
];

interface ModeSelectorProps {
  current: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeSelector({ current, onChange }: ModeSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Assistant mode"
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        justifyContent: "center",
        width: "100%",
        maxWidth: 700,
      }}
    >
      {MODES.map((m) => (
        <button
          key={m.id}
          role="tab"
          aria-selected={current === m.id}
          aria-label={`${m.label}: ${m.description}`}
          onClick={() => onChange(m.id)}
          style={{
            background: current === m.id ? "#2a6496" : "#222",
            color: "#fff",
            border: current === m.id ? "3px solid #5ba3d0" : "3px solid transparent",
            borderRadius: 12,
            padding: "14px 18px",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            flex: "1 1 120px",
            minHeight: 64,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 24 }}>{m.emoji}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
}
