# LSP gateway

Gives the website's code editor autocomplete, diagnostics, hover, signature
help, and go-to-definition. Each browser WebSocket gets its own language
server process and scratch workspace; the gateway relays LSP messages between
them.

```
browser (Monaco) ──ws──▶ gateway ──stdio──▶ jdtls / pyright / clangd
                  JSON per frame      Content-Length framing
```

The website works without it: if the gateway is unset or unreachable, the
editor falls back to syntax highlighting and shows a toast.

## Deploy

```sh
./deploy.sh   # builds, restarts, waits for /health, rolls back on failure
```

It reads settings from `lsp-gateway/.env` (git-ignored) and generates
`LSP_GATEWAY_SECRET` there on first run. Run `./deploy.sh --help` for options;
set `DOCKER_HOST=ssh://user@host` to deploy to a remote machine. The
equivalent manual steps:

```sh
docker build -t lsp-gateway .
docker run -d --name lsp-gateway --restart unless-stopped \
  -p 3100:3100 \
  --memory 6g \
  -e LSP_GATEWAY_SECRET='<same value as the website>' \
  -e ALLOWED_ORIGINS='https://your-site.example' \
  lsp-gateway
```

Put it behind a TLS-terminating proxy so browsers can reach it as `wss://`
(pages served over https can't open plain `ws://` connections), and make sure
the proxy forwards WebSocket upgrades.

Then set on the **website**:

```sh
LSP_GATEWAY_URL=wss://lsp.your-site.example
LSP_GATEWAY_SECRET=<same value as the gateway>   # 32+ characters
```

Generate a secret with `openssl rand -base64 48`.

## Configuration

| Variable                | Default              | Meaning                                                             |
| ----------------------- | -------------------- | ------------------------------------------------------------------- |
| `LSP_GATEWAY_SECRET`    | required             | Shared with the website; verifies connection tokens                 |
| `ALLOWED_ORIGINS`       | _(any)_              | Comma-separated browser origins; **set in production**              |
| `PORT`                  | `3100`               |                                                                     |
| `MAX_SESSIONS`          | `20`                 | Total concurrent language servers                                   |
| `MAX_SESSIONS_PER_USER` | `2`                  |                                                                     |
| `IDLE_TIMEOUT_MINUTES`  | `15`                 | Close sessions with no editor activity                              |
| `WORKSPACE_ROOT`        | `/tmp/lsp-sessions`  | Per-session scratch directories (deleted on disconnect)             |
| `LSP_COMMAND_<ID>`      | see `src/servers.ts` | Override a server's command (`{project}`, `{session}` placeholders) |

**Sizing:** jdtls uses roughly 300–500 MB per session, pyright ~100 MB, clangd
~50 MB. Set `MAX_SESSIONS` and the container memory limit together.

## Security model

- The website mints a 60-second HMAC token (`src/lib/lsp/token.ts`) for a
  signed-in user and one server; the gateway rejects anything else.
- WebSockets aren't covered by CORS, so `ALLOWED_ORIGINS` is what stops other
  sites from using a leaked token.
- Per-user and global session caps, plus idle timeouts, bound how many
  processes one person can start.
- Files are only written by base name inside the session directory.
- The container runs as a non-root user. Language servers can still read the
  container's filesystem, so don't mount secrets into it.

## Adding a language server

1. Install it in the `Dockerfile`.
2. Add its command, and any project files it needs, to `src/servers.ts`.
3. Add its ID to `LSP_SERVER_IDS` and its language family to `LSP_TARGETS` in
   the website's `src/lib/lsp/servers.ts`.

## Develop

```sh
bun install
bun test          # includes an end-to-end test with a fake language server
bun run typecheck
LSP_GATEWAY_SECRET=$(openssl rand -base64 48) bun run dev
```
