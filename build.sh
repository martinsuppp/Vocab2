#!/usr/bin/env bash
# Exit on error
set -o errexit

# Build Frontend
echo "Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# Install Python Dependencies
echo "Installing Python Dependencies..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install gunicorn
echo "Installed packages:"
python -m pip list

