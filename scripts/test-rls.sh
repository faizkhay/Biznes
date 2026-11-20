#!/usr/bin/env bash
# Proves the row level security of the accounts schema on a plain Postgres: `npm run test:rls`.
#
# It makes a scratch database, puts in the few parts of Supabase the migrations lean on
# (supabase/tests/stub.sql), applies every migration in supabase/migrations in order, and runs
# supabase/tests/rls.sql, which plays a visitor, a regular user, an owner, an admin and the
# superadmin and checks what each can and cannot do. The scratch database is dropped at the end.
#
# Then, on a second scratch database, it applies parts 1 to 10, writes rows as a project in use
# might hold them (supabase/tests/upgrade-before.sql), applies part 11 and what follows, and checks
# what became of the rows (supabase/tests/upgrade-after.sql).
#
# By default it uses the Postgres on this machine as the `postgres` user (through `su` when run as
# root, as on the build machine; start the server first: `pg_ctlcluster 16 main start`). To use
# another server, set PSQL to a psql command that connects as a superuser, for example
#   PSQL="psql -h 127.0.0.1 -U postgres" npm run test:rls
#
# To run the same claims on Supabase's own Postgres, with its real roles and grants, start the local
# stack from empty and point this at it. Nothing is kept: the tests roll themselves back.
#   bash scripts/accounts-stack.sh reset
#   RLS_TEST_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres npm run test:rls
set -euo pipefail

cd "$(dirname "$0")/.."
DB="${RLS_TEST_DB:-biznes_rls_test}"

if [ -n "${RLS_TEST_URL:-}" ]; then
  echo "# Tests: supabase/tests/rls.sql, on a database that already has the migrations and no accounts"
  psql "$RLS_TEST_URL" -X -q -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
  exit
fi

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

# The second pass: that the later migrations apply to a database already in use. Parts 1 to 10 go
# on first, then rows as a project might hold them (some of them the rows part 11 mends), then
# part 11 and whatever follows it, and last what became of the rows.
UP="${DB}_upgrade"
run -d postgres -c "'drop database if exists $UP'" >/dev/null 2>&1
run -d postgres -c "'create database $UP'" >/dev/null
trap 'run -d postgres -c "'"'"'drop database if exists $DB'"'"'" >/dev/null; run -d postgres -c "'"'"'drop database if exists $UP'"'"'" >/dev/null' EXIT
echo
echo "# The same migrations, on a database with rows in it"
run -d "$UP" <supabase/tests/stub.sql
for migration in supabase/migrations/*.sql; do
  if [[ "$(basename "$migration")" < "20261120000011" ]]; then run -d "$UP" <"$migration"; fi
done
run -d "$UP" <supabase/tests/upgrade-before.sql >/dev/null
for migration in supabase/migrations/*.sql; do
  if [[ ! "$(basename "$migration")" < "20261120000011" ]]; then
    echo "# Migration: $migration"
    run -d "$UP" <"$migration"
  fi
done
run -d "$UP" <supabase/tests/upgrade-after.sql
