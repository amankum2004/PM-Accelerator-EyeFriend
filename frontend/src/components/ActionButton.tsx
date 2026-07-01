

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "success";
  ariaLabel?: string;
}

const COLORS: Record<string, { bg: string; hover: string }> = {
  primary: { bg: "#2a6496", hover: "#1e4d74" },
  secondary: { bg: "#555", hover: "#333" },
  danger: { bg: "#c0392b", hover: "#922b21" },
  success: { bg: "#1a6b3a", hover: "#145230" },
};

export function ActionButton({
  label,
  onClick,
  disabled = false,
  variant = "primary",
  ariaLabel,
}: ActionButtonProps) {
  const colors = COLORS[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
      style={{
        background: disabled ? "#333" : colors.bg,
        color: disabled ? "#888" : "#fff",
        border: "none",
        borderRadius: 12,
        padding: "20px 28px",
        fontSize: 20,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        minWidth: 160,
        minHeight: 72,
        transition: "background 0.2s",
        flex: "1 1 140px",
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = colors.hover;
      }}
      onMouseLeave={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = colors.bg;
      }}
    >
      {label}
    </button>
  );
}
