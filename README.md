# Generated Project with Next.js Frontend and FastAPI Backend

This project is organized into two main folders:

## Frontend (Next.js)

To run the frontend:

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

## Backend (FastAPI)

To run the backend:

```bash
cd backend
pip install -r requirements.txt
python main.py   # http://localhost:8000
```

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Proxy

The frontend is configured to proxy API requests to the backend. 
All requests to `/api/*` on the frontend will be forwarded to the backend.

## Integrations

This project includes the following integrations:

- Telegram: Send messages via Telegram Bot API








