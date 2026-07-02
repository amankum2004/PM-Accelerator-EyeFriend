

interface StatusBannerProps {
  message: string;
  isLoading: boolean;
  isError: boolean;
  isContinuous?: boolean;
}

export function StatusBanner({ message, isLoading, isError, isContinuous }: StatusBannerProps) {
  if (!message && !isLoading && !isContinuous) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: isError ? "#5c1a1a" : isLoading ? "#1a3a5c" : "#1a4a2e",
        color: "#fff",
        borderRadius: 12,
        padding: "16px 24px",
        fontSize: 18,
        lineHeight: 1.6,
        width: "100%",
        maxWidth: 640,
        minHeight: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {isLoading ? "Processing... please wait." : isContinuous && !message ? "🔴 Live — listening to your surroundings..." : message}
    </div>
  );
}
