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
export NODE_ENV="development"
# AI_PROVIDER/REPLICATE_API_TOKEN volontairement non definis : les modules
# coiffure/vetements doivent se comporter comme "provider_not_configured".
exec pnpm --filter @relook/api worker:dev
