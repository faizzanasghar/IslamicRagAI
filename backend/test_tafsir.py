import asyncio
from app.rag_engine import rag_engine

async def main():
    rag_engine.initialize()
    print("Loading LLM...")
    rag_engine.load_llm('qwen')
    print("LLM loaded! Generating response for: Explain Surah Al-Fatiha...")
    print("-" * 50)

    async for event in rag_engine.astream_generate("Explain Surah Al-Fatiha", model_key="qwen", top_k=5):
        if event["type"] == "token":
            print(event["text"], end="", flush=True)
        elif event["type"] == "done":
            print("\n" + "-" * 50)
            print(f"DONE! Model: {event['model_used']} | Total Time: {event['total_time_ms']}ms")

if __name__ == "__main__":
    asyncio.run(main())
