#!/usr/bin/env bash
# Create the learnsphere PostgreSQL role and database for local development.
# Run from any directory. Requires psql and superuser access to PostgreSQL.
set -euo pipefail

DB_USER="${POSTGRES_USER:-learnsphere}"
DB_PASSWORD="${POSTGRES_PASSWORD:-learnsphere}"
DB_NAME="${POSTGRES_DB:-learnsphere}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

echo "Creating role and database: ${DB_NAME} (user: ${DB_USER})"

psql -h "${DB_HOST}" -p "${DB_PORT}" -d postgres -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SQL

if ! psql -h "${DB_HOST}" -p "${DB_PORT}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  psql -h "${DB_HOST}" -p "${DB_PORT}" -d postgres -v ON_ERROR_STOP=1 -c \
    "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
  echo "Database '${DB_NAME}' created."
else
  echo "Database '${DB_NAME}' already exists."
fi

echo "Done. Set POSTGRES_* in backend/.env or run: cp backend/.env.example backend/.env"
