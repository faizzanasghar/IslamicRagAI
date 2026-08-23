import sys
import os
from pathlib import Path

# Force UTF-8 stdout for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir / "backend"))

from app.rag_engine import rag_engine

def test_model_size_comparison():
    out_file = root_dir / "scripts" / "model_size_comparison_results.txt"
    lines = []
    
    lines.append("=" * 70)
    lines.append(" MODEL SIZE COMPARISON: QWEN 2.5 1.5B INSTRUCT GROUNDING TEST")
    lines.append("=" * 70)

    rag_engine.initialize()
    query = "What are the rights of orphans in the Quran?"
    docs, search_time = rag_engine.search(query, top_k=3)

    model_key = "qwen_1.5b"
    print("Loading Qwen 2.5 1.5B Instruct...")
    model, tokenizer = rag_engine.load_llm(model_key)
    
    prompt_str = rag_engine._build_prompt(query, docs, model_key, tokenizer)
    lines.append("\n--- PROMPT TEMPLATE (QWEN 2.5 1.5B) ---")
    lines.append(prompt_str)
    lines.append("----------------------------------------")

    import torch
    inputs = tokenizer([prompt_str], return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=300,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id
        )
    new_tokens = [out[len(inp):] for inp, out in zip(inputs.input_ids, outputs)]
    grounded_answer = tokenizer.batch_decode(new_tokens, skip_special_tokens=True)[0].strip()

    lines.append("\n--- GENERATED ANSWER (QWEN 2.5 1.5B INSTRUCT) ---")
    lines.append(grounded_answer)
    lines.append("-------------------------------------------------")

    with open(out_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Results written to {out_file}")

if __name__ == "__main__":
    test_model_size_comparison()
