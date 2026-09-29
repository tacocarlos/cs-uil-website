#!/usr/bin/env bash
# Build the LSP gateway image and (re)start its container.
#
# Usage: ./deploy.sh [--env-file FILE] [--port PORT] [--memory SIZE] [--no-build]
#
# Settings are read from lsp-gateway/.env (see README.md for the variables).
# A secret is generated there on first run if LSP_GATEWAY_SECRET is missing.
# To deploy to another machine, point Docker at it first, e.g.
#   DOCKER_HOST=ssh://user@host ./deploy.sh
set -euo pipefail

cd "$(dirname "$0")"

IMAGE=lsp-gateway
CONTAINER=lsp-gateway
ENV_FILE=.env
HOST_PORT=3100
MEMORY=6g
BUILD=1
HEALTH_TIMEOUT_SECONDS=60

usage() {
    sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --env-file) ENV_FILE="$2"; shift 2 ;;
        --port) HOST_PORT="$2"; shift 2 ;;
        --memory) MEMORY="$2"; shift 2 ;;
        --no-build) BUILD=0; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown option: $1" >&2; usage >&2; exit 1 ;;
    esac
done

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || die "docker is not installed"
docker info >/dev/null 2>&1 || die "cannot reach the Docker daemon"

# --- Configuration ----------------------------------------------------------

if [[ ! -f "$ENV_FILE" ]]; then
    log "Creating $ENV_FILE"
    touch "$ENV_FILE"
    chmod 600 "$ENV_FILE"
fi

env_value() {
    grep -E "^$1=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- | sed -E "s/^['\"]//; s/['\"]$//"
}

secret="$(env_value LSP_GATEWAY_SECRET || true)"
if [[ -z "$secret" ]]; then
    command -v openssl >/dev/null || die "LSP_GATEWAY_SECRET is unset and openssl is unavailable to generate one"
    secret="$(openssl rand -base64 48)"
    echo "LSP_GATEWAY_SECRET=$secret" >> "$ENV_FILE"
    log "Generated LSP_GATEWAY_SECRET in $ENV_FILE; set the same value on the website"
elif [[ ${#secret} -lt 32 ]]; then
    die "LSP_GATEWAY_SECRET in $ENV_FILE must be at least 32 characters"
fi

if [[ -z "$(env_value ALLOWED_ORIGINS || true)" ]]; then
    printf '\033[1;33mwarning:\033[0m ALLOWED_ORIGINS is unset in %s; any site can connect\n' "$ENV_FILE" >&2
fi

# --- Build ------------------------------------------------------------------

if [[ $BUILD -eq 1 ]]; then
    log "Building $IMAGE"
    docker build -t "$IMAGE:latest" .
fi

# Keep the running image around so a failed deploy can be rolled back.
previous_image=""
if docker container inspect "$CONTAINER" >/dev/null 2>&1; then
    previous_image="$(docker container inspect -f '{{.Image}}' "$CONTAINER")"
    docker tag "$previous_image" "$IMAGE:previous"
fi

# --- Run --------------------------------------------------------------------

start_container() {
    docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
    docker run -d --name "$CONTAINER" --restart unless-stopped \
        -p "$HOST_PORT:3100" \
        --memory "$MEMORY" \
        --env-file "$ENV_FILE" \
        -e PORT=3100 \
        "$1" >/dev/null
}

wait_healthy() {
    local deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS)) status
    while ((SECONDS < deadline)); do
        status="$(docker container inspect -f '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' "$CONTAINER" 2>/dev/null || echo missing)"
        case "$status" in
            "running healthy") return 0 ;;
            running*) ;;
            *) return 1 ;; # exited, restarting, or gone
        esac
        # The image's HEALTHCHECK only runs every 30s, so probe directly too.
        if docker exec "$CONTAINER" bun -e \
            "fetch('http://localhost:3100/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))" \
            >/dev/null 2>&1; then
            return 0
        fi
        sleep 2
    done
    return 1
}

log "Starting $CONTAINER on port $HOST_PORT"
start_container "$IMAGE:latest"

if wait_healthy; then
    log "Deployed; health check passed"
    docker image prune -f >/dev/null
    exit 0
fi

echo >&2
printf '\033[1;31merror:\033[0m %s did not become healthy. Recent logs:\n' "$CONTAINER" >&2
docker logs --tail 50 "$CONTAINER" >&2 || true

if [[ -n "$previous_image" ]]; then
    log "Rolling back to the previous image"
    start_container "$IMAGE:previous"
    wait_healthy && log "Rollback healthy" || die "rollback also failed; check 'docker logs $CONTAINER'"
fi
exit 1
