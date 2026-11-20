#!/usr/bin/env bash
# A Supabase project in miniature, on this machine, to run the accounts against for real.
#
#   bash scripts/accounts-stack.sh up      start it, apply the migrations, print the two variables
#   bash scripts/accounts-stack.sh reset   the same, from an empty database
#   bash scripts/accounts-stack.sh down    stop it and remove its containers
#   bash scripts/accounts-stack.sh env     print the two variables again
#
# Four containers, the same images a hosted project and the Supabase CLI run: Supabase's own
# Postgres (with its roles and default grants), Supabase Auth, PostgREST and Supabase Storage
# (keeping its files inside its own container). Two small Node programs beside them
# (supabase/local): a gateway that routes /auth/v1, /rest/v1 and /storage/v1 as a project does,
# and a mail sink that writes the emails Auth sends to .accounts-stack/mail.
#
# It is for checks only (scripts/accounts-e2e.mjs). Its keys and passwords are written here in
# the open and are worth nothing anywhere else. Needs: docker, psql, node.
set -euo pipefail
cd "$(dirname "$0")/.."

RUN=.accounts-stack
SITE="${ACCOUNTS_SITE:-http://localhost:3300}"
SECRET=a-secret-for-the-local-test-stack-only-0123456789
DB_PORT=54322
AUTH_PORT=9999
REST_PORT=3001
STORAGE_PORT=5001
API_PORT=54321
MAIL_PORT=2525
DB="postgres://postgres:postgres@127.0.0.1:$DB_PORT/postgres"

# A token signed with the stack's secret, for a role. For `anon` it is the publishable key of this
# pretend project. The one for `service_role` is handed only to the Storage container, which will
# not start without one: the site never sees it and has no use for it.
key_for() {
  node -e '
    const { createHmac } = require("node:crypto");
    const part = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const body = `${part({ alg: "HS256", typ: "JWT" })}.${part({ role: process.argv[2], iss: "supabase", iat: 1700000000, exp: 2200000000 })}`;
    console.log(`${body}.${createHmac("sha256", process.argv[1]).update(body).digest("base64url")}`);
  ' "$SECRET" "$1"
}
anon_key() { key_for anon; }

print_env() {
  echo "NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:$API_PORT"
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$(anon_key)"
}

down() {
  docker rm -f biznes-db biznes-auth biznes-rest biznes-storage >/dev/null 2>&1 || true
  docker network rm biznes-accounts >/dev/null 2>&1 || true
  for name in gateway mail; do
    [ -f "$RUN/$name.pid" ] && kill "$(cat "$RUN/$name.pid")" 2>/dev/null || true
    rm -f "$RUN/$name.pid"
  done
}

up() {
  mkdir -p "$RUN/mail"
  docker network create biznes-accounts >/dev/null

  docker run -d --name biznes-db --network biznes-accounts -p "$DB_PORT:5432" -e POSTGRES_PASSWORD=postgres -e JWT_SECRET="$SECRET" supabase/postgres:15.8.1.085 >/dev/null
  echo "# Waiting for Postgres"
  for _ in $(seq 60); do
    PGPASSWORD=postgres psql "$DB" -X -Atc "select 1" >/dev/null 2>&1 && break
    sleep 1
  done
  # The image leaves these roles without a password; a project sets them.
  PGPASSWORD=postgres psql "postgres://supabase_admin:postgres@127.0.0.1:$DB_PORT/postgres" -X -q -c "alter role supabase_auth_admin with password 'postgres'; alter role authenticator with password 'postgres'; alter role supabase_storage_admin with password 'postgres';"

  setsid nohup node supabase/local/mail-sink.mjs "$RUN/mail" "$MAIL_PORT" >"$RUN/mail.log" 2>&1 </dev/null &
  echo $! >"$RUN/mail.pid"

  docker run -d --name biznes-auth --network biznes-accounts -p "$AUTH_PORT:9999" --add-host=host.docker.internal:host-gateway \
    -e GOTRUE_API_HOST=0.0.0.0 -e GOTRUE_API_PORT=9999 -e API_EXTERNAL_URL="http://127.0.0.1:$API_PORT" \
    -e GOTRUE_DB_DRIVER=postgres -e GOTRUE_DB_DATABASE_URL="postgres://supabase_auth_admin:postgres@biznes-db:5432/postgres" \
    -e GOTRUE_SITE_URL="$SITE" -e GOTRUE_URI_ALLOW_LIST="$SITE/**" \
    -e GOTRUE_JWT_SECRET="$SECRET" -e GOTRUE_JWT_EXP="${ACCOUNTS_JWT_EXP:-3600}" -e GOTRUE_JWT_AUD=authenticated -e GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated -e GOTRUE_JWT_ADMIN_ROLES=service_role \
    -e GOTRUE_DISABLE_SIGNUP=false -e GOTRUE_EXTERNAL_EMAIL_ENABLED=true -e GOTRUE_MAILER_AUTOCONFIRM=false \
    -e GOTRUE_SMTP_HOST=host.docker.internal -e GOTRUE_SMTP_PORT="$MAIL_PORT" -e GOTRUE_SMTP_ADMIN_EMAIL=accounts@biznes.test \
    -e GOTRUE_MAILER_URLPATHS_CONFIRMATION=/auth/v1/verify -e GOTRUE_MAILER_URLPATHS_RECOVERY=/auth/v1/verify -e GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE=/auth/v1/verify -e GOTRUE_MAILER_URLPATHS_INVITE=/auth/v1/verify \
    -e GOTRUE_RATE_LIMIT_EMAIL_SENT=1000 -e GOTRUE_SMTP_MAX_FREQUENCY=1s \
    supabase/gotrue:v2.176.1 >/dev/null
  echo "# Waiting for Supabase Auth"
  for _ in $(seq 60); do
    curl -fs "http://127.0.0.1:$AUTH_PORT/health" >/dev/null 2>&1 && break
    sleep 1
  done

  # Storage makes its own tables when it starts, as on a project, so it comes before the migrations
  # that set its bucket and its policies.
  docker run -d --name biznes-storage --network biznes-accounts -p "$STORAGE_PORT:5000" \
    -e ANON_KEY="$(anon_key)" -e SERVICE_KEY="$(key_for service_role)" -e AUTH_JWT_SECRET="$SECRET" -e PGRST_JWT_SECRET="$SECRET" \
    -e DATABASE_URL="postgres://supabase_storage_admin:postgres@biznes-db:5432/postgres" -e POSTGREST_URL="http://biznes-rest:3000" \
    -e STORAGE_BACKEND=file -e FILE_STORAGE_BACKEND_PATH=/var/lib/storage -e FILE_SIZE_LIMIT=52428800 \
    -e TENANT_ID=stub -e REGION=stub -e GLOBAL_S3_BUCKET=stub -e ENABLE_IMAGE_TRANSFORMATION=false \
    supabase/storage-api:v1.25.7 >/dev/null
  echo "# Waiting for Supabase Storage"
  for _ in $(seq 90); do
    curl -fs "http://127.0.0.1:$STORAGE_PORT/status" >/dev/null 2>&1 && break
    sleep 1
  done

  # The migrations, as the `postgres` role: the role a Supabase project runs them as.
  for migration in supabase/migrations/*.sql; do
    echo "# Migration: $migration"
    PGPASSWORD=postgres psql "$DB" -X -q -v ON_ERROR_STOP=1 -f "$migration"
  done

  docker run -d --name biznes-rest --network biznes-accounts -p "$REST_PORT:3000" \
    -e PGRST_DB_URI="postgres://authenticator:postgres@biznes-db:5432/postgres" -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon \
    -e PGRST_JWT_SECRET="$SECRET" -e PGRST_DB_USE_LEGACY_GUCS=false \
    postgrest/postgrest:v12.2.8 >/dev/null

  setsid nohup node supabase/local/gateway.mjs "$API_PORT" "$AUTH_PORT" "$REST_PORT" "$STORAGE_PORT" >"$RUN/gateway.log" 2>&1 </dev/null &
  echo $! >"$RUN/gateway.pid"
  echo "# Waiting for PostgREST"
  for _ in $(seq 60); do
    curl -fs "http://127.0.0.1:$API_PORT/rest/v1/site_settings?select=id" -H "apikey: $(anon_key)" >/dev/null 2>&1 && break
    sleep 1
  done

  echo "# Up. Build and serve the site with these, on $SITE:"
  print_env
  echo "# For the checks: MAIL_DIR=$RUN/mail DATABASE_URL=$DB"
}

case "${1:-}" in
  up) up ;;
  down) down ;;
  reset) down; rm -rf "$RUN/mail"; up ;;
  env) print_env ;;
  *) echo "usage: bash scripts/accounts-stack.sh up | reset | down | env" >&2; exit 2 ;;
esac
