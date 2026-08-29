# Backend — Content Transformation Platform (SIH 26154)

FastAPI service for the AI-powered Content Transformation Platform.

## Tech Stack
- **Framework:** FastAPI
- **Validation:** Pydantic v2 & Pydantic Settings
- **ASGI Server:** Uvicorn
- **Testing:** Pytest & HTTPX / FastAPI TestClient

## Getting Started

### 1. Create and Activate Virtual Environment
```bash
# On macOS/Linux
python3 -m venv .venv
source .venv/bin/activate

# On Windows (PowerShell)
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Run Local Development Server
```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be available at:
- **API Base:** [http://localhost:8000](http://localhost:8000)
- **Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **Interactive Swagger Docs:** [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **ReDoc Documentation:** [http://localhost:8000/api/redoc](http://localhost:8000/api/redoc)

## Running Tests
```bash
pytest
```
