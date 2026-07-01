from fastapi import APIRouter, UploadFile, File, HTTPException
from services.vision_ai import call_gemini

router = APIRouter()

OCR_PROMPT = (
    "You are an assistive AI for visually impaired shoppers. "
    "Extract and read all visible text from this image including labels, signs, expiry dates, prices, and nutritional info. "
    "Read it naturally as if speaking to the user. If there is no readable text, say so clearly."
)


@router.post("/read")
async def read_text(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        text = await call_gemini(image_bytes, OCR_PROMPT)
        return {"text": text}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text reading failed: {str(e)}")
