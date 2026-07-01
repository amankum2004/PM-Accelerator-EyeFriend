from fastapi import APIRouter, UploadFile, File, HTTPException
from services.vision_ai import call_gemini

router = APIRouter()

CURRENCY_PROMPT = (
    "You are an assistive AI for visually impaired users. "
    "Identify any currency notes or coins visible in this image. "
    "State the denomination and currency clearly. "
    "Example: 'Twenty dollar bill detected' or 'Two dollar coin detected'. "
    "If no currency is visible, say so."
)


@router.post("/identify")
async def identify_currency(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        result = await call_gemini(image_bytes, CURRENCY_PROMPT)
        return {"result": result}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Currency identification failed: {str(e)}")
