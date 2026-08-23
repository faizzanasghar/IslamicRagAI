import json
import logging
import time
import threading
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sse_starlette.sse import EventSourceResponse

from app.rag_engine import rag_engine
from app.config import MODELS, DEFAULT_LLM_KEY, RATE_LIMIT, REJECTION_MESSAGE

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rag_api")

# ------------------------------------------------------------------
# Rate Limiter
# ------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{RATE_LIMIT}/minute"])

# ------------------------------------------------------------------
# Startup / Shutdown
# ------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Islamic RAG Chatbot API...")
    try:
        rag_engine.initialize()
        # Kick off default LLM loading in background so first query is faster
        def _preload():
            try:
                rag_engine.load_llm(DEFAULT_LLM_KEY)
            except Exception as e:
                logger.warning(f"Background LLM preload failed (non-critical): {e}")
        threading.Thread(target=_preload, daemon=True).start()
    except Exception as e:
        logger.error(f"RAG Engine initialization failed: {e}")
    yield
    logger.info("Shutting down Islamic RAG Chatbot API...")

# ------------------------------------------------------------------
# FastAPI App
# ------------------------------------------------------------------

app = FastAPI(
    title="Islamic RAG Chatbot API",
    description=(
        "Production FastAPI backend for an Islamic knowledge RAG chatbot. "
        "Uses FAISS vector search + Qwen/DistilGPT2 LLM generation, "
        "with a topic guardrail that restricts responses to Islamic content only."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Request / Response Models
# ------------------------------------------------------------------

class ChatRequest(BaseModel):
    query: str = Field(..., example="What are the rights of a neighbor in Islam?")
    model_key: Optional[str] = Field(default=DEFAULT_LLM_KEY, example="qwen")
    top_k: Optional[int] = Field(default=5, ge=1, le=10)
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=1.0)
    max_new_tokens: Optional[int] = Field(default=250, ge=20, le=512)

class SearchRequest(BaseModel):
    query: str = Field(..., example="Patience in Quran")
    top_k: Optional[int] = Field(default=5, ge=1, le=20)

# ------------------------------------------------------------------
# Middleware — response timing header
# ------------------------------------------------------------------

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time-Ms"] = str(round((time.time() - start) * 1000, 2))
    return response

# ------------------------------------------------------------------
# Health & Metadata Routes
# ------------------------------------------------------------------

@app.get("/api/health", tags=["System"])
def health_check():
    """Returns backend status, device, and readiness."""
    return {
        "status": "healthy" if rag_engine.is_ready else "initializing",
        "ready": rag_engine.is_ready,
        "device": rag_engine.device,
        "indexed_documents": len(rag_engine.documents),
        "loaded_models": list(rag_engine.loaded_llms.keys()),
    }

@app.get("/api/models", tags=["System"])
def get_models():
    """List all supported LLM models and their loading status."""
    return {
        "available_models": list(MODELS.values()),
        "default_model": DEFAULT_LLM_KEY,
        "loaded_models": list(rag_engine.loaded_llms.keys()),
    }

@app.get("/api/stats", tags=["System"])
def get_stats():
    """Retrieve vector index and RAG engine statistics."""
    if not rag_engine.is_ready:
        return {"status": "Not initialized yet"}
    return rag_engine.get_stats()

# ------------------------------------------------------------------
# Vector Retrieval (Inspection)
# ------------------------------------------------------------------

@app.post("/api/retrieve", tags=["RAG"])
@limiter.limit(f"{RATE_LIMIT}/minute")
def retrieve_documents(request: Request, search_req: SearchRequest):
    """Direct FAISS vector retrieval — inspect raw similarity matches."""
    if not search_req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    docs, search_time = rag_engine.search(search_req.query, top_k=search_req.top_k)
    return {
        "query": search_req.query,
        "top_k": search_req.top_k,
        "search_time_ms": search_time,
        "documents": docs,
    }

# ------------------------------------------------------------------
# Non-Streaming Chat (legacy / fallback)
# ------------------------------------------------------------------

@app.post("/api/chat", tags=["RAG"])
@limiter.limit(f"{RATE_LIMIT}/minute")
def chat_with_rag(request: Request, chat_req: ChatRequest):
    """
    Full RAG pipeline (non-streaming).
    Includes Islamic topic guardrail — off-topic queries return HTTP 400.
    """
    if not chat_req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        result = rag_engine.generate(
            query=chat_req.query,
            model_key=chat_req.model_key or DEFAULT_LLM_KEY,
            top_k=chat_req.top_k or 3,
            temperature=chat_req.temperature or 0.7,
            max_new_tokens=chat_req.max_new_tokens or 150,
        )

        if result.get("is_off_topic"):
            raise HTTPException(
                status_code=400,
                detail={
                    "type": "off_topic",
                    "message": result["answer"],
                    "confidence": result.get("confidence", 0.0),
                },
            )

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------------------------------------------
# Streaming Chat — SSE (primary endpoint)
# ------------------------------------------------------------------

@app.post("/api/chat/stream", tags=["RAG"])
async def chat_stream(request: Request, chat_req: ChatRequest):
    """
    Primary streaming chat endpoint using Server-Sent Events (SSE).

    Event types emitted:
      - ``token``        — partial token text chunk
      - ``done``         — generation complete (includes sources & timing)
      - ``off_topic``    — query rejected by Islamic guardrail
      - ``model_loading``— LLM still loading; returns vector results instead
      - ``error``        — generation error
    """
    if not chat_req.query.strip():
        async def _empty():
            yield {
                "data": json.dumps({"type": "error", "message": "Query cannot be empty."})
            }
        return EventSourceResponse(_empty())

    async def event_gen():
        try:
            async for event in rag_engine.astream_generate(
                query=chat_req.query,
                model_key=chat_req.model_key or DEFAULT_LLM_KEY,
                top_k=chat_req.top_k or 3,
                temperature=chat_req.temperature or 0.7,
                max_new_tokens=chat_req.max_new_tokens or 150,
            ):
                yield {"data": json.dumps(event)}
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield {"data": json.dumps({"type": "error", "message": str(e)})}

    return EventSourceResponse(event_gen())

# ------------------------------------------------------------------
# Dataset Explorer
# ------------------------------------------------------------------

@app.get("/api/dataset/sample", tags=["Dataset"])
def get_dataset_sample(limit: int = 10):
    """Return random sample entries from the Islamic dataset."""
    import random
    if not rag_engine.documents:
        return {"samples": []}

    indices = random.sample(
        range(len(rag_engine.documents)), min(limit, len(rag_engine.documents))
    )
    samples = [
        {
            "id": idx,
            "text": rag_engine.documents[idx],
            "source": rag_engine.sources[idx],
        }
        for idx in indices
    ]
    return {"samples": samples, "total_in_db": len(rag_engine.documents)}

# ------------------------------------------------------------------
# Entry Point
# ------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    from app.config import HOST, PORT

    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False, workers=1)
