#!/bin/bash
set -e

# musicdl-service startup script
# Creates a Python venv, installs dependencies, and starts uvicorn.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

uvicorn main:app --host 0.0.0.0 --port 3002 --reload
