# LiveKit Control Panel

A lightweight full-stack LiveKit SIP trunk and dispatch rule management panel built using:

- FastAPI (Backend)
- Vanilla JS + TailwindCSS (Frontend)
- LiveKit SIP APIs
- PM2 / Nginx deployment support

This project provides a web-based admin console to manage:

- Inbound SIP Trunks
- Outbound SIP Trunks
- SIP Dispatch Rules
- LiveKit routing configuration

---

# Features

## Backend

- FastAPI REST APIs
- LiveKit SIP integration
- Inbound trunk management
- Outbound trunk management
- Dispatch rule management
- Health endpoints
- Environment-based configuration
- CORS support

## Frontend

- TailwindCSS Admin Dashboard
- Runtime backend URL configuration
- Trunk CRUD UI
- Dispatch Rule UI
- Dynamic API integration
- Responsive sidebar layout

---

# Project Structure

```bash
livkit-control/
│
├── api/
│   ├── health.py
│   ├── router.py
│   └── lk_trunks/
│       ├── inbound.py
│       ├── outbound.py
│       └── dispatch.py
│
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── base.html
│   │
│   ├── assets/
│   │   ├── config/
│   │   │   └── runtime-config.js
│   │   │
│   │   ├── scripts/
│   │   │   ├── api.js
│   │   │   ├── config.js
│   │   │   ├── layout.js
│   │   │   ├── ui.js
│   │   │   └── dispatch-edit.js
│   │   │
│   │   └── styles/
│   │       └── main.css
│
├── main.py
├── requirements.txt
└── README.md
````

---

# Backend Setup

## 1. Create Virtual Environment

```bash
python -m venv venv
```

Activate:

### Linux/macOS

```bash
source venv/bin/activate
```

### Windows

```bash
venv\Scripts\activate
```

---

## 2. Install Requirements

```bash
pip install -r requirements.txt
```

---

# Backend Environment Variables

Create a `.env` file in the backend root.

Example:

```env
PORT=8003

LIVEKIT_URL=wss://your-livekit-domain
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

---

# Run Backend

```bash
python main.py
```

Backend runs on:

```bash
http://localhost:8003
```

---

# Frontend Setup

Frontend is static HTML + JS.

No build process required.

---

# Frontend Runtime Configuration

Edit:

```bash
frontend/assets/config/runtime-config.js
```

Example:

```js
window.APP_CONFIG = {
    BACKEND_URL: "http://localhost:8003",
    FRONTEND_URL: "http://localhost:8001"
};
```

---

# Run Frontend

Inside `frontend/`:

```bash
python -m http.server 8001
```

Frontend runs on:

```bash
http://localhost:8001
```

---

# API Base URLs

All APIs are mounted under:

```bash
/api/v1
```

Examples:

## Health

```bash
GET /api/v1/health
```

## Inbound Trunks

```bash
GET /api/v1/lk-trunks/inbound
```

## Outbound Trunks

```bash
GET /api/v1/lk-trunks/outbound
```

## Dispatch Rules

```bash
GET /api/v1/lk-trunks/dispatch
```

---

# Deployment Guide (VM)

Recommended stack:

- Ubuntu VM
- PM2
- Nginx
- Python 3.11+

---

# Install PM2

```bash
sudo npm install -g pm2
```

---

# Start Backend with PM2

```bash
pm2 start "python3 main.py" --name livkit-backend
```

---

# Start Frontend with PM2

```bash
cd frontend

pm2 start "python3 -m http.server 8001" --name livkit-frontend
```

---

# Save PM2 Processes

```bash
pm2 save
```

Enable startup:

```bash
pm2 startup
```

Run the command PM2 gives you.

---

# Nginx Reverse Proxy

## Frontend

```nginx
server {
    listen 80;
    server_name panel.example.com;

    root /opt/livkit-control/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Backend

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:8003;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

# Recommended Production URLs

```js
window.APP_CONFIG = {
    BACKEND_URL: "https://api.example.com",
    FRONTEND_URL: "https://panel.example.com"
};
```

---

# Important Notes

## Do NOT expose backend `.env`

Backend `.env` contains secrets.

Never serve it publicly.

---

## Frontend Runtime Config

`runtime-config.js` is public-safe.

Only place:

- backend URL
- frontend URL
- public configuration

inside it.

---

# Health Check

```bash
GET /
```

Response:

```json
{
  "message": "backend is running"
}
```

---

# Tech Stack

## Backend

- FastAPI
- Uvicorn
- Pydantic
- Python Dotenv
- LiveKit SDK

## Frontend

- HTML
- TailwindCSS
- Vanilla JavaScript
- Feather Icons

---

# Future Improvements

- Authentication
- RBAC
- User management
- DID management
- Call analytics
- WebSocket live updates
- Docker Compose deployment
- HTTPS automation
- Multi-tenant support

---

# License

Internal / Proprietary Project

---

# Author

Malay Jain

AI Developer ITES
