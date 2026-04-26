#!/bin/sh
set -e

echo "🔄 Pushing database schema..."
npx prisma db push --accept-data-loss

echo "🚀 Starting server..."
node dist/server.js

