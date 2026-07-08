import { useRef, useState, useCallback } from "react";
import { describeScene } from "../api/eyefriend";

// Wait this long after a response finishes before sending the next frame
const DELAY_AFTER_RESPONSE_MS = 15000; // 15 seconds — stays well within free tier limits

export function useContinuousMode(
  captureFrame: () => Promise<Blob | null>,
  speak: (text: string) => void,
  onResult: (text: string) => void
) {
  const [isRunning, setIsRunning] = useState(false);
  const activeRef = useRef(false);   // controls the loop
  const busyRef = useRef(false);     // prevents overlapping requests

  const loop = useCallback(async () => {
    while (activeRef.current) {
      if (busyRef.current) {
        await sleep(500);
        continue;
      }
      busyRef.current = true;
      try {
        const blob = await captureFrame();
        if (!blob || !activeRef.current) break;
        const description = await describeScene(blob);
        if (description && activeRef.current) {
          onResult(description);
          speak(description);
          // wait for speech + a small pause before next capture
          await sleep(DELAY_AFTER_RESPONSE_MS);
        }
      } catch {
        // back off for 20 seconds on any error (e.g. rate limit) before retrying
        await sleep(20000);
      } finally {
        busyRef.current = false;
      }
    }
    setIsRunning(false);
  }, [captureFrame, speak, onResult]);

  const start = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    busyRef.current = false;
    setIsRunning(true);
    loop();
  }, [loop]);

  const stop = useCallback(() => {
    activeRef.current = false;
    busyRef.current = false;
    setIsRunning(false);
  }, []);

  return { isRunning, start, stop };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
