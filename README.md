# 🚀 ACT AI — Full-Stack AI/ML Learning Assistant

ACT AI is an all-in-one, AI-powered learning companion designed specifically for Artificial Intelligence and Machine Learning students. Built with **Next.js 16 (App Router)**, **Prisma ORM**, **Supabase PostgreSQL**, and the **OpenRouter API**, it integrates AI roadmap generation, doubt-solving chat, multi-language code debugging, ATS resume scoring, interactive study tools (flashcards & MCQs), and a 60-day GitHub-style activity heat-grid.

---

## ✨ Features

- **⚡ Custom AI Roadmap Generator**: Enter your goal, skill level, and available hours/week to generate a structured 6-8 week curriculum with interactive checklists.
- **💬 Multimodal Doubt-Solving Chat**: Context-aware AI tutor with Claude-style attachment popovers (File/Code Upload, Image Analysis, and Live Screen Capture) and Voice Speech Input.
- **🐛 Multi-Language Code Debugger**: Paste training code or error traces with automatic framework detection (PyTorch, TensorFlow, Scikit-Learn, JAX, Python, C++, etc.).
- **📄 ATS Resume Scorer**: Upload your resume text/job description for instant ATS-compatibility scoring (/100), keyword gap analysis, and actionable improvements.
- **🎴 3D Study Flashcards & Practice MCQs**: Generate interactive 3D flip cards and scored multiple-choice quizzes on any AI/ML topic.
- **🔥 Streak & Heatmap Tracker**: Consecutive daily activity tracker with 5 customizable color themes (Emerald, Cyberpunk Violet, Cobalt Blue, Sunset Orange, Ruby Red).
- **📥 PDF Roadmap Exporter**: One-click download for offline study plans.
- **🌓 Dark / Light Mode**: Dynamic theme switcher with persisted local state.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Frontend UI**: React 19, Lucide Icons, Custom CSS Utilities, jsPDF, html2canvas
- **Backend API**: Next.js Serverless Route Handlers (`src/app/api/...`)
- **Database**: Supabase PostgreSQL managed via Prisma ORM
- **Authentication**: Custom JWT Authentication (`jsonwebtoken` + `bcryptjs`)
- **AI Intelligence**: OpenRouter API (`meta-llama/llama-3.3-70b-instruct`, `deepseek-r1`, `gemini-2.0-flash`)
- **Deployment**: Vercel (Single Full-Stack Project)

---

## 🚀 Local Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/javariaazeemkhan478-crypto/act-ai-learning-assistant.git
cd act-ai-learning-assistant
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:1234@127.0.0.1:5432/pathai_db"
OPENROUTER_API_KEY="your_openrouter_api_key_here"
JWT_SECRET="pathai-super-secret-jwt-key-2026"
```

### 4. Sync Database Schema
```bash
npx prisma db push
```

### 5. Start Full-Stack Server (Frontend + Backend)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start using ACT AI!

---

## 🌐 Deploy to Vercel (1-Click Setup)

1. Import this repository into **[Vercel](https://vercel.com/dashboard)**.
2. Set **Root Directory** to `./`.
3. Add these Environment Variables in Vercel settings:
   - `DATABASE_URL`: Your Supabase PostgreSQL Connection String
   - `OPENROUTER_API_KEY`: Your OpenRouter API Key
   - `JWT_SECRET`: Your secret JWT key
4. Click **Deploy**. Both the frontend interface and backend serverless API routes will deploy together!

---

## 📜 API Route Endpoints

- `POST /api/auth/register` — Student Registration
- `POST /api/auth/login` — Authentication & JWT Issuance
- `GET  /api/auth/me` — Current User Profile & Streak Details
- `POST /api/roadmap/generate` — Generate AI Curriculum
- `GET  /api/roadmap` — Fetch Active Roadmap Checklist
- `PATCH /api/roadmap/items/[id]/toggle` — Toggle Week Item Completion
- `GET / POST /api/chat/sessions` — Chat Thread Management
- `DELETE /api/chat/sessions/[id]` — Delete Chat Thread
- `POST /api/chat` — Doubt-Solver Multimodal Chat
- `POST /api/chat/flashcards` — Generate 3D Study Flashcards
- `POST /api/chat/mcqs` — Generate Practice MCQs
- `POST /api/debug` — Code Debugger & Error Explainer
- `POST /api/resume/score` — ATS Resume Compatibility Evaluator
- `GET  /api/dashboard` — Activity Stats & 60-Day GitHub Heat-Grid

---

## 📄 License
Licensed under the MIT License.
