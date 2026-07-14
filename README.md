# EduGenie — AI-Powered Educational Assistant

<div align="center">

![EduGenie Banner](https://img.shields.io/badge/EduGenie-AI%20Learning%20Assistant-7c3aed?style=for-the-badge&logo=graduation-cap)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?style=for-the-badge&logo=google)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python)

**EduGenie** is a modern, single-page AI educational assistant powered by **Google Gemini 2.5 Flash** and **FastAPI**. It helps students learn smarter through intelligent question answering, concept explanations, auto-generated quizzes, smart summarization, and personalized learning roadmaps.

</div>

---

## 🎯 Project Overview

EduGenie was built as a **college final-year project** demonstrating the integration of:
- A production-ready **FastAPI** RESTful backend with modular architecture
- **Google Gemini 2.5 Flash** large language model via the `google-genai` SDK
- A premium, glassmorphic, responsive **single-page frontend** (HTML/CSS/JS)
- **JSON file-based storage** maintaining ER-style relationships across all operations

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤔 **Question Answering** | Ask any educational question and receive a rich, structured markdown answer |
| 🧠 **Concept Explanation** | Deep-dive explanations with analogies, key concepts, examples, and common misconceptions |
| 📝 **Quiz Generation** | Automatically generates 5 interactive multiple-choice questions with explanations |
| 📄 **Text Summarization** | Condenses long articles or textbook chapters into a title, summary, and key points |
| 🗺️ **Learning Path** | Personalized 3-phase (Beginner → Intermediate → Advanced) study roadmaps |
| 💾 **JSON Storage** | Every query, response, quiz, summary, and roadmap is persisted to local JSON files |
| 🔑 **API Key Management** | Use a server-side `.env` key or supply your own key via the in-app Settings panel |
| 📋 **Copy to Clipboard** | One-click copy of any generated content in a clean, readable format |

---

## 📁 Folder Structure

```
EduGenie/
│
├── .env                        # API key configuration (not committed to git)
├── .gitignore                  # Excludes venv, __pycache__, .env, etc.
├── requirements.txt            # Python dependencies
├── README.md                   # This file
│
├── backend/                    # FastAPI application (modular)
│   ├── __init__.py
│   ├── main.py                 # FastAPI app, CORS, all route definitions
│   │
│   ├── modules/                # Domain logic — one file per AI feature
│   │   ├── __init__.py
│   │   ├── qna.py              # Question Answering
│   │   ├── explanation_module.py  # Concept Explanation
│   │   ├── quiz_module.py      # Quiz Generation (structured JSON)
│   │   ├── summary_module.py   # Text Summarization
│   │   └── learning_path.py    # Personalized Learning Path (structured JSON)
│   │
│   ├── services/               # Shared services
│   │   ├── __init__.py
│   │   ├── gemini_service.py   # Google Gemini API client (google-genai SDK)
│   │   └── database_service.py # JSON file read/write with ER-style relationships
│   │
│   └── database/               # JSON flat-file storage
│       ├── users.json          # User sessions (IP-based)
│       ├── queries.json        # All user queries (linked to users)
│       ├── responses.json      # All AI response previews (linked to queries)
│       ├── quiz.json           # Full quiz payloads
│       ├── summary.json        # Full summary payloads
│       └── learning_path.json  # Full learning path payloads
│
└── static/                     # Frontend (served by FastAPI)
    ├── index.html              # Single-page application markup
    ├── style.css               # Premium glassmorphic CSS (dark mode)
    └── script.js               # All frontend logic and API communication
```

---

## 🚀 Installation

### Prerequisites

- Python **3.11+**
- A **Google Gemini API key** — get one free at [aistudio.google.com](https://aistudio.google.com/apikey)

### Step 1 — Clone / Download the project

```bash
git clone <your-repo-url>
cd EduGenie
```

### Step 2 — Create a virtual environment

```bash
python -m venv venv
```

Activate it:
- **Windows:** `venv\Scripts\activate`
- **macOS/Linux:** `source venv/bin/activate`

### Step 3 — Install dependencies

```bash
pip install -r requirements.txt
```

### Step 4 — Configure your API key

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

> **Tip:** You can also skip this step and enter your key directly in the app via the **⚙ Settings** button in the top-right corner of the UI.

---

## ▶️ Running the Project

```bash
python -m uvicorn backend.main:app --port 8000 --reload
```

Then open your browser at: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

> The `--reload` flag enables hot-reloading during development. Remove it for production.

---

## 📡 API Endpoints

All endpoints accept and return **JSON**. The Gemini API key can optionally be passed per-request via the `X-Gemini-API-Key` header.

### `POST /qa` — Question Answering
```json
// Request
{ "input_text": "How does HTTPS encryption work?" }

// Response
{ "type": "markdown", "content": "## How HTTPS Encryption Works\n\n..." }
```

### `POST /explain` — Concept Explanation
```json
// Request
{ "input_text": "Quantum Entanglement" }

// Response
{ "type": "markdown", "content": "## Real-World Analogy\n\n..." }
```

### `POST /quiz` — Quiz Generation
```json
// Request
{ "input_text": "Photosynthesis" }

// Response
{
  "type": "quiz",
  "content": {
    "questions": [
      {
        "question": "What is the primary pigment involved in photosynthesis?",
        "options": ["Melanin", "Chlorophyll", "Carotene", "Hemoglobin"],
        "correct_option_index": 1,
        "explanation": "Chlorophyll absorbs light energy..."
      }
    ]
  }
}
```

### `POST /summarize` — Text Summarization
```json
// Request
{ "input_text": "...long educational text..." }

// Response
{ "type": "markdown", "content": "## Title\n\n## Short Summary\n\n## Key Points\n\n..." }
```

### `POST /learn/recommendations` — Learning Path
```json
// Request
{ "input_text": "Machine Learning" }

// Response
{
  "type": "learning_path",
  "content": {
    "roadmap_title": "Machine Learning Mastery Pathway",
    "overview": "...",
    "milestones": [
      {
        "title": "Beginner Level",
        "duration": "4 weeks",
        "topics": [...],
        "practical_exercises": [...],
        "recommended_resources": [...]
      }
    ]
  }
}
```

### `GET /` — Frontend
Serves the single-page HTML application.

### Interactive API Docs
FastAPI auto-generates interactive documentation at:
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🗄️ Data Storage

EduGenie uses a **JSON flat-file database** following ER-style relationships:

```
users.json          ← session_id (IP-based)
    └── queries.json         ← user_id, task_type, input_text
            └── responses.json   ← query_id, type, content_preview
            └── quiz.json        ← query_id, full MCQ array
            └── summary.json     ← query_id, full summary text
            └── learning_path.json ← query_id, roadmap + milestones
```

Every request is automatically stored — no manual setup required.

---

## 🛠️ Technologies Used

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | 0.110+ | REST API framework |
| **Uvicorn** | 0.29+ | ASGI web server |
| **Google Gemini** (`google-genai`) | 1.0+ | AI language model |
| **Pydantic** | 2.7+ | Request/response validation |
| **Python-dotenv** | 1.0+ | Environment variable management |

### Frontend
| Technology | Purpose |
|---|---|
| **HTML5 / CSS3** | Structure and premium glassmorphic styling |
| **Vanilla JavaScript (ES2020+)** | All interactivity and API communication |
| **Marked.js** (CDN) | Markdown rendering |
| **Font Awesome** (CDN) | Icons |
| **Google Fonts** (Inter, Outfit) | Typography |

### AI Model
| Model | Use Cases |
|---|---|
| **Gemini 2.5 Flash** | Q&A, Explanation, Summary (text output) |
| **Gemini 2.5 Flash** (JSON mode) | Quiz & Learning Path (structured output) |

---

## 🔐 Security Notes

- The `.env` file is **excluded from git** via `.gitignore` — never commit your API key
- API keys provided via the UI are stored only in the browser's `localStorage`
- The server accepts per-request keys via the `X-Gemini-API-Key` header (HTTPS recommended in production)
- CORS is currently set to `*` for development — restrict to your domain in production

---

## 📸 Application Preview

The EduGenie UI features:
- **Dark glassmorphic design** with purple/blue gradient palette
- **Responsive layout** that works on desktop, tablet, and mobile
- **Interactive quiz renderer** with immediate feedback and answer explanations
- **Visual roadmap timeline** for the Learning Path feature
- **Toast notifications** for all success/error states

---

## 👨‍💻 Author

Built as a final-year college project demonstrating modern full-stack AI application development using **Python**, **FastAPI**, and **Google Gemini**.

---

## 📄 License

This project is intended for educational and demonstration purposes.
