import type { RefObject } from "react";

interface CameraFeedProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  isContinuous?: boolean;
}

export function CameraFeed({ videoRef, isActive, isContinuous }: CameraFeedProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 640,
        aspectRatio: "16/9",
        background: "#111",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `3px solid ${isContinuous ? "#e74c3c" : "#2a6496"}`,
        transition: "border-color 0.3s",
      }}
      role="img"
      aria-label="Camera feed"
    >
      {isActive ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {isContinuous && (
            <div
              aria-label="Live mode active"
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                background: "rgba(231,76,60,0.9)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "pulse 1s infinite" }} />
              LIVE
            </div>
          )}
        </>
      ) : (
        <p style={{ color: "#888", fontSize: 18, textAlign: "center", padding: 24 }}>
          Camera is off. Press "Start Camera" to begin.
        </p>
      )}
    </div>
  );
}
