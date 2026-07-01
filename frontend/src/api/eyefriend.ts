const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function postImage(endpoint: string, blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("file", blob, "frame.jpg");
  const res = await fetch(`${BASE_URL}${endpoint}`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Request failed");
  }
  const data = await res.json();
  return data.description || data.text || data.result || "";
}

export async function describeScene(blob: Blob): Promise<string> {
  return postImage("/api/scene/describe", blob);
}

export async function readText(blob: Blob): Promise<string> {
  return postImage("/api/ocr/read", blob);
}

export async function identifyCurrency(blob: Blob): Promise<string> {
  return postImage("/api/currency/identify", blob);
}

export async function identifyProduct(blob: Blob): Promise<string> {
  return postImage("/api/shopping/identify", blob);
}

export async function compareProducts(
  blob1: Blob,
  blob2: Blob,
  criteria: string
): Promise<string> {
  const form = new FormData();
  form.append("file1", blob1, "product1.jpg");
  form.append("file2", blob2, "product2.jpg");
  form.append("criteria", criteria);
  const res = await fetch(`${BASE_URL}/api/shopping/compare`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Comparison failed");
  }
  const data = await res.json();
  return data.result || "";
}
