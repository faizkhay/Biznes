#!/usr/bin/env bash
# Proves the row level security of the accounts schema on a plain Postgres: `npm run test:rls`.
#
# It makes a scratch database, puts in the few parts of Supabase the migrations lean on
# (supabase/tests/stub.sql), applies every migration in supabase/migrations in order, and runs
# supabase/tests/rls.sql, which plays a visitor, a regular user, an owner, an admin and the
# superadmin and checks what each can and cannot do. The scratch database is dropped at the end.
#
# By default it uses the Postgres on this machine as the `postgres` user (through `su` when run as
# root, as on the build machine; start the server first: `pg_ctlcluster 16 main start`). To use
# another server, set PSQL to a psql command that connects as a superuser, for example
#   PSQL="psql -h 127.0.0.1 -U postgres" npm run test:rls
set -euo pipefail

cd "$(dirname "$0")/.."
DB="${RLS_TEST_DB:-biznes_rls_test}"

if [ -n "${PSQL:-}" ]; then
  run() { $PSQL -X -q -v ON_ERROR_STOP=1 "$@"; }
elif [ "$(id -u)" = "0" ] && id postgres >/dev/null 2>&1; then
  run() { su postgres -c "psql -X -q -v ON_ERROR_STOP=1 $*"; }
else
  run() { psql -X -q -v ON_ERROR_STOP=1 "$@"; }
fi

run -d postgres -c "'drop database if exists $DB'" >/dev/null 2>&1
run -d postgres -c "'create database $DB'" >/dev/null
trap 'run -d postgres -c "'"'"'drop database if exists $DB'"'"'" >/dev/null' EXIT

echo "# Stub: supabase/tests/stub.sql"
run -d "$DB" <supabase/tests/stub.sql
for migration in supabase/migrations/*.sql; do
  echo "# Migration: $migration"
  run -d "$DB" <"$migration"
done
echo "# Tests: supabase/tests/rls.sql"
run -d "$DB" <supabase/tests/rls.sql
