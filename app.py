"""
DEPRECATED — This file is the old root-level app.py and is no longer used.

The active backend is in: backend/app/main.py

To run the server:
  Windows:  run_backend.bat
  Linux:    bash run_backend.sh
  Manual:   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend
"""

raise RuntimeError(
    "This file is deprecated. Use: uvicorn app.main:app --app-dir backend"
)