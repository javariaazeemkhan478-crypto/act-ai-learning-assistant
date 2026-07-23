# PathAI - AI-Powered Learning Companion for AI/ML Students

**PathAI** is a full-stack web application built with **Django REST Framework**, **React**, **PostgreSQL**, and the **OpenRouter API**. It serves as an intelligent learning companion designed specifically to help AI and Machine Learning students plan their study roadmaps, solve conceptual doubts in plain English, debug machine learning code & tensor mismatches, and track their weekly progress.

---

## 🔑 Key Features

### 1. 🛡️ User Authentication (JWT)
- **Token-Based Auth**: Secure user registration, login, and profile management powered by `djangorestframework-simplejwt`.
- **Isolated Student Data**: Each student has their own account, roadmap progress, chat history, and debug history.

### 2. 🗺️ AI-Powered Roadmap Generator & Interactive Checklist
- **Curriculum Personalization**: Accepts student's target field (e.g. *Natural Language Processing*, *Computer Vision*, *MLOps*), current skill level (*Beginner*, *Intermediate*, *Advanced*), and weekly study hours.
- **Structured JSON via OpenRouter**: Calls OpenRouter API using prompt engineering to act as an AI/ML curriculum designer, returning a week-by-week structured curriculum.
- **Interactive Progress Checklist**: React frontend renders the roadmap as an interactive checklist where students can toggle completed topics, view subtopics, and access suggested free learning resources.

### 3. 💬 AI/ML Doubt-Solving Chat
- **Educational System Prompt**: Prompted specifically to act as an encouraging AI/ML tutor that breaks down complex topics (e.g., *Attention Mechanisms*, *Backpropagation*, *Gradient Descent*) into simple terms with everyday analogies and practical ML use cases.
- **Persistent Chat History**: All conversations are stored per-user in PostgreSQL / Django database.
- **Markdown & Code Highlighting**: Rich rendering of code blocks, tables, and bullet points.

### 4. 🐛 ML Code & Model Debugging Helper
- **Tensor & Architecture Debugging**: Dedicated form for students to paste training code or error stack traces (e.g., PyTorch dimension mismatches, shape errors, loss exploding).
- **Practical Fixes**: System prompt instructs the AI to identify root causes (learning rate, channel mismatch, activation choice) and output concise, working code solutions.

### 5. 📊 Real-Time Progress Dashboard
- **Completion Tracking**: Displays % of roadmap completed, total topics completed vs. pending.
- **Activity Metrics**: Shows total AI tutor chats and code debugging queries executed.
- **Quick Action Launchpads**: One-click navigation between features.

---

## 🛠️ Architecture & Tech Stack

- **Backend**: Python 3.14+, Django 5.0+, Django REST Framework, SimpleJWT, CORS Headers
- **Frontend**: React 19, Axios, React Markdown, Remark GFM, Lucide React Icons, Modern Dark Glassmorphism CSS
- **Database**: PostgreSQL (`pathai_db`) / SQLite (for local development testing)
- **AI Integration**: OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`)

---

## 🔌 API Reference Endpoints

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register/` | Register new student account & return JWT |
| **Auth** | `POST` | `/api/auth/login/` | Authenticate student & return access/refresh tokens |
| **Auth** | `GET` | `/api/auth/me/` | Fetch current student profile |
| **Roadmap** | `POST` | `/api/roadmap/generate/` | Generate week-by-week curriculum via OpenRouter |
| **Roadmap** | `GET` | `/api/roadmap/` | Get current active roadmap & checklist items |
| **Roadmap** | `PATCH` | `/api/roadmap/items/<id>/toggle/` | Toggle topic completion status |
| **Chat** | `POST` | `/api/chat/` | Send message to AI/ML tutor |
| **Chat** | `GET` | `/api/chat/history/` | Fetch conversation history |
| **Chat** | `DELETE` | `/api/chat/clear/` | Clear student chat history |
| **Debugger** | `POST` | `/api/debug/` | Submit code/error for AI analysis & fix |
| **Debugger** | `GET` | `/api/debug/history/` | Fetch past debug queries |
| **Dashboard**| `GET` | `/api/dashboard/` | Fetch progress %, topic counts, and activity stats |

---

## 💾 Database Schema (Django Models)

- **`User`**: Built-in Django User model (`username`, `email`, `password`, `first_name`).
- **`Roadmap`**: `user` (FK), `goal`, `level`, `hours_per_week`, `created_at`, `json_content`.
- **`RoadmapItem`**: `roadmap` (FK), `week_number`, `topic`, `subtopics`, `resource_link`, `is_completed`.
- **`ChatMessage`**: `user` (FK), `role` (`user` / `assistant`), `content`, `timestamp`.
- **`DebugQuery`**: `user` (FK), `input_code`, `framework`, `ai_response`, `timestamp`.

---

## 🚀 Setup & Running Locally

### 1. Backend Setup
```bash
cd backend
python -m venv env
# On Windows:
env\Scripts\activate
# On Linux/macOS:
source env/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
