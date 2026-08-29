# System Architecture — SIH 26154

## Overview
The **Gen AI Platform for Automated Content Transformation** is designed as a local-first, modular full-stack application capable of transforming diverse input media (Text, PDF, DOCX, Images, Articles, Reports) into multiple structured deliverables (Executive Summaries, Social Media Posts, Presentations, Video Packages, Infographics) from a single source.

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│       Next.js 15 (App Router) + TypeScript + Tailwind       │
│                  Running on localhost:3000                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ HTTP / JSON Requests
                               │ (RESTful APIs)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Backend API                           │
│                 FastAPI + Pydantic v2 (Python)              │
│                  Running on localhost:8000                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ Future Service Integrations
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Future Subsystems                        │
│  - Database (PostgreSQL / Local Persistence)                │
│  - Storage (Local / S3 / Object Store)                      │
│  - GenAI Engine (Google Gemini Multimodal API)              │
│  - Parser Pipeline (PDF, DOCX, Image OCR)                   │
│  - Deliverable Generator Engines (Slides, Video Scripts)    │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Organization

```text
project-root/
├── frontend/             # Next.js App Router frontend application
│   ├── app/              # App router pages, layouts, and global styles
│   ├── public/           # Static web assets
│   ├── .env.example      # Frontend environment template
│   ├── package.json      # Frontend npm dependencies and scripts
│   ├── tsconfig.json     # TypeScript configuration
│   ├── tailwind.config.ts# Tailwind CSS configuration
│   └── README.md         # Frontend documentation
│
├── backend/              # FastAPI Python backend application
│   ├── app/
│   │   ├── api/          # API endpoints & route handlers
│   │   │   └── v1/       # Versioned API routes
│   │   ├── core/         # Settings, config, and security
│   │   ├── models/       # Database & internal domain models (future)
│   │   ├── schemas/      # Pydantic validation schemas
│   │   ├── services/     # Business logic & AI pipelines (future)
│   │   └── main.py       # FastAPI application entrypoint
│   ├── tests/            # Pytest test suite
│   ├── .env.example      # Backend environment template
│   ├── requirements.txt  # Python package dependencies
│   └── README.md         # Backend documentation
│
├── docs/                 # Architecture, specifications, and roadmaps
│   ├── architecture.md   # Architecture documentation
│   └── module_roadmap.md # Step-by-step module roadmap
│
├── .gitignore            # Monorepo git ignore rules
└── README.md             # Project-level overview and setup guide
```

---

## Communication Flow
1. **Frontend to Backend**: Standard REST API requests formatted as JSON over HTTP (`http://localhost:8000/api/*`).
2. **CORS Configuration**: Configured in FastAPI to whitelist `http://localhost:3000` during development.
3. **Environment Decoupling**: Frontend and backend are completely decoupled, independently buildable, and portable to any standard VS Code or local machine environment.
