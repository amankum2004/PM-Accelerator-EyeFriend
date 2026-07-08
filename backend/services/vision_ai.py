import os
import base64
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


def _encode_image(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")


async def call_vision_ai(image_bytes: bytes, prompt: str) -> str:
    api_key = os.getenv("GROQ_API_KEY", "").strip()

    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in your .env file")

    encoded = _encode_image(image_bytes)

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{encoded}"
                        },
                    },
                ],
            }
        ],
        "max_tokens": 300,
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            GROQ_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )
        if response.status_code == 429:
            raise ValueError("Rate limit reached. Please wait a moment before trying again.")
        if response.status_code != 200:
            raise ValueError(f"Groq API error {response.status_code}: {response.text[:300]}")
        data = response.json()

    return data["choices"][0]["message"]["content"].strip()


# Keep old name as alias so all routers work without changes
call_gemini = call_vision_ai
