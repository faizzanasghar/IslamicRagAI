import time
import os
import pickle
import logging
import asyncio
import threading
import numpy as np
import pandas as pd
# pyrefly: ignore [missing-import]
import faiss
# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer
from pathlib import Path
from typing import List, Dict, Any, Tuple, AsyncGenerator, Optional

from app.config import (
    DATASET_PATH,
    INDEX_CACHE_PATH,
    METADATA_CACHE_PATH,
    EMBEDDING_MODEL_NAME,
    MODELS,
    DEFAULT_LLM_KEY,
    GUARDRAIL_ENABLED,
    TOPIC_THRESHOLD,
    REJECTION_MESSAGE,
)
from app.guardrail import (
    ISLAMIC_ANCHOR_PHRASES,
    check_query,
)

logger = logging.getLogger("rag_engine")
logging.basicConfig(level=logging.INFO)


class RAGEngine:
    def __init__(self):
        self.embedding_model: Optional[SentenceTransformer] = None
        self.faiss_index = None
        self.documents: List[str] = []
        self.sources: List[str] = []
        self.loaded_llms: Dict[str, Any] = {}
        self.loaded_tokenizers: Dict[str, Any] = {}
        self.device = "cpu"
        self.is_ready = False

        # Thread safety locks for lazy loading LLMs
        self._load_locks: Dict[str, threading.Lock] = {}
        self._global_lock = threading.Lock()

        # Guardrail
        self.guardrail_anchors: Optional[np.ndarray] = None

        # Try to detect GPU (not expected in production on this machine)
        try:
            import torch
            if torch.cuda.is_available():
                self.device = "cuda"
            logger.info(f"RAG Engine device: {self.device}")
        except ImportError:
            logger.warning("Torch unavailable — lightweight mode.")

    # ------------------------------------------------------------------
    # Initialization
    # ------------------------------------------------------------------

    def initialize(self):
        """Load dataset, FAISS index (from cache or build), embedding model, and guardrail."""
        logger.info("Initializing RAG Engine...")

        # 1. Load Dataset
        if not os.path.exists(DATASET_PATH):
            raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

        df = pd.read_csv(DATASET_PATH)
        valid_df = df.dropna(subset=["english_text", "source_info"])
        self.documents = valid_df["english_text"].astype(str).tolist()
        self.sources = valid_df["source_info"].astype(str).tolist()
        logger.info(f"Loaded {len(self.documents)} valid texts from dataset.")

        # 2. Load Embedding Model first (needed for building index or guardrail)
        self._ensure_embedding_model()

        # 3. Check cached FAISS index
        if os.path.exists(INDEX_CACHE_PATH) and os.path.exists(METADATA_CACHE_PATH):
            logger.info("Loading cached FAISS index & metadata...")
            try:
                self.faiss_index = faiss.read_index(INDEX_CACHE_PATH)
                with open(METADATA_CACHE_PATH, "rb") as f:
                    meta = pickle.load(f)
                    self.documents = meta["documents"]
                    self.sources = meta["sources"]
                logger.info(f"FAISS Index loaded with {self.faiss_index.ntotal} vectors.")
            except Exception as e:
                logger.error(f"Failed loading cached index: {e}. Rebuilding...")
                self._build_index()
        else:
            self._build_index()

        # 4. Initialize guardrail anchor embeddings
        self._init_guardrail()

        self.is_ready = True
        logger.info("RAG Engine fully initialized and ready.")

    def _ensure_embedding_model(self):
        if self.embedding_model is None:
            logger.info(f"Loading SentenceTransformer: {EMBEDDING_MODEL_NAME}")
            self.embedding_model = SentenceTransformer(
                EMBEDDING_MODEL_NAME, device=self.device
            )

    def _build_index(self):
        """Build FAISS index from scratch and cache to disk."""
        self._ensure_embedding_model()
        logger.info(f"Encoding {len(self.documents)} documents...")

        embeddings = self.embedding_model.encode(
            self.documents,
            batch_size=64,
            show_progress_bar=True,
            normalize_embeddings=True,
        )
        dimension = embeddings.shape[1]

        # Inner Product (cosine similarity on normalized vectors)
        self.faiss_index = faiss.IndexFlatIP(dimension)
        self.faiss_index.add(np.array(embeddings, dtype=np.float32))

        logger.info("Saving FAISS index & metadata cache to disk...")
        faiss.write_index(self.faiss_index, INDEX_CACHE_PATH)
        with open(METADATA_CACHE_PATH, "wb") as f:
            pickle.dump({"documents": self.documents, "sources": self.sources}, f)
        logger.info(f"Index cached with {self.faiss_index.ntotal} vectors.")

    def _init_guardrail(self):
        """Pre-compute Islamic anchor embeddings for topic classification."""
        if not GUARDRAIL_ENABLED:
            logger.info("Guardrail disabled via config.")
            return
        logger.info(f"Pre-computing {len(ISLAMIC_ANCHOR_PHRASES)} Islamic anchor embeddings for guardrail...")
        self.guardrail_anchors = self.embedding_model.encode(
            ISLAMIC_ANCHOR_PHRASES,
            normalize_embeddings=True,
            show_progress_bar=False,
            batch_size=64,
        )
        logger.info("Islamic topic guardrail ready.")

    # ------------------------------------------------------------------
    # Guardrail
    # ------------------------------------------------------------------

    def is_islamic_query(self, query: str) -> Tuple[bool, float]:
        """
        Returns (is_islamic, confidence_score).
        If guardrail is disabled, always returns (True, 1.0).
        """
        if not GUARDRAIL_ENABLED or self.guardrail_anchors is None:
            return True, 1.0

        return check_query(
            query=query,
            anchor_embeddings=self.guardrail_anchors,
            embedding_model=self.embedding_model,
            threshold=TOPIC_THRESHOLD,
        )

    # ------------------------------------------------------------------
    # Vector Search
    # ------------------------------------------------------------------

    def search(self, query: str, top_k: int = 5) -> Tuple[List[Dict[str, Any]], float]:
        """Searches vector index for top_k documents."""
        start_time = time.time()
        self._ensure_embedding_model()

        query_vec = self.embedding_model.encode(
            [query], normalize_embeddings=True, show_progress_bar=False
        )
        scores, indices = self.faiss_index.search(
            np.array(query_vec, dtype=np.float32), top_k
        )

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if 0 <= idx < len(self.documents):
                results.append(
                    {
                        "id": int(idx),
                        "text": self.documents[idx],
                        "source": self.sources[idx],
                        "score": float(score),
                    }
                )

        search_time_ms = round((time.time() - start_time) * 1000, 2)
        return results, search_time_ms

    # ------------------------------------------------------------------
    # LLM Loading (Thread-safe)
    # ------------------------------------------------------------------

    def load_llm(self, model_key: str):
        """Thread-safe lazy loader for LLM models."""
        if model_key not in MODELS:
            model_key = DEFAULT_LLM_KEY

        if model_key in self.loaded_llms:
            return self.loaded_llms[model_key], self.loaded_tokenizers[model_key]

        with self._global_lock:
            if model_key not in self._load_locks:
                self._load_locks[model_key] = threading.Lock()

        # Deduplicate simultaneous load calls for the same model
        with self._load_locks[model_key]:
            if model_key in self.loaded_llms:
                return self.loaded_llms[model_key], self.loaded_tokenizers[model_key]

            model_info = MODELS[model_key]
            repo_or_path = model_info["hf_repo"]
            logger.info(f"Loading LLM '{model_info['name']}' from {repo_or_path}...")

            from transformers import AutoModelForCausalLM, AutoTokenizer
            import torch

            try:
                tokenizer = AutoTokenizer.from_pretrained(repo_or_path)
                if tokenizer.pad_token is None:
                    tokenizer.pad_token = tokenizer.eos_token

                kwargs: Dict[str, Any] = {}
                if self.device == "cuda":
                    kwargs["torch_dtype"] = torch.float16
                    kwargs["device_map"] = "auto"

                model = AutoModelForCausalLM.from_pretrained(repo_or_path, **kwargs)
                model.eval()

                self.loaded_llms[model_key] = model
                self.loaded_tokenizers[model_key] = tokenizer
                logger.info(f"LLM '{model_key}' loaded successfully.")
                return model, tokenizer

            except Exception as e:
                logger.error(f"Failed to load LLM '{model_key}': {e}")
                raise e

    def _build_prompt(
        self,
        query: str,
        docs: List[Dict[str, Any]],
        model_key: str,
        tokenizer: Any,
    ) -> str:
        """Constructs a strictly grounded prompt from retrieved documents for accurate Islamic Q&A and Tafsir."""
        context_str = "\n---\n".join(
            [f"Source: {d['source']}\nText: {d['text']}" for d in docs]
        )
        model_info = MODELS.get(model_key, MODELS[DEFAULT_LLM_KEY])

        if model_info["type"] == "instruct":
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a strict Islamic Knowledge RAG Assistant.\n"
                        "Your TASK is to answer the user's question ONLY using the provided Verified Islamic Context passages below.\n\n"
                        "STRICT GROUNDING RULES:\n"
                        "1. Base EVERY claim strictly on the provided Context. Do NOT use outside knowledge, unverified assumptions, or modern extrapolations.\n"
                        "2. MANDATORY CITATION: For every right, duty, or teaching mentioned, cite the exact source from the context in square brackets, e.g., [Al-Baqarah (Surah 2), Ayah 220] or [An-Nisā’ (Surah 4), Ayah 127].\n"
                        "3. QUOTE / REFERENCE VERBATIM: Quote or reference the exact text from the provided verses/hadiths to support each point.\n"
                        "4. NO HALLUCINATION: If the provided context passages do not mention a specific detail or right, explicitly state that it is not mentioned in the provided sources. Do NOT invent concepts.\n"
                        "5. Format your response cleanly using Markdown headings and bullet points."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Verified Islamic Context:\n{context_str}\n\nQuestion: {query}\n\nGrounded Islamic Answer (with mandatory citations):",
                },
            ]
            return tokenizer.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
        else:
            return (
                f"Verified Islamic Sources:\n{context_str}\n\n"
                f"Question: {query}\n\nGrounded Answer:"
            )

    # ------------------------------------------------------------------
    # Non-streaming Generation (legacy / fallback)
    # ------------------------------------------------------------------

    def generate(
        self,
        query: str,
        model_key: str = DEFAULT_LLM_KEY,
        top_k: int = 5,
        temperature: float = 0.7,
        max_new_tokens: int = 250,
    ) -> Dict[str, Any]:
        """Full RAG pipeline: guardrail → vector search → LLM generation."""
        import torch

        # Guardrail
        is_islamic, confidence = self.is_islamic_query(query)
        if not is_islamic:
            return {
                "query": query,
                "answer": REJECTION_MESSAGE,
                "is_off_topic": True,
                "confidence": confidence,
                "retrieved_documents": [],
                "sources": [],
                "search_time_ms": 0,
                "generation_time_ms": 0,
                "total_time_ms": 0,
                "model_used": "Guardrail",
                "model_key": model_key,
            }

        # 1. Vector Search
        docs, search_time_ms = self.search(query, top_k=top_k)
        unique_sources = list(dict.fromkeys([d["source"] for d in docs]))

        gen_start_time = time.time()
        model_info = MODELS.get(model_key, MODELS[DEFAULT_LLM_KEY])
        answer = ""

        # Ensure model is loaded (thread-safe, waits if loading)
        try:
            model, tokenizer = self.load_llm(model_key)
            do_sample = temperature > 0.1
            gen_kwargs: Dict[str, Any] = {
                "max_new_tokens": min(max_new_tokens, 350),
                "do_sample": do_sample,
                "pad_token_id": tokenizer.eos_token_id,
            }
            if do_sample:
                gen_kwargs["temperature"] = float(temperature)
                gen_kwargs["top_p"] = 0.9

            prompt = self._build_prompt(query, docs, model_key, tokenizer)
            inputs = tokenizer([prompt], return_tensors="pt").to(model.device)

            with torch.no_grad():
                outputs = model.generate(**inputs, **gen_kwargs)

            new_tokens = [
                out[len(inp) :]
                for inp, out in zip(inputs.input_ids, outputs)
            ]
            answer = tokenizer.batch_decode(
                new_tokens, skip_special_tokens=True
            )[0].strip()

        except Exception as e:
            logger.error(f"Generation error: {e}")

        # Fall back to formatted vector results if answer is empty
        if not answer or len(answer.strip()) < 5:
            passages = "\n\n".join(
                [
                    f"• **{d.get('source', 'Islamic Knowledge Base')}** "
                    f"({int(d.get('score', 0) * 100)}% match):\n\"{d.get('text', '')}\""
                    for d in docs
                ]
            )
            answer = (
                f"Based on authenticated Islamic sources for **\"{query}\"**:\n\n"
                + passages
            )

        gen_time_ms = round((time.time() - gen_start_time) * 1000, 2)

        return {
            "query": query,
            "answer": answer,
            "is_off_topic": False,
            "retrieved_documents": docs,
            "sources": unique_sources,
            "search_time_ms": search_time_ms,
            "generation_time_ms": gen_time_ms,
            "total_time_ms": round(search_time_ms + gen_time_ms, 2),
            "model_used": model_info["name"],
            "model_key": model_key,
        }

    # ------------------------------------------------------------------
    # Streaming Generation (async SSE)
    # ------------------------------------------------------------------

    async def astream_generate(
        self,
        query: str,
        model_key: str = DEFAULT_LLM_KEY,
        top_k: int = 5,
        temperature: float = 0.7,
        max_new_tokens: int = 250,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Async generator that yields SSE event dicts:
          {"type": "token",        "text": "..."}
          {"type": "done",         "sources": [...], ...}
          {"type": "off_topic",    "message": "...", "confidence": 0.0}
          {"type": "error",        "message": "..."}
        """
        import torch

        # 1. Guardrail
        is_islamic, confidence = self.is_islamic_query(query)
        if not is_islamic:
            yield {
                "type": "off_topic",
                "message": REJECTION_MESSAGE,
                "confidence": confidence,
            }
            return

        # 2. Vector Search
        docs, search_time_ms = self.search(query, top_k=top_k)
        unique_sources = list(dict.fromkeys([d["source"] for d in docs]))

        model_info = MODELS.get(model_key, MODELS[DEFAULT_LLM_KEY])

        # 3. Load model in threadpool so async loop doesn't freeze during load
        try:
            loop = asyncio.get_event_loop()
            model, tokenizer = await loop.run_in_executor(
                None, self.load_llm, model_key
            )
        except Exception as ex:
            logger.error(f"Failed to load LLM for streaming: {ex}")
            yield {
                "type": "error",
                "message": f"Failed to load model '{model_info['name']}': {ex}",
            }
            return

        # 4. Streaming Generation via TextIteratorStreamer
        prompt = self._build_prompt(query, docs, model_key, tokenizer)
        inputs = tokenizer([prompt], return_tensors="pt").to(model.device)

        from transformers import TextIteratorStreamer

        streamer = TextIteratorStreamer(
            tokenizer, skip_prompt=True, skip_special_tokens=True
        )

        do_sample = temperature > 0.1
        gen_kwargs: Dict[str, Any] = {
            **inputs,
            "streamer": streamer,
            "max_new_tokens": min(max_new_tokens, 350),
            "do_sample": do_sample,
            "pad_token_id": tokenizer.eos_token_id,
        }
        if do_sample:
            gen_kwargs["temperature"] = float(temperature)
            gen_kwargs["top_p"] = 0.9

        # Bridge sync TextIteratorStreamer → async queue
        gen_start_time = time.time()
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue = asyncio.Queue()

        def run_generation():
            try:
                with torch.no_grad():
                    model.generate(**gen_kwargs)
            except Exception as e:
                loop.call_soon_threadsafe(queue.put_nowait, ("error", str(e)))

        def consume_tokens():
            try:
                for token_text in streamer:
                    loop.call_soon_threadsafe(queue.put_nowait, ("token", token_text))
            except Exception as e:
                loop.call_soon_threadsafe(queue.put_nowait, ("error", str(e)))
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, ("done", None))

        gen_thread = threading.Thread(target=run_generation, daemon=True)
        consumer_thread = threading.Thread(target=consume_tokens, daemon=True)
        gen_thread.start()
        consumer_thread.start()

        # Yield tokens as they arrive
        while True:
            msg_type, msg_data = await queue.get()

            if msg_type == "token":
                if msg_data:  # skip empty tokens
                    yield {"type": "token", "text": msg_data}
            elif msg_type == "error":
                yield {"type": "error", "message": msg_data}
                break
            elif msg_type == "done":
                gen_time_ms = round((time.time() - gen_start_time) * 1000, 2)
                yield {
                    "type": "done",
                    "sources": unique_sources,
                    "retrieved_documents": docs,
                    "search_time_ms": search_time_ms,
                    "generation_time_ms": gen_time_ms,
                    "total_time_ms": round(search_time_ms + gen_time_ms, 2),
                    "model_used": model_info["name"],
                    "model_key": model_key,
                }
                break

        gen_thread.join(timeout=5)
        consumer_thread.join(timeout=5)

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------

    def get_stats(self) -> Dict[str, Any]:
        """Returns metadata statistics about dataset & index."""
        return {
            "total_documents": len(self.documents),
            "total_sources": len(set(self.sources)),
            "index_vector_count": self.faiss_index.ntotal if self.faiss_index else 0,
            "device": self.device,
            "embedding_model": EMBEDDING_MODEL_NAME,
            "loaded_models": list(self.loaded_llms.keys()),
            "available_models": list(MODELS.keys()),
            "guardrail_enabled": GUARDRAIL_ENABLED,
            "guardrail_anchors": len(ISLAMIC_ANCHOR_PHRASES) if GUARDRAIL_ENABLED else 0,
        }


# Global Singleton
rag_engine = RAGEngine()
