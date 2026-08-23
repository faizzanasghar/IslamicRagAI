import sys
import os
from pathlib import Path

# Add app to path
sys.path.append(str(Path(__file__).resolve().parent))

from app.rag_engine import rag_engine

if __name__ == "__main__":
    print("=" * 60)
    print("Building FAISS Vector Index Cache for Islamic Dataset...")
    print("=" * 60)
    
    rag_engine.initialize()
    
    stats = rag_engine.get_stats()
    print("\n" + "=" * 60)
    print("Index Build Summary:")
    print(f"Total Passages Vectorized: {stats['total_documents']}")
    print(f"Total Unique Sources:      {stats['total_sources']}")
    print(f"Index Vector Count:        {stats['index_vector_count']}")
    print(f"Device Used:               {stats['device']}")
    print("=" * 60)
    print("FAISS index and metadata cached successfully.")
