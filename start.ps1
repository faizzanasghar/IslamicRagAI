# ============================================================
# Islamic RAG Chatbot — PowerShell Startup Script
# Usage:  .\start.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host ""
Write-Host " ========================================================" -ForegroundColor Cyan
Write-Host "  Islamic RAG Chatbot - FastAPI Backend" -ForegroundColor Cyan
Write-Host " ========================================================" -ForegroundColor Cyan
Write-Host ""

# Locate Python — prefer system Python 3.13 (has all packages), then venvs
$SysPython313 = "C:\Users\friends\AppData\Local\Programs\Python\Python313\python.exe"
if (Test-Path $SysPython313) {
    $Python = $SysPython313
    $Pip    = "C:\Users\friends\AppData\Local\Programs\Python\Python313\Scripts\pip.exe"
    Write-Host "[INFO] Using system Python 3.13." -ForegroundColor Green
} elseif (Test-Path "$Root\.venv\Scripts\python.exe") {
    $Python = "$Root\.venv\Scripts\python.exe"
    $Pip    = "$Root\.venv\Scripts\pip.exe"
    Write-Host "[INFO] Using .venv environment." -ForegroundColor Green
} elseif (Test-Path "$Root\venv\Scripts\python.exe") {
    $Python = "$Root\venv\Scripts\python.exe"
    $Pip    = "$Root\venv\Scripts\pip.exe"
    Write-Host "[INFO] Using venv environment." -ForegroundColor Green
} else {
    $Python = "python"
    $Pip    = "pip"
    Write-Host "[WARN] Using system Python from PATH." -ForegroundColor Yellow
}

# Install dependencies
Write-Host "[INFO] Installing backend dependencies..." -ForegroundColor Cyan
& $Pip install -r "$Root\backend\requirements.txt" -q

# Build FAISS index if missing
if (-not (Test-Path "$Root\faiss_index.bin")) {
    Write-Host "[INFO] Building FAISS index (first time only)..." -ForegroundColor Yellow
    & $Python "$Root\backend\build_index.py"
} else {
    Write-Host "[INFO] FAISS index found - skipping rebuild." -ForegroundColor Green
}

# Start FastAPI server
Write-Host ""
Write-Host "[INFO] Starting server at http://localhost:8000" -ForegroundColor Green
Write-Host "[INFO] API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "[INFO] Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

& $Python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir "$Root\backend"
