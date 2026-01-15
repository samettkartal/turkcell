@echo off
echo Stopping existing Python processes...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM uvicorn.exe /T 2>nul

echo Starting Backend Server...
start "Backend API" cmd /k "uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting for Backend to initialize...
timeout /t 5

echo Starting Traffic Generator...
start "Traffic Generator" cmd /k "python traffic_generator.py"

echo System Started!
echo Frontend should be running separately via 'npm run dev'.
pause
