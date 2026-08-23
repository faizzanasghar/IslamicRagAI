#!/bin/bash
# ============================================================
# Islamic RAG Chatbot — Linux/macOS Backend Startup Script
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo " ========================================================"
echo "  Islamic RAG Chatbot — FastAPI Backend"
echo " ========================================================"
echo ""

# Activate virtual environment
if [ -d ".venv" ]; then
    echo "[INFO] Activating .venv..."
    source .venv/bin/activate
elif [ -d "venv" ]; then
    echo "[INFO] Activating venv..."
    source venv/bin/activate
else
    echo "[WARN] No virtual environment found. Using system Python."
fi

# Install/update dependencies
echo "[INFO] Installing backend dependencies..."
pip install -r backend/requirements.txt -q

# Build FAISS index if missing
if [ ! -f "faiss_index.bin" ]; then
    echo "[INFO] FAISS index not found. Building from dataset..."
    python backend/build_index.py
else
    echo "[INFO] FAISS index found — skipping rebuild."
fi

# Start server
echo ""
echo "[INFO] Starting FastAPI server at http://localhost:8000"
echo "[INFO] API Docs: http://localhost:8000/docs"
echo "[INFO] Press Ctrl+C to stop."
echo ""
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend
