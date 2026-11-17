#!/usr/bin/env bash
# Aplica las migraciones en un PostgreSQL local y ejecuta las pruebas pgTAP.
# Uso: npm run test:db   (requiere PostgreSQL 15+ con la extensión pgtap)
# En un entorno con Docker, la vía oficial es: supabase start && supabase test db
set -euo pipefail

DB="${DOMZLI_TEST_DB:-domzli_test}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PSQL_ADMIN=(psql -X -q -v ON_ERROR_STOP=1)
if [ "$(id -u)" = "0" ]; then
  run_psql() { su postgres -c "psql -X -q -v ON_ERROR_STOP=1 $(printf '%q ' "$@")"; }
else
  run_psql() { "${PSQL_ADMIN[@]}" "$@"; }
fi

run_psql -d postgres -c "drop database if exists ${DB}" -c "create database ${DB}"
run_psql -d "$DB" -f "$ROOT/tests/local/supabase_stub.sql"
for f in "$ROOT"/migrations/*.sql; do
  echo "→ $(basename "$f")"
  run_psql -d "$DB" -f "$f"
done
run_psql -d "$DB" -f "$ROOT/tests/local/test_helpers.sql"

fail=0
for t in "$ROOT"/tests/*.test.sql; do
  echo "── $(basename "$t")"
  out="$(run_psql -d "$DB" -At -f "$t" 2>&1 || true)"
  echo "$out" | grep -E "^(not ok|ok|# |1\.\.)|ERROR" || true
  if echo "$out" | grep -qE "^not ok|ERROR|# Looks like"; then fail=1; fi
done

if [ "$fail" = "1" ]; then echo "✗ Hay pruebas fallidas"; exit 1; fi
echo "✓ Todas las pruebas de base de datos pasaron"
