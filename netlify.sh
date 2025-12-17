#!/usr/bin/env bash
set -e

if [ "$CONTEXT" = "production" ]; then
  BASE_URL="$URL"
else
  BASE_URL="$DEPLOY_PRIME_URL"
fi

export VITE_CLOUD_CALLBACK_URL="${BASE_URL}/cloud/callback"

echo "CONTEXT=$CONTEXT"
echo "VITE_CLOUD_CALLBACK_URL=$VITE_CLOUD_CALLBACK_URL"

bun run build