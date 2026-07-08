# EyeFriend — Complete Video Processing Workflow

---

## Overview

EyeFriend takes a live camera feed, periodically snapshots a frame, sends it to
Google Gemini AI, gets a text description back, and speaks it aloud — all in
under 3 seconds, with nothing stored on disk at any point.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Frontend)                          │
│                                                                     │
│  Camera  →  <video>  →  <canvas>  →  JPEG Blob  →  HTTP POST      │
│                                                          │          │
│  Speakers  ←  Web Speech API  ←  Text string  ←  JSON response    │
└─────────────────────────────────────────────────────────────────────┘
                                              │ ▲
                                   HTTP POST  │ │ JSON
                                              ▼ │
┌─────────────────────────────────────────────────────────────────────┐
│                        PYTHON SERVER (Backend)                      │
│                                                                     │
│   FastAPI  →  scene.py  →  vision_ai.py  →  base64  →  Gemini     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Stage 1 — Camera Access

**File:** `frontend/src/hooks/useCamera.ts`
**Function:** `startCamera()`

```
User clicks "Start Camera"
         │
         ▼
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
         │
         ▼
Browser asks for camera permission
         │
         ▼
OS returns a MediaStream object (live pipe of ~30 frames/sec from sensor)
         │
         ├── stored in streamRef.current (React ref, no re-render on updates)
         │
         └── attached to <video> element via videoRef.current.srcObject = stream
                   │
                   ▼
             video.play() → user sees live camera feed on screen
```

Key points:
- `streamRef` (not state) holds the stream — avoids unnecessary React re-renders
- `useEffect` reattaches the stream if React remounts the `<video>` DOM node
- No video file is created — the stream is raw frames flowing in memory

---

## Stage 2 — Continuous Loop Start

**File:** `frontend/src/hooks/useContinuousMode.ts`
**Function:** `start()` → `loop()`

```
User clicks "🔴 Live Describe"
         │
         ▼
handleToggleContinuous() in App.tsx
         │
         ▼
startContinuous() → sets activeRef.current = true → calls loop()
         │
         ▼
┌─────────────────────────────────────┐
│  while (activeRef.current === true) │
│                                     │
│  1. check busyRef → if true, wait   │
│  2. set busyRef = true              │
│  3. captureFrame()                  │
│  4. describeScene(blob)             │
│  5. onResult(text) → update screen  │
│  6. speak(text)                     │
│  7. sleep(15,000ms)                 │
│  8. set busyRef = false             │
│  9. loop back to step 1             │
└─────────────────────────────────────┘
```

Two control refs:
- `activeRef` — flipped to false by `stop()`, exits the while loop cleanly
- `busyRef` — prevents two Gemini requests running in parallel if a response is slow

---

## Stage 3 — Frame Capture

**File:** `frontend/src/hooks/useCamera.ts`
**Function:** `captureFrame()`

```
<video> element (showing live stream at this exact millisecond)
         │
         ▼
const canvas = document.createElement("canvas")
canvas.width  = video.videoWidth   (e.g. 1280)
canvas.height = video.videoHeight  (e.g. 720)
         │
         ▼
ctx.drawImage(video, 0, 0)
→ freezes the current video frame onto the canvas
→ like taking a screenshot of the video at that instant
         │
         ▼
canvas.toBlob(callback, "image/jpeg", 0.85)
→ compresses the canvas pixels to JPEG format at 85% quality
→ result is ~50–150 KB binary image data (Blob object in browser memory)
         │
         ▼
Returns: Promise<Blob>  (the JPEG image, ready to send)
```

What does NOT happen:
- No video file is saved
- The canvas is a temporary in-memory scratch pad, garbage collected after use
- The Blob lives only in browser RAM until the HTTP request is done

---

## Stage 4 — HTTP Request to Backend

**File:** `frontend/src/api/eyefriend.ts`
**Function:** `describeScene(blob)` → `postImage("/api/scene/describe", blob)`

```
JPEG Blob (~100KB binary)
         │
         ▼
const form = new FormData()
form.append("file", blob, "frame.jpg")
         │
         ▼
fetch("http://localhost:8000/api/scene/describe", {
  method: "POST",
  body: form         ← multipart/form-data encoding (same as HTML file upload)
})
         │
         ▼
HTTP POST travels from browser → FastAPI server (local network)
         │
         ▼
Awaits JSON response...
         │
         ▼
Returns: data.description  (the text string from Gemini)
```

---

## Stage 5 — FastAPI Entry Point

**File:** `backend/main.py`

```
Incoming POST /api/scene/describe
         │
         ▼
CORS middleware checks origin (allows all in dev)
         │
         ▼
Routes to → scene.router (registered at prefix /api/scene)
         │
         ▼
scene.describe_scene() handler is called
```

FastAPI's CORS middleware is configured to `allow_origins=["*"]` — this lets
the browser (running on port 5173) talk to the backend (port 8000) without
being blocked by the browser's same-origin security policy.

---

## Stage 6 — Scene Router Receives the Image

**File:** `backend/routers/scene.py`
**Function:** `describe_scene(file: UploadFile)`

```
FastAPI parses the multipart/form-data request
         │
         ▼
file: UploadFile  ← FastAPI's wrapper around the uploaded file
         │
         ▼
image_bytes = await file.read()
→ raw JPEG bytes in Python memory (e.g. b'\xff\xd8\xff\xe0\x00\x10JFIF...')
→ never written to disk
         │
         ▼
Passes image_bytes + SCENE_PROMPT to call_gemini()
         │
         ▼
Returns: { "description": "You are facing the produce aisle..." }
```

The SCENE_PROMPT tells Gemini exactly how to respond:
```
"You are an assistive AI for visually impaired shoppers.
Describe the scene concisely and practically.
Mention key obstacles, directions, distances (in steps), and signage.
Keep it under 3 sentences. Speak directly to the user."
```

---

## Stage 7 — Base64 Encoding + Gemini API Call

**File:** `backend/services/vision_ai.py`
**Function:** `call_gemini(image_bytes, prompt)`

### Why Base64?

Gemini's API accepts JSON. JSON is a text format — it cannot carry raw binary
data directly. Base64 converts binary to safe text:

```
Raw JPEG bytes:   FF D8 FF E0 00 10 4A 46 49 46  (binary, 100,000 bytes)
                            │
                            ▼  base64.b64encode()
Base64 string:    "/9j/4AAQSkZJRgABAQAA..."       (text, ~133,000 characters)
```

Every 3 bytes → 4 ASCII characters. The image grows ~33% in size but can now
sit inside a JSON string safely.

### Building the Payload

```python
payload = {
    "contents": [{
        "parts": [
            { "text": SCENE_PROMPT },         ← instruction to the model
            { "inline_data": {
                "mime_type": "image/jpeg",
                "data": base64_string         ← the image
            }}
        ]
    }]
}
```

### Sending to Gemini

```
payload (JSON, ~180KB)
         │
         ▼
httpx.AsyncClient.post(
  "https://generativelanguage.googleapis.com/v1beta/
   models/gemini-2.0-flash:generateContent?key=AIza...",
  json=payload,
  timeout=15.0
)
         │
         ▼
Google's servers receive the request
```

`httpx.AsyncClient` is used (not `requests`) because FastAPI is async — using
a sync HTTP client here would block the entire server while waiting for Gemini.

---

## Stage 8 — What Gemini Does Internally

Gemini 2.0 Flash is a multimodal model trained on hundreds of millions of
image-text pairs. Here's a simplified view of what happens on Google's servers:

```
JPEG bytes decoded to pixel array
         │
         ▼
Vision Transformer (ViT) encoder:
  - splits image into 16×16 pixel patches
  - each patch → vector of numbers (embedding)
  - captures shapes, colours, edges, spatial relationships
  - output: sequence of image embeddings representing "what is in the image"
         │
         ▼
Combined with text prompt embeddings
         │
         ▼
Transformer language model decoder:
  - attends to both image and text context simultaneously
  - predicts next token (word piece), then next, then next...
  - "You" → "are" → "facing" → "the" → "produce" → "section"...
         │
         ▼
Stops when it reaches sentence limit (guided by prompt: "under 3 sentences")
         │
         ▼
Returns JSON:
{
  "candidates": [{
    "content": {
      "parts": [{ "text": "You are facing the produce section..." }]
    }
  }]
}
```

Gemini doesn't truly "understand" — it maps visual statistical patterns to
language patterns learned during training. But with enough training data, those
patterns generalise well to real-world scenes.

---

## Stage 9 — Response Travels Back

```
Google servers → HTTPS response
         │
         ▼
vision_ai.py:
  candidates = data["candidates"]
  text = candidates[0]["content"]["parts"][0]["text"].strip()
  return text
         │
         ▼
scene.py:
  return { "description": text }
         │
         ▼
FastAPI serialises to JSON, sends HTTP 200 response
         │
         ▼
eyefriend.ts:
  const data = await res.json()
  return data.description    ← plain string arrives in the browser
         │
         ▼
useContinuousMode.ts:
  onResult(description)  → calls setResult() in App.tsx → text shown on screen
  speak(description)     → passed to useSpeech
```

---

## Stage 10 — Text to Speech

**File:** `frontend/src/hooks/useSpeech.ts`
**Function:** `speak(text)`

```
description string: "You are facing the produce section..."
         │
         ▼
window.speechSynthesis.cancel()
→ stops any currently playing speech (prevents queue buildup)
         │
         ▼
const utterance = new SpeechSynthesisUtterance(text)
utterance.rate = 1.0    (normal speed)
utterance.pitch = 1.0   (normal pitch)
utterance.volume = 1.0  (full volume)
         │
         ▼
window.speechSynthesis.speak(utterance)
         │
         ▼
Browser passes to OS Text-to-Speech engine:
  Windows  → Microsoft Neural TTS
  macOS    → Apple Siri voices
  Linux    → eSpeak / Festival
  Android  → Google TTS
         │
         ▼
TTS engine: text → phonemes → audio waveform → device speakers
```

No external TTS API is called. This is entirely local to the device — zero
latency, zero cost, works offline.

---

## Complete End-to-End Timeline

```
t=0ms      User clicks "🔴 Live Describe"

t=1ms      loop() starts in useContinuousMode.ts
           busyRef = true

t=2ms      captureFrame() called
           canvas.drawImage(video) — freeze current video frame

t=10ms     canvas.toBlob() — JPEG compressed
           Blob ready (~100KB)

t=15ms     fetch() sends HTTP POST to FastAPI
           FormData with JPEG blob

t=20ms     FastAPI receives request
           file.read() → image_bytes in Python memory

t=25ms     base64.b64encode(image_bytes)
           JSON payload built

t=30ms     httpx sends HTTPS POST to Google Gemini

t=800ms–   Gemini processes image + prompt
t=2500ms   Vision encoder + language model runs on Google's TPUs

t=2500ms   JSON response received by FastAPI
           Text extracted from candidates[0]

t=2510ms   HTTP 200 JSON response sent back to browser

t=2520ms   eyefriend.ts receives data.description

t=2521ms   setResult() → text displayed on screen
           speak() → SpeechSynthesisUtterance created

t=2522ms   OS TTS engine starts speaking
           "You are facing the produce section..."

t=17500ms  sleep(15000ms) completes
           busyRef = false
           loop repeats for next frame
```

**Bottleneck:** Steps 800ms–2500ms (Gemini API). Everything else is under 30ms.

---

## Data Privacy — What is Stored

| Data | Stored? | Where | When discarded |
|---|---|---|---|
| Live video stream | No | Browser RAM | Continuously overwritten |
| Captured JPEG frame | No | Browser RAM as Blob | After HTTP request completes |
| image_bytes in Python | No | Python RAM | After function returns |
| base64 string | No | Python RAM | After function returns |
| Text description | No | Browser state (RAM) | On next capture cycle |
| Audio output | No | OS audio buffer | After speaking finishes |

Nothing is written to disk at any stage.

---

## File Reference

| File | Role |
|---|---|
| `frontend/src/hooks/useCamera.ts` | Camera access, frame capture |
| `frontend/src/hooks/useContinuousMode.ts` | Continuous loop controller |
| `frontend/src/hooks/useSpeech.ts` | Text-to-speech output |
| `frontend/src/api/eyefriend.ts` | HTTP calls to backend |
| `frontend/src/App.tsx` | Orchestrates all hooks, UI state |
| `backend/main.py` | FastAPI app, route registration, CORS |
| `backend/routers/scene.py` | /api/scene/describe endpoint |
| `backend/routers/ocr.py` | /api/ocr/read endpoint |
| `backend/routers/currency.py` | /api/currency/identify endpoint |
| `backend/routers/shopping.py` | /api/shopping/identify and /compare |
| `backend/services/vision_ai.py` | Base64 encoding, Gemini API call |
