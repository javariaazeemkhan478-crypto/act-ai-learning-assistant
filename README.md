<div align="center">

# PathAI

### AI-Powered Full-Stack Learning Platform for AI/ML Students

**Final Project — ACT AI Course · Government of Pakistan**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Live Demo](#) · [Report Bug](https://github.com/javariaazeemkhan478-crypto/act-ai-learning-assistant/issues) · [Request Feature](https://github.com/javariaazeemkhan478-crypto/act-ai-learning-assistant/issues)

</div>

---

## About PathAI

**PathAI** is a production-grade, full-stack AI/ML learning companion built as the **final project** for the **ACT AI Course** offered by the **Government of Pakistan**. It combines modern web engineering with real machine learning algorithms and large language model intelligence to deliver a complete learning ecosystem — from personalized roadmaps and doubt-solving chat to code debugging, ATS resume scoring, and progress analytics.

> **Project Name:** PathAI  
> **Course:** ACT AI (Artificial Intelligence & Machine Learning)  
> **Institution:** Government of Pakistan National AI Initiative  
> **Architecture:** Full-stack monorepo — Next.js 16 frontend + serverless API + PostgreSQL

---

## Key Highlights

| Capability | Description |
|---|---|
| **Personalized AI Roadmaps** | 6–8 week structured curricula tailored to your goal, skill level, and weekly hours |
| **Multimodal AI Tutor** | Context-aware chat with file upload, image analysis, screen capture, and voice input |
| **ML-Powered ATS Scorer** | TF-IDF cosine similarity + keyword coverage + AI/ML skill matching with PDF upload |
| **Resume Scan History** | Persistent scan history saved per authenticated user account |
| **Code Debugger** | Multi-framework error analysis (PyTorch, TensorFlow, Scikit-Learn, Python, etc.) |
| **Study Tools** | 3D flashcards and scored MCQ quizzes on any AI/ML topic |
| **Activity Analytics** | 60-day GitHub-style heatmap, streak tracking, and completion metrics |
| **Secure Authentication** | JWT-based login with bcrypt password hashing and session persistence |

---

## Architecture

```mermaid
flowchart TB
    subgraph Client["React 19 Client (PathAI UI)"]
        Dashboard["Dashboard & Heatmap"]
        Roadmap["Roadmap Generator"]
        Chat["Doubt-Solver Chat"]
        ATS["ATS Resume Scorer"]
        Debug["Code Debugger"]
    end

    subgraph API["Next.js 16 API Routes"]
        Auth["/api/auth/*"]
        Resume["/api/resume/*"]
        ChatAPI["/api/chat/*"]
        ML["TF-IDF ATS Engine"]
    end

    subgraph Data["Persistence Layer"]
        PG["PostgreSQL via Prisma"]
        OR["OpenRouter LLM API"]
    end

    Client --> API
    Auth --> PG
    Resume --> ML
    Resume --> PG
    ChatAPI --> OR
    ChatAPI --> PG
    ML --> PG
```

---

## ML ATS Resume Scorer

PathAI includes a **real machine learning pipeline** — not just LLM guessing — for resume evaluation:

| Algorithm | Weight | Purpose |
|---|---|---|
| **TF-IDF + Cosine Similarity** | 35% | Semantic overlap between resume and job description |
| **Keyword Coverage** | 35% | Match rate of job posting keywords found in resume |
| **AI/ML Skill Detection** | 20% | Domain skill density (PyTorch, MLOps, NLP, etc.) |
| **Section Completeness** | 10% | Standard ATS section header analysis |

**Additional features:**
- PDF resume upload with server-side text extraction (`pdf-parse`)
- Eligibility percentage with tier labels (Highly / Moderately / Low Compatible)
- Missing keyword analysis and actionable improvement suggestions
- **Scan history** — all results saved to your account while signed in
- Export evaluation report as PDF

---

## Data Persistence & Authentication

PathAI uses **JWT authentication** with **PostgreSQL** for all user data:

| Data Type | Saved When Logged In |
|---|---|
| Learning roadmaps & checklist progress | ✅ |
| Chat sessions & messages | ✅ |
| Code debug queries | ✅ |
| ATS resume scans & history | ✅ |
| Streak & activity heatmap | ✅ |

> **Note:** User history is tied to authenticated accounts. Data is **not retained** for guest/unauthenticated sessions. Sign in or create a free account to persist all your learning progress permanently.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Frontend** | React 19, Lucide Icons, Custom CSS Design System |
| **Backend** | Next.js Serverless Route Handlers |
| **Database** | PostgreSQL (Supabase-compatible) via Prisma ORM |
| **Authentication** | JWT (`jsonwebtoken`) + bcrypt password hashing |
| **AI Intelligence** | OpenRouter API (Llama 3.3, DeepSeek R1, Gemini Flash) |
| **ML/NLP** | Custom TF-IDF engine, cosine similarity, keyword extraction |
| **PDF Processing** | pdf-parse (server-side extraction) |
| **Export** | jsPDF + html2canvas |
| **Deployment** | Vercel (single full-stack deployment) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or Supabase)
- OpenRouter API key ([openrouter.ai](https://openrouter.ai))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/javariaazeemkhan478-crypto/act-ai-learning-assistant.git
cd act-ai-learning-assistant

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Configure environment variables
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/pathai_db"
OPENROUTER_API_KEY="your_openrouter_api_key_here"
JWT_SECRET="your_secure_jwt_secret_here"
```

```bash
# 4. Sync database schema
npx prisma db push

# 5. Start development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** → Create an account → Start learning!

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new student account |
| `POST` | `/api/auth/login` | Authenticate and receive JWT |
| `GET` | `/api/auth/me` | Current user profile & streak |
| `POST` | `/api/roadmap/generate` | Generate AI learning roadmap |
| `GET` | `/api/roadmap` | Fetch active roadmap checklist |
| `PATCH` | `/api/roadmap/items/[id]/toggle` | Toggle topic completion |
| `GET/POST` | `/api/chat/sessions` | Manage chat threads |
| `POST` | `/api/chat` | Multimodal doubt-solver chat |
| `POST` | `/api/chat/flashcards` | Generate study flashcards |
| `POST` | `/api/chat/mcqs` | Generate practice MCQs |
| `POST` | `/api/debug` | Code debugger & error explainer |
| `POST` | `/api/resume/score` | ML ATS resume scoring |
| `POST` | `/api/resume/parse-pdf` | Extract text from PDF resume |
| `GET` | `/api/resume/history` | List user's resume scan history |
| `GET/DELETE` | `/api/resume/history/[id]` | View or delete a past scan |
| `GET` | `/api/health` | Server & database connectivity check |
| `GET` | `/api/dashboard` | Activity stats & 60-day heatmap |

---

## Deploy to Vercel

### Step 1 — Create a Supabase Database (required for login)

Vercel **cannot** use `localhost` PostgreSQL. You need a cloud database:

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → Database → Connection Pooling**
3. Copy the **URI** (Transaction mode, port **6543**)
4. It should look like:
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### Step 2 — Push database schema to Supabase

On your local machine, run once with your Supabase direct URL:

```bash
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres" npx prisma db push
```

### Step 3 — Add Vercel Environment Variables

In [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase **pooler** URL (port 6543, with `?pgbouncer=true`) |
| `JWT_SECRET` | Any long random secret string |
| `OPENROUTER_API_KEY` | Your OpenRouter API key |

### Step 4 — Deploy & Verify

1. Redeploy after adding env vars (**Deployments → Redeploy**)
2. Check health: `https://your-app.vercel.app/api/health`
   - `database: "connected"` = login will work
   - `database: "failed"` = fix `DATABASE_URL`

> **Live demo:** [act-ai-learning-assistant-rais.vercel.app](https://act-ai-learning-assistant-rais.vercel.app/)

---

## Project Structure

```
pathai/
├── prisma/
│   └── schema.prisma          # Database models (User, Roadmap, ResumeScan, etc.)
├── src/
│   ├── app/
│   │   ├── api/               # Serverless API route handlers
│   │   ├── layout.js          # Root layout
│   │   └── page.js            # Entry point
│   ├── lib/
│   │   ├── atsScorer.js       # TF-IDF ML scoring engine
│   │   ├── auth.js            # JWT & bcrypt utilities
│   │   ├── openrouter.js      # LLM API client
│   │   └── prisma.js          # Database client
│   ├── App.js                 # Main application UI
│   └── App.css                # Design system & components
├── .env.example
└── README.md
```

---

## Acknowledgements

This project was developed as the **final capstone submission** for the **ACT AI Course** under the **Government of Pakistan's** national artificial intelligence education initiative. PathAI demonstrates applied full-stack engineering, machine learning integration, and AI product design for the next generation of AI/ML practitioners in Pakistan.

---

## License

Licensed under the [MIT License](LICENSE).

---

<div align="center">

**PathAI** · Built with ❤️ for AI/ML learners in Pakistan

*ACT AI Course · Government of Pakistan · 2026*

</div>
