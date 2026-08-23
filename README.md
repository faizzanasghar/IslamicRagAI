# 🕌 Islamic RAG Chatbot

A production-ready, CPU-efficient Retrieval-Augmented Generation (RAG) chatbot
specialized exclusively for Islamic knowledge — Quran, Hadith, Islamic history, and fiqh.

![Islamic RAG AI](https://img.shields.io/badge/RAG-Islamic%20Knowledge-emerald?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-2.0-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![FAISS](https://img.shields.io/badge/FAISS-Vector%20Search-blue?style=for-the-badge)

---

## 📐 Architecture

```
User Query
    │
    ▼
┌──────────────────────────────────────────────┐
│  Islamic Topic Guardrail                     │
│  (keyword fast-reject + cosine similarity)   │
└──────────────────┬───────────────────────────┘
                   │ Islamic? ✅
                   ▼
┌──────────────────────────────────────────────┐
│  FAISS Vector Search                         │
│  (SentenceTransformers all-MiniLM-L6-v2)    │
│  → Top-K Islamic passages retrieved          │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  LLM Generation (choose one):                │
│  • Qwen 2.5 0.5B Instruct (recommended)     │
│  • Islamic Fine-Tuned DistilGPT2            │
│  • Base DistilGPT2                           │
└──────────────────┬───────────────────────────┘
                   │ SSE Streaming
                   ▼
         React Frontend (Vite)
```

## ✨ Key Features

| Feature | Description |
|---|---|
| 🛡️ **Islamic-Only Guardrail** | Keyword + cosine similarity filter — off-topic queries declined instantly |
| ⚡ **SSE Token Streaming** | Answers stream live via Server-Sent Events — no waiting on CPU |
| 🔍 **FAISS Vector Search** | 20,000+ Islamic texts indexed — pre-built cache for instant startup |
| 🤖 **Multi-Model** | Switch between Qwen 2.5 (0.5B), Islamic DistilGPT2, and base DistilGPT2 |
| 📱 **Mobile Responsive** | Full mobile UI with collapsible sidebar |
| 📖 **Markdown Rendering** | Rich text AI answers with bold, lists, and blockquotes |
| 🌙 **Dark Islamic Design** | Glassmorphism, emerald/teal palette, Arabic typography |
| 🔬 **RAG Inspector** | Debug raw FAISS vector matches and cosine similarity scores |
| 📊 **Dataset Explorer** | Browse 20K+ Quranic verses and Hadiths |

## 📂 Project Structure

```
RAG_ChatBot/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes (SSE streaming, rate limiting)
│   │   ├── rag_engine.py    # RAG pipeline (search, generate, stream)
│   │   ├── guardrail.py     # Islamic topic classifier
│   │   └── config.py        # Environment-aware configuration
│   ├── build_index.py       # One-time FAISS index builder
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Root — SSE handler, mobile state
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx       # Textarea chat input
│   │   │   ├── MessageBubble.jsx    # Markdown + streaming bubble
│   │   │   ├── Sidebar.jsx          # Categorized prompt library
│   │   │   ├── Header.jsx           # Nav + mobile hamburger
│   │   │   ├── WelcomeBanner.jsx    # First-visit onboarding modal
│   │   │   ├── RagInspector.jsx     # FAISS debug view
│   │   │   ├── DatasetExplorer.jsx  # Dataset browser
│   │   │   └── SettingsModal.jsx    # Model + param settings
│   │   └── index.css        # Full design system
│   └── package.json
├── final_islamic_dataset.csv # ~26MB Islamic knowledge base
├── faiss_index.bin           # Pre-built vector index (~32MB)
├── faiss_metadata.pkl        # Document metadata cache
├── docker-compose.yml        # Docker deployment
├── Dockerfile.backend
├── Dockerfile.frontend
├── run_backend.bat           # Windows quick-start
├── run_backend.sh            # Linux/macOS quick-start
└── .env.example              # Configuration template
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.10+ with `pip`
- Node.js 18+

### 1. Clone and set up environment

```bash
# Copy environment config
cp .env.example .env

# (Optional) Create virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 2. Build the FAISS index (if not already built)

```bash
# Only needed once; faiss_index.bin already exists in repo
python backend/build_index.py
```

### 3. Start the backend

**Windows:**
```bat
run_backend.bat
```

**Linux/macOS:**
```bash
bash run_backend.sh
```

Or manually:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend
```

Backend available at: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: **http://localhost:3000**

---

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Frontend: http://localhost:80
# Backend API: http://localhost:8000
```

> **Note:** Large files (`final_islamic_dataset.csv`, `faiss_index.bin`, `faiss_metadata.pkl`) are mounted as volumes — no need to copy them into Docker images.

---

## 🤖 Model Comparison

| Model | Size | Speed (CPU) | Quality | Best For |
|---|---|---|---|---|
| **Qwen 2.5 0.5B Instruct** | ~1GB | ~8-15s | ⭐⭐⭐⭐⭐ | Production (Recommended) |
| **Islamic Fine-Tuned DistilGPT2** | ~350MB | ~3-5s | ⭐⭐⭐⭐ | Domain-specific style |
| **Base DistilGPT2** | ~350MB | ~3-5s | ⭐⭐⭐ | Fast baseline |

---

## 🔌 API Reference

### `POST /api/chat/stream` — SSE Streaming Chat *(Primary)*
```json
{
  "query": "What does the Quran say about patience?",
  "model_key": "qwen",
  "top_k": 3,
  "temperature": 0.7,
  "max_new_tokens": 150
}
```

SSE Event types:
- `token` — partial response chunk
- `done` — full completion with sources & timing
- `off_topic` — Islamic guardrail rejection
- `model_loading` — LLM still loading; returns vector results
- `error` — generation error

### `POST /api/chat` — Non-Streaming *(Fallback)*
### `POST /api/retrieve` — Raw FAISS vector search
### `GET /api/health` — Backend status
### `GET /api/stats` — Index statistics
### `GET /api/dataset/sample` — Random dataset samples

---

## ⚙️ Configuration (.env)

| Variable | Default | Description |
|---|---|---|
| `GUARDRAIL_ENABLED` | `true` | Enable Islamic topic filter |
| `TOPIC_THRESHOLD` | `0.30` | Cosine similarity threshold |
| `DEFAULT_LLM_KEY` | `qwen` | Default model |
| `RATE_LIMIT` | `15` | Requests/minute per IP |
| `PORT` | `8000` | Backend port |
| `LOG_LEVEL` | `INFO` | Logging verbosity |

---

## 📊 Dataset

| Source | Contents |
|---|---|
| `final_islamic_dataset.csv` | 20,000+ Quranic verses & Hadiths (English, Arabic) |
| `Quran-Database-main/quran.db` | Full Quran SQLite database |
| `multilingual_dataset/` | Quran in 22 languages (English, Urdu, Arabic, etc.) |

---

## 🛡️ Islamic Guardrail Details

The guardrail uses a two-stage approach — no extra model or RAM required:

1. **Keyword Fast-Reject** (O(1)): Instantly rejects obvious non-Islamic terms like "python", "weather", "bitcoin"
2. **Islamic Override** (O(1)): Instantly accepts explicit Islamic terms like "Allah", "Quran", "Hadith", "salah"
3. **Semantic Similarity** (~2ms): Encodes query with the already-loaded SentenceTransformer and computes cosine similarity against 50+ pre-computed Islamic anchor phrase embeddings

---

## 📜 Disclaimer

This AI assistant generates answers from its training data and an Islamic knowledge corpus. It should not replace advice from qualified Islamic scholars. Always verify important religious matters with a certified scholar or institution.

---

*Built with ❤️ for the Ummah*
