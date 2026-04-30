# Connecting Backend & Frontend

This project consists of a FastAPI backend and a Next.js frontend. They are connected via a proxy configuration in the frontend.

## Prerequisites

1. **WAHA (WhatsApp HTTP API)**: This service must be running.
   - If using Docker: `docker compose up waha`
   - Default URL: `http://localhost:3001` (host) or `http://waha:3000` (internal)

2. **Backend (FastAPI)**:
   - Navigate to `server`
   - Install dependencies: `uv sync` or `pip install -r requirements.txt`
   - Run: `python main.py`
   - Default URL: `http://localhost:8000`

3. **Frontend (Next.js)**:
   - Navigate to `client`
   - Install dependencies: `pnpm install`
   - Run: `pnpm dev`
   - Default URL: `http://localhost:3000`

## How it works

- The frontend uses `next.config.ts` to rewrite all `/api/v1/*` requests to `http://localhost:8000/api/v1/*`.
- The backend communicates with WAHA using the `WAHA_URL` defined in `server/.env` or `server/app/core/config.py`.
- Ensure the `WAHA_API_KEY` matches between WAHA and the Backend.

> [!TIP]
> If running **locally** (not in Docker), change `WAHA_URL` in `server/app/core/config.py` to `http://localhost:3001/api` to match the WAHA host port.

## Troubleshooting

- **API: DISCONNECTED**: Ensure the backend is running on port 8000.
- **Session OFFLINE**: Ensure WAHA is running and the `WAHA_URL` in the backend is correct.
- **QR Code not appearing**: Check if WAHA is initialized and the session exists (default is "default").
