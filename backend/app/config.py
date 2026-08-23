import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file if present (from project root)
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / ".env")

# Project root: e:/Documents/ML Projects/RAG_ChatBot/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ------------------------------------------------------------------
# File Paths
# ------------------------------------------------------------------
DATASET_PATH = os.getenv("DATASET_PATH", str(BASE_DIR / "final_islamic_dataset.csv"))
INDEX_CACHE_PATH = os.getenv("INDEX_CACHE_PATH", str(BASE_DIR / "faiss_index.bin"))
METADATA_CACHE_PATH = os.getenv("METADATA_CACHE_PATH", str(BASE_DIR / "faiss_metadata.pkl"))
FINE_TUNED_CHECKPOINT = os.getenv(
    "FINE_TUNED_CHECKPOINT", str(BASE_DIR / "hf_islamic_gpt2" / "checkpoint-885")
)

# ------------------------------------------------------------------
# Embedding Model
# ------------------------------------------------------------------
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# ------------------------------------------------------------------
# LLM Configuration
# ------------------------------------------------------------------
DEFAULT_LLM_KEY = os.getenv("DEFAULT_LLM_KEY", "qwen")

MODELS = {
    "qwen": {
        "name": "Qwen 2.5 (0.5B Instruct)",
        "hf_repo": "Qwen/Qwen2.5-0.5B-Instruct",
        "description": "Ultra-fast 0.5B instruct model for CPU inference.",
        "type": "instruct",
    },
    "qwen_1.5b": {
        "name": "Qwen 2.5 (1.5B Instruct)",
        "hf_repo": "Qwen/Qwen2.5-1.5B-Instruct",
        "description": "1.5B parameter instruct model — higher accuracy and strict citation adherence.",
        "type": "instruct",
    },
    "qwen_3b": {
        "name": "Qwen 2.5 (3B Instruct)",
        "hf_repo": "Qwen/Qwen2.5-3B-Instruct",
        "description": "3B parameter instruct model — superior reasoning and strict zero-hallucination grounding.",
        "type": "instruct",
    },
    "qwen_7b": {
        "name": "Qwen 2.5 (7B Instruct)",
        "hf_repo": "Qwen/Qwen2.5-7B-Instruct",
        "description": "7B parameter flagship instruct model — maximum accuracy, reasoning, and strict grounding.",
        "type": "instruct",
    },
    "distilgpt2_finetuned": {
        "name": "Islamic Fine-Tuned DistilGPT2",
        "hf_repo": (
            FINE_TUNED_CHECKPOINT
            if os.path.exists(FINE_TUNED_CHECKPOINT)
            else "distilgpt2"
        ),
        "description": "DistilGPT2 fine-tuned on 20,000+ Islamic texts (checkpoint-885).",
        "type": "causal",
    },
    "distilgpt2": {
        "name": "Base DistilGPT2",
        "hf_repo": "distilgpt2",
        "description": "Standard lightweight DistilGPT2 base model for baseline comparisons.",
        "type": "causal",
    },
}

# ------------------------------------------------------------------
# Guardrail Settings
# ------------------------------------------------------------------
GUARDRAIL_ENABLED: bool = os.getenv("GUARDRAIL_ENABLED", "true").lower() == "true"
TOPIC_THRESHOLD: float = float(os.getenv("TOPIC_THRESHOLD", "0.30"))

REJECTION_MESSAGE: str = (
    "I'm an Islamic knowledge assistant and I'm only able to answer questions about "
    "Islam, the Quran, Hadith, Islamic history, fiqh, and related topics. "
    "Your question appears to be outside my knowledge domain. "
    "Please ask something related to Islamic faith and practice. 🌙"
)

# ------------------------------------------------------------------
# API Settings
# ------------------------------------------------------------------
RATE_LIMIT: str = os.getenv("RATE_LIMIT", "15")  # requests per minute per IP
HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "8000"))
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
