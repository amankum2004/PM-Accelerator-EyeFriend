# EyeFriend

AI-powered shopping assistant for visually impaired users.

## Setup

### 1. Get a Gemini API Key

Go to https://aistudio.google.com/app/apikey and create a free API key.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Add your GEMINI_API_KEY to .env
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Features

| Mode | What it does |
|---|---|
| Describe Scene | Audio description of surroundings |
| Read Text | OCR — reads labels, prices, signs, expiry dates |
| Currency | Identifies bills and coins |
| Identify Product | Names brand, product, size |
| Compare Products | Compares two captured products on chosen criteria |

## Docker (optional)

```bash
# From eyefriend/
cp backend/.env.example backend/.env
# Add your GEMINI_API_KEY to backend/.env
docker-compose up --build
```

## Privacy

No images are stored. All frames are processed in real-time and immediately discarded.
