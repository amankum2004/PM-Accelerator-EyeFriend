from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import scene, ocr, currency, shopping

app = FastAPI(title="EyeFriend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scene.router, prefix="/api/scene", tags=["Scene"])
app.include_router(ocr.router, prefix="/api/ocr", tags=["OCR"])
app.include_router(currency.router, prefix="/api/currency", tags=["Currency"])
app.include_router(shopping.router, prefix="/api/shopping", tags=["Shopping"])

@app.get("/health")
def health():
    return {"status": "ok"}
