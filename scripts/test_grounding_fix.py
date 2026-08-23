import sys
import os
from pathlib import Path

# Force UTF-8 stdout for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir / "backend"))

from app.rag_engine import rag_engine
from app.config import MODELS

def build_strict_prompt(query, docs, model_key, tokenizer):
    context_str = "\n---\n".join(
        [f"Source: {d['source']}\nText: {d['text']}" for d in docs]
    )
    model_info = MODELS.get(model_key, {"type": "instruct"})

    if model_info["type"] == "instruct":
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a strict Islamic Knowledge RAG Assistant.\n"
                    "Your TASK is to answer the user's question ONLY using the provided Verified Islamic Context passages below.\n\n"
                    "STRICT GROUNDING RULES:\n"
                    "1. Base EVERY claim strictly on the provided Context. Do NOT use outside knowledge, unverified assumptions, or modern extrapolations.\n"
                    "2. MANDATORY CITATION: For every right, duty, or teaching mentioned, cite the exact source from the context in square brackets, e.g., [Surah Al-Baqarah 2:220] or [Surah An-Nisā’ 4:127].\n"
                    "3. QUOTE/REFERENCE VERBATIM: Quote or reference the exact text from the provided verses to support each point.\n"
                    "4. NO HALLUCINATION: If the provided context passages do not mention a specific right, explicitly state that it is not mentioned in the provided sources.\n"
                    "5. Format your response cleanly using Markdown headings and bullet points."
                ),
            },
            {
                "role": "user",
                "content": f"Verified Islamic Context:\n{context_str}\n\nQuestion: {query}\n\nGrounded Islamic Answer (with citations):",
            },
        ]
        return tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
    else:
        return f"Verified Islamic Context:\n{context_str}\n\nQuestion: {query}\n\nGrounded Answer:"

def test_grounding_fix():
    out_file = root_dir / "scripts" / "strict_grounding_results.txt"
    lines = []
    
    lines.append("=" * 70)
    lines.append(" TESTING STRICT GROUNDING PROMPT FIX FOR ORPHANS QUERY")
    lines.append("=" * 70)

    rag_engine.initialize()
    query = "What are the rights of orphans in the Quran?"
    docs, search_time = rag_engine.search(query, top_k=3)

    model_key = "qwen"
    model, tokenizer = rag_engine.load_llm(model_key)
    
    strict_prompt = build_strict_prompt(query, docs, model_key, tokenizer)
    lines.append("\n--- NEW STRICT PROMPT TEMPLATE ---")
    lines.append(strict_prompt)
    lines.append("----------------------------------")

    # Generate with strict prompt
    import torch
    inputs = tokenizer([strict_prompt], return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=300,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id
        )
    new_tokens = [out[len(inp):] for inp, out in zip(inputs.input_ids, outputs)]
    grounded_answer = tokenizer.batch_decode(new_tokens, skip_special_tokens=True)[0].strip()

    lines.append("\n--- NEW GROUNDED GENERATED ANSWER (QWEN 2.5 0.5B) ---")
    lines.append(grounded_answer)
    lines.append("-----------------------------------------------------")

    with open(out_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Results written to {out_file}")

if __name__ == "__main__":
    test_grounding_fix()
