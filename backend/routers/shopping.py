from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from services.vision_ai import call_gemini

router = APIRouter()


@router.post("/identify")
async def identify_product(file: UploadFile = File(...)):
    prompt = (
        "You are an assistive AI for visually impaired shoppers. "
        "Identify the product in this image. State the brand, product name, variant, and size if visible. "
        "Keep the response short and clear."
    )
    try:
        image_bytes = await file.read()
        result = await call_gemini(image_bytes, prompt)
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
        f"The first image is Product A (left/first) and the second is Product B (right/second). "
        f"Give a clear, concise comparison and state which is better for the given criteria. "
        f"Keep the response under 4 sentences."
    )
    try:
        bytes1 = await file1.read()
        bytes2 = await file2.read()

        import base64
        import httpx
        import os

        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
        GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(bytes1).decode()}},
                        {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(bytes2).decode()}},
                    ]
                }
            ]
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        candidates = data.get("candidates", [])
        if not candidates:
            return {"result": "Could not compare products. Please try again."}

        result = candidates[0]["content"]["parts"][0]["text"].strip()
        return {"result": result}

    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")
