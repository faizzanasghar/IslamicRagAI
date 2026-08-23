import sys
import os
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir / "backend"))

from app.rag_engine import rag_engine

def debug_grounding():
    out_file = root_dir / "scripts" / "grounding_results.txt"
    lines = []
    
    lines.append("=" * 70)
    lines.append(" STEP 1: INITIALIZE RAG ENGINE & RETRIEVE CHUNKS")
    lines.append("=" * 70)
    
    rag_engine.initialize()
    query = "What are the rights of orphans in the Quran?"
    docs, search_time = rag_engine.search(query, top_k=3)
    
    lines.append(f"\nQuery: {query}")
    lines.append(f"Retrieval Time: {search_time} ms")
    lines.append(f"Retrieved {len(docs)} chunks:")
    for idx, d in enumerate(docs, 1):
        lines.append(f"\n--- Chunk #{idx} (Score: {d['score']:.4f}) ---")
        lines.append(f"Source: {d['source']}")
        lines.append(f"Text: {d['text']}")

    lines.append("\n" + "=" * 70)
    lines.append(" STEP 2: INSPECT CURRENT PROMPT STRING SENT TO LLM")
    lines.append("=" * 70)
    
    model_key = "qwen"
    model, tokenizer = rag_engine.load_llm(model_key)
    prompt_str = rag_engine._build_prompt(query, docs, model_key, tokenizer)
    
    lines.append("\n--- EXACT PROMPT STRING SENT TO LLM ---")
    lines.append(prompt_str)
    lines.append("---------------------------------------")
    
    lines.append("\n" + "=" * 70)
    lines.append(" STEP 3: GENERATE ANSWER WITH QWEN 2.5 0.5B INSTRUCT")
    lines.append("=" * 70)
    
    res = rag_engine.generate(query, model_key=model_key, top_k=3, temperature=0.1, max_new_tokens=250)
    lines.append("\n--- CURRENT GENERATED ANSWER ---")
    lines.append(res["answer"])
    lines.append("--------------------------------")
    
    with open(out_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Results written to {out_file}")

if __name__ == "__main__":
    debug_grounding()
