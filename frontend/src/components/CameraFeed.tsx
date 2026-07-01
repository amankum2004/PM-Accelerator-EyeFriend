import type { RefObject } from "react";

interface CameraFeedProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isActive: boolean;
}

export function CameraFeed({ videoRef, isActive }: CameraFeedProps) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 640,
        aspectRatio: "16/9",
        background: "#111",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "3px solid #2a6496",
      }}
      role="img"
      aria-label="Camera feed"
    >
      {isActive ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <p style={{ color: "#888", fontSize: 18, textAlign: "center", padding: 24 }}>
          Camera is off. Press "Start Camera" to begin.
        </p>
      )}
    </div>
  );
}
