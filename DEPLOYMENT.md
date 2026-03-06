# Deploying AgencyFlow

This guide explains how to deploy the AgencyFlow frontend application and connect it to the custom `labs-api` backend.

## 📋 Prerequisites

1.  **Server (VPS)** with Node.js or Docker installed.
2.  **Running Backend**: The `labs-api` Express.js backend must be running, connected to the `labs_db` PostgreSQL database, and accessible via the internet or internal network.
3.  **NGINX Proxy Manager** (Optional but recommended).

## 🚀 Environment Configuration

Create a `.env.local` or `.env` file in the root directory:

```bash
# .env
VITE_API_URL=https://api.labs-schickeria.com
```

_(Replace the URL with your actual backend URL. Do not include a trailing slash.)_

## 🛠️ Build and Deploy (Static Hosting)

AgencyFlow is a Vite-based React application. It compiles into static HTML/CSS/JS files, meaning it can be hosted on any standard web server.

1.  **Install Dependencies & Build**:
    ```bash
    npm install
    npm run build
    ```
2.  **Serve the Setup**:
    The `dist` folder can now be served using NGINX, Apache, or any static file host.

    Example NGINX configuration block:

    ```nginx
    server {
        listen 80;
        server_name app.agencyflow.com;
        root /path/to/agencyflow/dist;
        index index.html;

        # Single Page App routing
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
    ```

## 🛠️ Docker Deployment

If deploying via Docker Compose alongside NGINX Proxy Manager:

```yaml
version: "3.8"
services:
  agencyflow-frontend:
    build: .
    ports:
      - "3002:80"
    restart: always
    networks:
      - proxy-netz

networks:
  proxy-netz:
    external: true
```

## ⚙️ Backend Connection Troubleshooting

- **"Network Error" or 500/404 on API calls**:
  - Verify `VITE_API_URL` is correct.
  - Ensure the `labs-api` backend has CORS configured to allow the frontend origin.
  - Check backend logs for missing columns/tables in PostgreSQL.
  - If uploading files fails, check the `public/uploads/agency` folder permissions on the backend server.
