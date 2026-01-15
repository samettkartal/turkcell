@echo off
start cmd /k "echo Starting Backend... & python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"
start cmd /k "echo Starting Frontend... & cd frontenddeneme & npm run dev"
echo TrustShield starting... Check the two new windows.
