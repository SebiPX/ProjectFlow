#!/bin/bash

# Exit upon any error
set -e

echo "🚀 Starting PX-Flow Update & Deployment..."

echo "📥 Pulling latest changes from Git repository..."
git pull origin main

echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yml down

echo "🏗️ Building and starting new containers..."
docker compose -f docker-compose.prod.yml up -d --build

echo "✅ PX-Flow successfully deployed and running in background!"
