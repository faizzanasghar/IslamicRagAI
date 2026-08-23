@echo off
:: ============================================================
:: Islamic RAG Chatbot — Windows Backend Startup Script
:: Run from PowerShell with:  .\run_backend.bat
:: ============================================================
setlocal

cd /d "%~dp0"

echo.
echo  ========================================================
echo   Islamic RAG Chatbot — FastAPI Backend
echo  ========================================================
echo.

:: Prefer .venv, fall back to venv, then system Python
IF EXIST ".venv\Scripts\python.exe" (
    set PYTHON=".venv\Scripts\python.exe"
    set PIP=".venv\Scripts\pip.exe"
    echo [INFO] Using .venv Python environment.
) ELSE IF EXIST "venv\Scripts\python.exe" (
    set PYTHON="venv\Scripts\python.exe"
    set PIP="venv\Scripts\pip.exe"
    echo [INFO] Using venv Python environment.
) ELSE (
    set PYTHON=python
    set PIP=pip
    echo [WARN] No virtual environment found. Using system Python.
)

:: Install/update dependencies
echo [INFO] Installing backend dependencies...
%PIP% install -r backend\requirements.txt -q

:: Build FAISS index if it doesn't exist
IF NOT EXIST "faiss_index.bin" (
    echo [INFO] Building FAISS index from dataset (first time only)...
    %PYTHON% backend\build_index.py
) ELSE (
    echo [INFO] FAISS index already exists — skipping rebuild.
)

:: Start the FastAPI backend server
echo.
echo [INFO] Starting server at http://localhost:8000
echo [INFO] API Docs:    http://localhost:8000/docs
echo [INFO] Press CTRL+C to stop.
echo.

%PYTHON% -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend

endlocal
pause
