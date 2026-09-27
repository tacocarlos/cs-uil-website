import { mkdirSync } from "node:fs";
import { loadConfig } from "./config";
import { SERVER_IDS } from "./servers";
import { log, Session } from "./session";
import { verifyToken } from "./token";

type SocketData = {
    serverId: string;
    userId: string;
    session?: Session;
};

const config = loadConfig();
mkdirSync(config.workspaceRoot, { recursive: true });

const sessions = new Set<Session>();

function sessionsForUser(userId: string): number {
    let count = 0;
    for (const s of sessions) if (s.userId === userId) count++;
    return count;
}

function reject(status: number, reason: string, fields = {}): Response {
    log("rejected", { status, reason, ...fields });
    return new Response(reason, { status });
}

const server = Bun.serve<SocketData>({
    port: config.port,

    fetch(req, server) {
        const url = new URL(req.url);
        if (url.pathname === "/health") {
            return Response.json({ ok: true, sessions: sessions.size });
        }

        const serverId = /^\/lsp\/([a-z0-9-]+)$/.exec(url.pathname)?.[1];
        if (!serverId || !SERVER_IDS.includes(serverId)) {
            return new Response("Not found", { status: 404 });
        }

        // Browsers send Origin on WebSocket upgrades but WebSockets aren't
        // subject to CORS, so this check is what stops other sites from
        // using the gateway with a leaked token.
        const origin = req.headers.get("origin") ?? "";
        if (
            config.allowedOrigins.length > 0 &&
            !config.allowedOrigins.includes(origin)
        ) {
            return reject(403, "origin not allowed", { origin });
        }

        // Browsers can't set headers on WebSocket requests, so the token
        // rides in the query string. It expires within a minute.
        const check = verifyToken(
            url.searchParams.get("token") ?? "",
            config.secret,
            serverId,
        );
        if (!check.ok) return reject(401, check.reason);
        const userId = check.payload.sub;

        if (sessions.size >= config.maxSessions) {
            return reject(503, "gateway at capacity");
        }
        if (sessionsForUser(userId) >= config.maxSessionsPerUser) {
            return reject(429, "too many sessions for user", { userId });
        }

        if (server.upgrade(req, { data: { serverId, userId } })) return;
        return reject(400, "expected a WebSocket upgrade");
    },

    websocket: {
        // Bun pings idle connections and closes ones that stop answering,
        // which reaps browsers that vanished without a clean close.
        idleTimeout: 120,
        sendPings: true,

        open(ws) {
            try {
                const session = new Session(
                    ws.data.serverId,
                    ws.data.userId,
                    config,
                    {
                        send: (json) => ws.send(json),
                        close: (code, reason) => ws.close(code, reason),
                    },
                );
                ws.data.session = session;
                sessions.add(session);
            } catch (error) {
                log("failed to start session", { error: String(error) });
                ws.close(1011, "failed to start language server");
            }
        },

        message(ws, message) {
            const text =
                typeof message === "string"
                    ? message
                    : Buffer.from(message).toString("utf8");
            ws.data.session?.fromClient(text);
        },

        close(ws) {
            const session = ws.data.session;
            if (!session) return;
            sessions.delete(session);
            void session.dispose();
        },
    },
});

log("listening", { port: server.port, servers: SERVER_IDS });

async function shutdown() {
    log("shutting down", { sessions: sessions.size });
    server.stop(true);
    await Promise.all([...sessions].map((s) => s.dispose()));
    process.exit(0);
}
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
