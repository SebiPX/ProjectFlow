#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — ProjectFlow VPS Deployment Script
#
# Path:
#   Frontend:  /opt/docker/ProjectFlow
#
# Usage:
#   chmod +x deploy.sh        (first time only)
#   ./deploy.sh               (deploys the frontend)
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Exit immediately on any error

# ── Config ────────────────────────────────────────────────────────────────────
REPO_URL="https://github.com/SebiPX/ProjectFlow.git"
FRONTEND_DIR="/opt/docker/ProjectFlow"
BRANCH="main"

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log()     { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
header()  { echo -e "\n${YELLOW}══════════════════════════════════════${NC}\n${YELLOW}  $1${NC}\n${YELLOW}══════════════════════════════════════${NC}"; }

# ── Helper: pull latest code into a directory ─────────────────────────────────
pull_latest() {
  local dir=$1
  local name=$2

  if [ -d "$dir/.git" ]; then
    warn "$name: Git repo found — pulling latest from $BRANCH..."
    cd "$dir"
    git fetch origin
    git reset --hard origin/$BRANCH
    log "$name: Code updated."
  else
    warn "$name: No git repo found at $dir — cloning fresh..."
    mkdir -p "$dir"
    # Backup existing .env if present
    if [ -f "$dir/.env" ]; then
      cp "$dir/.env" "/tmp/${name}.env.backup"
      warn "$name: Backed up existing .env to /tmp/${name}.env.backup"
    fi
    if [ -f "$dir/.env.local" ]; then
      cp "$dir/.env.local" "/tmp/${name}.env.local.backup"
      warn "$name: Backed up existing .env.local to /tmp/${name}.env.local.backup"
    fi
    
    # Clone into temp dir, then copy contents
    rm -rf /tmp/projectflow-temp
    git clone --branch $BRANCH $REPO_URL /tmp/projectflow-temp
    rsync -a --exclude='.env' --exclude='.env.local' /tmp/projectflow-temp/ "$dir/"
    rm -rf /tmp/projectflow-temp
    
    # Restore .env backups
    if [ -f "/tmp/${name}.env.backup" ]; then
      cp "/tmp/${name}.env.backup" "$dir/.env"
      log "$name: Restored .env from backup."
    fi
    if [ -f "/tmp/${name}.env.local.backup" ]; then
      cp "/tmp/${name}.env.local.backup" "$dir/.env.local"
      log "$name: Restored .env.local from backup."
    fi
    log "$name: Fresh clone complete."
  fi
}

# ── Deploy Frontend ───────────────────────────────────────────────────────────
deploy_frontend() {
  header "Deploying Frontend (ProjectFlow)"

  pull_latest "$FRONTEND_DIR" "projectflow"
  cd "$FRONTEND_DIR"

  # Safety check: .env or .env.local should ideally exist
  if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    warn "No .env or .env.local found in $FRONTEND_DIR! You might need to create one if your app requires env vars."
  fi

  log "Building Docker image..."
  # Depending on docker-compose version it might be 'docker compose' or 'docker-compose'
  if command -v docker-compose &> /dev/null; then
    docker-compose -f docker-compose.prod.yml build --no-cache
    log "Restarting container..."
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d
  else
    docker compose -f docker-compose.prod.yml build --no-cache
    log "Restarting container..."
    docker compose -f docker-compose.prod.yml down
    docker compose -f docker-compose.prod.yml up -d
  fi

  log "ProjectFlow deployed! Container: agencyflow-app"
}

# ── Main ──────────────────────────────────────────────────────────────────────
deploy_frontend

header "Deployment Complete"
echo ""
echo "  ProjectFlow Frontend deployed successfully!"
echo "  Make sure Nginx Proxy Manager points to the configured APP_PORT (default: 3002)."
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "agencyflow|NAMES"
echo ""
