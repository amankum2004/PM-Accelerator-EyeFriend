import { useState, useCallback } from "react";
import { useCamera } from "./hooks/useCamera";
import { useSpeech } from "./hooks/useSpeech";
import { useContinuousMode } from "./hooks/useContinuousMode";
import { CameraFeed } from "./components/CameraFeed";
import { ModeSelector, type Mode } from "./components/ModeSelector";
import { ActionButton } from "./components/ActionButton";
import { StatusBanner } from "./components/StatusBanner";
import { ComparePanel } from "./components/ComparePanel";
import {
  describeScene,
  readText,
  identifyCurrency,
  identifyProduct,
  compareProducts,
} from "./api/eyefriend";

export default function App() {
  const { videoRef, isActive, error: cameraError, startCamera, stopCamera, captureFrame } = useCamera();
  const { speak, stop: stopSpeech } = useSpeech();

  const [mode, setMode] = useState<Mode>("scene");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleResult = useCallback((text: string) => {
    setResult(text);
    setIsError(false);
  }, []);

  const { isRunning: isContinuous, start: startContinuous, stop: stopContinuous } =
    useContinuousMode(captureFrame, speak, handleResult);

  const handleCapture = useCallback(async () => {
    if (!isActive) {
      speak("Camera is not active. Please start the camera first.");
      return;
    }
    const blob = await captureFrame();
    if (!blob) {
      speak("Could not capture image. Please try again.");
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setResult("");
    stopSpeech();

    try {
      let response = "";
      if (mode === "scene") response = await describeScene(blob);
      else if (mode === "ocr") response = await readText(blob);
      else if (mode === "currency") response = await identifyCurrency(blob);
      else if (mode === "shopping") response = await identifyProduct(blob);

      setResult(response);
      speak(response);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setResult(msg);
      setIsError(true);
      speak(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isActive, captureFrame, mode, speak, stopSpeech]);

  const handleCompare = useCallback(
    async (blob1: Blob, blob2: Blob, criteria: string) => {
      setIsLoading(true);
      setIsError(false);
      setResult("");
      stopSpeech();
      try {
        const response = await compareProducts(blob1, blob2, criteria);
        setResult(response);
        speak(response);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Comparison failed. Please try again.";
        setResult(msg);
        setIsError(true);
        speak(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [speak, stopSpeech]
  );

  const handleModeChange = (newMode: Mode) => {
    stopContinuous();
    setMode(newMode);
    setResult("");
    setIsError(false);
    speak(`Mode changed to ${newMode.replace("ocr", "text reading").replace("scene", "scene description")}`);
  };

  const handleStopCamera = () => {
    stopContinuous();
    stopCamera();
  };

  const toggleContinuous = () => {
    if (isContinuous) {
      stopContinuous();
      stopSpeech();
    } else {
      if (!isActive) {
        speak("Please start the camera first.");
        return;
      }
      startContinuous();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d1a",
        color: "#fff",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px",
        gap: 24,
      }}
    >
      {/* Header */}
      <header style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#5ba3d0", margin: 0 }}>
          👁 EyeFriend
        </h1>
        <p style={{ color: "#aaa", fontSize: 16, margin: "8px 0 0" }}>
          AI-powered shopping assistant for visually impaired users
        </p>
      </header>

      {/* Camera error */}
      {cameraError && (
        <div role="alert" style={{ color: "#e74c3c", fontSize: 16, textAlign: "center" }}>
          {cameraError}
        </div>
      )}

      {/* Camera feed */}
      <CameraFeed videoRef={videoRef} isActive={isActive} isContinuous={isContinuous} />

      {/* Camera controls */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <ActionButton
          label={isActive ? "Stop Camera" : "Start Camera"}
          onClick={isActive ? handleStopCamera : startCamera}
          variant={isActive ? "danger" : "success"}
          ariaLabel={isActive ? "Stop camera" : "Start camera"}
        />
        <ActionButton
          label={isContinuous ? "⏹ Stop Live" : "▶ Live Describe"}
          onClick={toggleContinuous}
          variant={isContinuous ? "danger" : "primary"}
          disabled={!isActive}
          ariaLabel={isContinuous ? "Stop continuous description" : "Start continuous scene description"}
        />
        <ActionButton
          label="Stop Speaking"
          onClick={stopSpeech}
          variant="secondary"
          ariaLabel="Stop audio output"
        />
      </div>

      {/* Mode selector */}
      <ModeSelector current={mode} onChange={handleModeChange} />

      {/* Capture button or Compare panel */}
      {mode === "compare" ? (
        <ComparePanel
          onCompare={handleCompare}
          isLoading={isLoading}
          captureFrame={captureFrame}
        />
      ) : (
        <ActionButton
          label={isLoading ? "Processing..." : "📸 Capture & Analyse"}
          onClick={handleCapture}
          disabled={isLoading || !isActive || isContinuous}
          variant="primary"
          ariaLabel="Capture image and analyse"
        />
      )}

      {/* Result */}
      <StatusBanner message={result} isLoading={isLoading} isError={isError} isContinuous={isContinuous} />

      {/* Footer */}
      <footer style={{ color: "#555", fontSize: 13, marginTop: "auto", textAlign: "center" }}>
        EyeFriend MVP — No images are stored. All processing is real-time.
      </footer>
    </div>
  );
}
