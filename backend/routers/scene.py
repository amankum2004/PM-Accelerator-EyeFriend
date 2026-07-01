from fastapi import APIRouter, UploadFile, File, HTTPException
from services.vision_ai import call_gemini

router = APIRouter()

SCENE_PROMPT = (
    "You are an assistive AI for visually impaired shoppers. "
    "Describe the scene in this image concisely and practically. "
    "Mention key obstacles, directions, distances (in steps), and any relevant items or signage. "
    "Keep the description under 3 sentences. Speak directly to the user."
)


@router.post("/describe")
async def describe_scene(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        description = await call_gemini(image_bytes, SCENE_PROMPT)
        return {"description": description}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scene description failed: {str(e)}")
