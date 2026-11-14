#!/bin/sh
# Applies pending migrations during the hosted build. Migrations need a direct
# (non-pooled) connection; Neon exposes it as DATABASE_URL_UNPOOLED.
set -e
if [ -z "$DATABASE_URL" ]; then echo "DATABASE_URL ausente: migrações não aplicadas." >&2; exit 1; fi
DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" npx prisma migrate deploy --schema ../../database/prisma/schema.prisma
# Optional one-time bootstrap of the first admin; remove ADMIN_PASSWORD from the environment afterwards.
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  (cd ../.. && DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" npx tsx scripts/create-admin.ts)
fi
