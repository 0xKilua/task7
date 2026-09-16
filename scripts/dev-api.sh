#!/usr/bin/env bash
set -euo pipefail
cd /home/user/task7
export DATABASE_URL="postgresql://relook:relook@localhost:5432/relook"
export REDIS_URL="redis://localhost:6379"
export JWT_ACCESS_SECRET="dev-access-secret-please-change-0123456789"
export JWT_REFRESH_SECRET="dev-refresh-secret-please-change-0123456789"
export STORAGE_PROVIDER="local"
export LOCAL_STORAGE_DIR=".data/uploads"
export VISION_SERVICE_URL="http://127.0.0.1:8100"
export CORS_ORIGIN="http://localhost:3000"
export API_PORT="4000"
export NODE_ENV="development"
exec pnpm --filter @relook/api dev
