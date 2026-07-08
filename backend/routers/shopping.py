import os
import base64
import httpx
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


async def _groq_request(payload: dict) -> str:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in your .env file")
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            GROQ_URL,
            json=payload,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        )
        if response.status_code == 429:
            raise ValueError("Rate limit reached. Please wait a moment.")
        if response.status_code != 200:
            raise ValueError(f"Groq API error {response.status_code}: {response.text[:300]}")
    return response.json()["choices"][0]["message"]["content"].strip()


@router.post("/identify")
async def identify_product(file: UploadFile = File(...)):
    prompt = (
        "You are an assistive AI for visually impaired shoppers. "
        "Identify the product in this image. State the brand, product name, variant, and size if visible. "
        "Keep the response short and clear."
    )
    try:
        image_bytes = await file.read()
        encoded = base64.b64encode(image_bytes).decode()
        payload = {
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded}"}},
            ]}],
            "max_tokens": 300,
        }
        result = await _groq_request(payload)
        return {"result": result}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Product identification failed: {str(e)}")


@router.post("/compare")
async def compare_products(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    criteria: str = Form(...),
):
    prompt = (
        f"You are an assistive AI for visually impaired shoppers. "
        f"Compare these two products based on: {criteria}. "
        f"Product A is the first image, Product B is the second. "
        f"Give a concise comparison and state which is better. Keep it under 4 sentences."
    )
    try:
        bytes1 = await file1.read()
        bytes2 = await file2.read()
        enc1 = base64.b64encode(bytes1).decode()
        enc2 = base64.b64encode(bytes2).decode()
        payload = {
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{enc1}"}},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{enc2}"}},
            ]}],
            "max_tokens": 400,
        }
        result = await _groq_request(payload)
        return {"result": result}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")
