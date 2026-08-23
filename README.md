# 🕌 Islamic RAG Chatbot

A production-ready, CPU-efficient Retrieval-Augmented Generation (RAG) chatbot
specialized exclusively for Islamic knowledge — Quran, Hadith, Islamic history, and fiqh.

![Islamic RAG AI](https://img.shields.io/badge/RAG-Islamic%20Knowledge-emerald?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-2.0-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![FAISS](https://img.shields.io/badge/FAISS-Vector%20Search-blue?style=for-the-badge)

---

## 📐 Architecture

```text
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
│  (SentenceTransformers all-MiniLM-L6-v2)     │
│  → Top-K Islamic passages retrieved          │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  LLM Generation (choose one):                │
│  • Qwen 2.5 (0.5B, 1.5B, 3B, 7B) Instruct    │
│  • Islamic Fine-Tuned DistilGPT2             │
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
| 🤖 **Multi-Model** | Switch between Qwen 2.5 scale (0.5B, 1.5B, 3B, 7B), Islamic DistilGPT2, and base DistilGPT2 |
| 📱 **Mobile Responsive** | Full mobile UI with collapsible sidebar |
| 📖 **Markdown Rendering** | Rich text AI answers with bold, lists, and blockquotes |
| 🌙 **Dark Islamic Design** | Glassmorphism, emerald/teal palette, Arabic typography |
| 🔬 **RAG Inspector** | Debug raw FAISS vector matches and cosine similarity scores |
| 📊 **Dataset Explorer** | Browse 20K+ Quranic verses and Hadiths |

## 📂 Project Structure

```text
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
│   ├── src/                 # React UI components (Tailwind CSS)
│   ├── index.html           # Vite HTML entry point
│   └── package.json         # Node dependencies
├── scripts/                 # Debugging and testing scripts
│   ├── debug_grounding.py
│   ├── test_grounding_fix.py
│   └── test_model_size_comparison.py
├── Quran-Database-main/     # SQLite Quran database (quran.db)
├── customllm.ipynb          # Jupyter notebook for fine-tuning DistilGPT2
├── final_islamic_dataset.csv# ~26MB Islamic knowledge base
├── faiss_index.bin          # Pre-built vector index (~32MB)
├── faiss_metadata.pkl       # Document metadata cache
├── docker-compose.yml       # Docker deployment config
├── Dockerfile.backend       # Backend Dockerfile
├── Dockerfile.frontend      # Frontend Dockerfile
├── run_backend.bat          # Windows startup script
├── run_backend.sh           # Linux/macOS startup script
├── start.ps1                # PowerShell alternative startup script
└── .env.example             # Configuration template
```

*(Note: The root-level `app.py` is deprecated and no longer used.)*

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.10+ with `pip`
- Node.js 18+

### 1. Clone and Set Up Environment

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
# Only needed once; faiss_index.bin already exists in the repo
python backend/build_index.py
```

### 3. Start the Backend

Use one of the provided startup scripts to automatically detect your environment, install dependencies, and start the server:

**Windows:**
```bat
run_backend.bat
# OR
.\start.ps1
```

**Linux/macOS:**
```bash
bash run_backend.sh
```

Or run manually:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend
```

Backend available at: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: **http://localhost:3000** (or port specified by Vite)

---

## 🐳 Docker Deployment

You can deploy the entire stack using Docker Compose:

```bash
# Build and start all services
docker-compose up --build

# Frontend: http://localhost:80
# Backend API: http://localhost:8000
```

> **Note:** Large files (`final_islamic_dataset.csv`, `faiss_index.bin`, `faiss_metadata.pkl`) are mounted as volumes to save space. They do not need to be copied into the Docker images.

---

## 🤖 Model Comparison & Fine-Tuning

This project supports multiple models ranging from ultra-fast baselines to high-quality instruction-tuned models, allowing you to choose the best fit for your hardware capabilities.

| Model | Size | Hardware Reqs (RAM/VRAM) | Quality | Best For |
|---|---|---|---|---|
| **Qwen 2.5 7B Instruct** | ~14GB | 16GB+ (GPU recommended) | ⭐⭐⭐⭐⭐ | Production server, highest reasoning quality |
| **Qwen 2.5 3B Instruct** | ~6GB | 8GB+ (Good CPU/GPU) | ⭐⭐⭐⭐⭐ | Excellent balance of quality and resource usage |
| **Qwen 2.5 1.5B Instruct**| ~3GB | 4GB+ | ⭐⭐⭐⭐ | Great performance on moderate hardware |
| **Qwen 2.5 0.5B Instruct**| ~1GB | 2GB+ | ⭐⭐⭐ | Fast baseline instruction-following |
| **Islamic Fine-Tuned DistilGPT2** | ~350MB | 1GB+ | ⭐⭐⭐⭐ | Domain-specific Islamic style (Very Fast) |
| **Base DistilGPT2** | ~350MB | 1GB+ | ⭐⭐⭐ | Fallback fast baseline |

### 🛠️ Custom Fine-Tuning
The **Islamic Fine-Tuned DistilGPT2** model was trained using the `customllm.ipynb` notebook included in this repository. It utilizes the `final_islamic_dataset.csv` to adapt the base `distilgpt2` model to Islamic terminology and style. The fine-tuned weights are hosted on Hugging Face at `faizzanasghar/islamicgpt`.

---

## 🔌 API Reference

### `POST /api/chat/stream` — SSE Streaming Chat *(Primary)*
```json
{
  "query": "What does the Quran say about patience?",
  "model_key": "qwen_1.5b",
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

### Additional Endpoints
- `POST /api/chat` — Non-Streaming *(Fallback)*
- `POST /api/retrieve` — Raw FAISS vector search
- `GET /api/health` — Backend status
- `GET /api/stats` — Index statistics
- `GET /api/dataset/sample` — Random dataset samples

---

## ⚙️ Configuration (.env)

| Variable | Default | Description |
|---|---|---|
| `GUARDRAIL_ENABLED` | `true` | Enable Islamic topic filter |
| `TOPIC_THRESHOLD` | `0.30` | Cosine similarity threshold |
| `DEFAULT_LLM_KEY` | `qwen` | Default model (can be `qwen`, `qwen_1.5b`, `qwen_3b`, `qwen_7b`, `finetuned`, etc.) |
| `RATE_LIMIT` | `15` | Requests/minute per IP |
| `PORT` | `8000` | Backend port |
| `LOG_LEVEL` | `INFO` | Logging verbosity |

---

## 📊 Dataset

| Source | Contents |
|---|---|
| `final_islamic_dataset.csv` | 20,000+ Quranic verses & Hadiths (English, Arabic) |
| `Quran-Database-main/quran.db` | Full Quran SQLite database |

*(The `multilingual_dataset/` was removed from the active project as it is unused).*

---

## 🛡️ Islamic Guardrail Details

The guardrail uses a two-stage approach requiring no extra heavy models or RAM:

1. **Keyword Fast-Reject** (O(1)): Instantly rejects obvious non-Islamic terms like "python", "weather", "bitcoin".
2. **Islamic Override** (O(1)): Instantly accepts explicit Islamic terms like "Allah", "Quran", "Hadith", "salah".
3. **Semantic Similarity** (~2ms): Encodes query with the already-loaded SentenceTransformer and computes cosine similarity against 50+ pre-computed Islamic anchor phrase embeddings.

---

## 📜 Disclaimer

This AI assistant generates answers from its training data and an Islamic knowledge corpus. It should not replace advice from qualified Islamic scholars. Always verify important religious matters with a certified scholar or institution.

---

*Built with ❤️ for the Ummah*
