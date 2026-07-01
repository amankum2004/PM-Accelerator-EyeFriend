import { useState } from "react";

interface ComparePanelProps {
  onCompare: (blob1: Blob, blob2: Blob, criteria: string) => void;
  isLoading: boolean;
  captureFrame: () => Promise<Blob | null>;
}

const CRITERIA_OPTIONS = [
  "Nutritional information",
  "Price",
  "Sugar content",
  "Calories",
  "Ingredients",
  "Expiry date",
  "Fat content",
  "Protein content",
];

export function ComparePanel({ onCompare, isLoading, captureFrame }: ComparePanelProps) {
  const [product1, setProduct1] = useState<Blob | null>(null);
  const [product2, setProduct2] = useState<Blob | null>(null);
  const [criteria, setCriteria] = useState("Nutritional information");
  const [customCriteria, setCustomCriteria] = useState("");

  const captureProduct1 = async () => {
    const blob = await captureFrame();
    if (blob) setProduct1(blob);
  };

  const captureProduct2 = async () => {
    const blob = await captureFrame();
    if (blob) setProduct2(blob);
  };

  const handleCompare = () => {
    if (!product1 || !product2) return;
    const finalCriteria = customCriteria.trim() || criteria;
    onCompare(product1, product2, finalCriteria);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        width: "100%",
        maxWidth: 640,
        background: "#1a1a2e",
        borderRadius: 16,
        padding: 24,
      }}
    >
      <h2 style={{ color: "#5ba3d0", margin: 0, fontSize: 20 }}>Compare Two Products</h2>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={captureProduct1}
          aria-label="Capture first product"
          style={captureStyle(!!product1)}
        >
          {product1 ? "✅ Product 1 captured" : "📸 Capture Product 1"}
        </button>
        <button
          onClick={captureProduct2}
          aria-label="Capture second product"
          style={captureStyle(!!product2)}
        >
          {product2 ? "✅ Product 2 captured" : "📸 Capture Product 2"}
        </button>
      </div>

      <label style={{ color: "#ccc", fontSize: 16 }}>
        Compare by:
        <select
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
          aria-label="Comparison criteria"
          style={selectStyle}
        >
          {CRITERIA_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <label style={{ color: "#ccc", fontSize: 16 }}>
        Or type custom criteria:
        <input
          type="text"
          value={customCriteria}
          onChange={(e) => setCustomCriteria(e.target.value)}
          placeholder="e.g. sodium content"
          aria-label="Custom comparison criteria"
          style={inputStyle}
        />
      </label>

      <button
        onClick={handleCompare}
        disabled={!product1 || !product2 || isLoading}
        aria-label="Compare products"
        style={{
          background: !product1 || !product2 || isLoading ? "#333" : "#2a6496",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "18px 24px",
          fontSize: 20,
          fontWeight: 700,
          cursor: !product1 || !product2 || isLoading ? "not-allowed" : "pointer",
          minHeight: 64,
        }}
      >
        ⚖️ Compare Now
      </button>
    </div>
  );
}

const captureStyle = (done: boolean): React.CSSProperties => ({
  background: done ? "#1a4a2e" : "#222",
  color: "#fff",
  border: done ? "2px solid #2ecc71" : "2px solid #555",
  borderRadius: 10,
  padding: "14px 16px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  flex: 1,
  minHeight: 60,
});

const selectStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 8,
  background: "#222",
  color: "#fff",
  border: "2px solid #555",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 16,
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 8,
  background: "#222",
  color: "#fff",
  border: "2px solid #555",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 16,
  boxSizing: "border-box",
};
