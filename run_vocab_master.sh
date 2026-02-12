#!/bin/bash

# Function to kill background processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID
    exit
}

trap cleanup SIGINT

# Start Backend
echo "Starting Backend (Flask)..."
cd backend
source venv/bin/activate 2>/dev/null || python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt > /dev/null
python app.py &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend (Vite)..."
cd frontend
npm install > /dev/null
npm run dev &
FRONTEND_PID=$!
cd ..

echo "VocabMaster is running!"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:5000"
echo "Press Ctrl+C to stop."

wait
