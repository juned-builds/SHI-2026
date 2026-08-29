# Content Transformation Platform (SIH 26154)

## 1. Project Name
**Gen AI Platform for Automated Content Transformation**

---

## 2. Problem Statement
**SIH 26154 — Gen AI Platform for Automated Content Transformation**

---

## 3. Project Purpose
The platform automates the transformation of multimodal source materials (plain text, PDFs, DOCX documents, images, research articles, and corporate reports) into multiple customized deliverables from a single unified source.

Target deliverables will include:
* Executive summaries & policy briefs
* LinkedIn and X/Twitter social posts
* Official advisories & notices
* Pitch decks and presentations with speaker notes
* Video production packages (scripts, scene breakdowns, narration, subtitles)
* Infographic-ready structured data

---

## 4. Current Implementation Status
> **Current Milestone: Module 0.1 — Portable Project Foundation**
>
> Only the modular foundation and local-first architecture have currently been implemented. Application logic, database persistence, document parsers, and AI models will be integrated sequentially in upcoming modules.

---

## 5. Architecture

```text
Next.js Frontend (Port 3000)
       ↓
FastAPI Backend (Port 8000)
       ↓
Future services (To be added in subsequent modules):
- Database (PostgreSQL / Local persistence)
- Storage (Object store / Local asset storage)
- Gemini / GenAI Engine
- Multimodal Parser Pipeline
```

---

## 6. Local Setup & Running the Project

Follow these steps to run the frontend and backend locally in VS Code or any standard terminal environment.

### Prerequisites
* **Node.js**: v18+ or v20+ / v22+
* **Python**: 3.10+
* **npm** or **pnpm** / **yarn**

---

### Step A: Backend Setup (FastAPI)

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python3 -m venv .venv
   ```

3. Activate the virtual environment:
   * **macOS / Linux**:
     ```bash
     source .venv/bin/activate
     ```
   * **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```

4. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Copy the environment configuration template:
   ```bash
   cp .env.example .env
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

7. Verify backend health check:
   * URL: [http://localhost:8000/api/health](http://localhost:8000/api/health)
   * Expected response:
     ```json
     {
       "status": "ok",
       "service": "content-transformation-api"
     }
     ```
   * Swagger Documentation: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

---

### Step B: Frontend Setup (Next.js)

1. Open a second terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Copy the environment configuration template:
   ```bash
   cp .env.example .env.local
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   * [http://localhost:3000](http://localhost:3000)

---

## 7. Running Backend Tests

From the `backend/` directory with the virtual environment activated:
```bash
pytest
```
