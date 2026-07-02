import { useRef, useState, useCallback } from "react";
import { describeScene } from "../api/eyefriend";

const INTERVAL_MS = 5000; // describe every 5 seconds

export function useContinuousMode(
  captureFrame: () => Promise<Blob | null>,
  speak: (text: string) => void,
  onResult: (text: string) => void
) {
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false); // prevent overlapping requests

  const runOnce = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const blob = await captureFrame();
      if (!blob) return;
      const description = await describeScene(blob);
      if (description) {
        onResult(description);
        speak(description);
      }
    } catch {
      // silently skip failed frames in continuous mode
    } finally {
      busyRef.current = false;
    }
  }, [captureFrame, speak, onResult]);

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    // run immediately, then on interval
    runOnce();
    const tick = () => {
      runOnce();
      timerRef.current = setTimeout(tick, INTERVAL_MS);
    };
    timerRef.current = setTimeout(tick, INTERVAL_MS);
  }, [isRunning, runOnce]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    busyRef.current = false;
  }, []);

  return { isRunning, start, stop };
}
