# Assignment: WebSockets, From Raw Protocol to Realtime Contest Platform

**Audience:** you — a CS grad (scientific computing background) who is competent
with webdev but has never worked with WebSockets directly.

**Time budget:** ~8–10 hours total, in 6 phases. Each phase is a self-contained
sitting. Do them in order — Phases 1–2 are what make the abstractions in
Phases 4–5 legible instead of magical.

**The end state:** the teacher contest dashboard and the student contest lobby
of this repo update in near-real-time when submissions arrive and when a
contest's status changes — and you can explain every layer of how.

---

## How to work through this

- Keep a running `websocket-notes.md` journal in the repo root. Every phase
  ends with **checkpoint questions** — write your answers there before moving
  on. If you can't answer one, you have a gap; go back, not forward.
- Code blocks are **scaffolds with TODOs**, not solutions. If you find
  yourself copying without being able to explain a line, stop and look it up.
- Each phase has a **definition of done**. Don't start the next phase until
  you can check every box.

---

## Phase 0 — Mental model (~30 min, reading only)

You already know TCP sockets from scientific computing (think: MPI channels,
or a raw socket you `read`/`write` in a loop). The goal here is to map that
intuition onto the web platform.

**Read, in this order:**

1. MDN: [The WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
   — just the conceptual intro and the `WebSocket` interface page.
2. RFC 6455 §1 (Introduction) and §5 (Data Framing) —
   [https://datatracker.ietf.org/doc/html/rfc6455](https://datatracker.ietf.org/doc/html/rfc6455).
   Skim; you'll come back to §5 in Phase 2.
3. MDN: [Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
   — the conceptual overview only. You need to know this exists to make an
   informed transport choice later.

**Checkpoint questions:**

- HTTP is request/response: the client asks, the server answers, the
  connection's job is done. What are the *two* fundamental limitations this
  imposes on a live dashboard, and how do (a) polling, (b) SSE, and
  (c) WebSockets each work around them?
- A WebSocket connection starts life as an ordinary HTTP request. What
  happens to it, and why was it designed that way? (Hint: think about
  proxies, ports 80/443, and firewalls.)
- Which party can send first on an open WebSocket connection? On SSE? On
  plain HTTP?

**Done when:** you can draw the lifecycle of all three transports on one
diagram from memory.

---

## Phase 1 — Raw echo server (~45 min)

No frameworks. The point is to see the protocol with nothing in the way.

**Setup:**

```sh
npm install ws        # the only dependency this phase needs
```

**Task 1.1 — server.** Create `dev-scripts/ws-echo.mjs`:

```js
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 3001 });

wss.on("connection", (ws, req) => {
    console.log("client connected from", req.socket.remoteAddress);
    // TODO: echo every received message back, prefixed with "echo: "
    // TODO: log when the client disconnects
});

console.log("ws echo server listening on :3001");
```

Run it: `node dev-scripts/ws-echo.mjs`.

**Task 1.2 — client.** Don't write one. Open any browser tab, open devtools
console, and drive the **native** API by hand:

```js
const ws = new WebSocket("ws://localhost:3001");
ws.onmessage = (e) => console.log("got:", e.data);
ws.send("hello");
```

**Task 1.3 — observe the handshake.** In devtools → Network, filter by "WS",
click the request, and study the **Headers** tab. Find:

- The request headers `Upgrade`, `Connection`, `Sec-WebSocket-Key`,
  `Sec-WebSocket-Version`.
- The response: status code, and `Sec-WebSocket-Accept`.

Then read RFC 6455 §1.3 and figure out *exactly* how `Sec-WebSocket-Accept`
is computed from `Sec-WebSocket-Key`. (You can verify your understanding in
Node with `crypto` — do it.)

**Checkpoint questions:**

- Why does the handshake use a SHA-1 hash of a client nonce plus a magic
  GUID, instead of the server just replying "ok"? What failure is this
  protecting against?
- Why must every frame from client → server be *masked* (RFC 6455 §5.3),
  while server → client frames are not?
- What happens if you `new WebSocket("ws://localhost:3001")` while the server
  is down — which event fires, and what can you actually learn from it in the
  browser? (Less than you'd hope. Why?)

**Done when:** echo works, you've identified every handshake header, and
you've reproduced the `Sec-WebSocket-Accept` computation yourself.

---

## Phase 2 — Broadcast, lifecycle, and heartbeats (~1 hr)

One connection is a parlor trick. Realtime features are about *sets* of
connections and their lifecycles.

**Task 2.1 — chat.** Extend your echo server into a broadcaster: every
message from any client goes to *all* connected clients. You'll need a
registry of live connections — look at what `wss.clients` gives you. Open
three browser tabs and chat with yourself.

**Task 2.2 — death detection.** Now kill a client the rude way: close the
laptop lid / kill the browser process / disable the network adapter — not a
clean tab close. Does the server's `close` event fire? (Probably not
promptly.) This is the single most important operational fact about
long-lived connections: **TCP can't distinguish "idle" from "gone" without
traffic.**

**Task 2.3 — heartbeat.** Implement the standard fix: server sends a
WebSocket *ping* frame every N seconds; each client is flagged dead and
terminated if it hasn't responded (pong, or any message) within a window.
`ws` exposes `ws.ping()`, `ws.on('pong', ...)`, and `ws.terminate()`. The
browser answers pings automatically — you never see pong in JS. Why is that
the right design?

**Task 2.4 — close codes.** Trigger and log: a clean close (1000), server
shutdown (1001), and an abnormal drop (1006 — observe that this one is
*never sent on the wire*; who synthesizes it?).

**Stretch (highly recommended for a scientific-computing brain):** skip `ws`
entirely for one connection. Open a raw TCP socket to your server with
Node's `net` module, send a hand-crafted HTTP Upgrade request, and parse the
incoming frames byte-by-byte per RFC 6455 §5 (FIN bit, opcode, mask,
7/16/64-bit length). There is no better way to make the protocol permanent
in your head.

**Checkpoint questions:**

- Your broadcast loop sends to every client in `wss.clients`. What can go
  wrong if a client's TCP buffer is full (slow consumer)? What does
  `ws.bufferedAmount` tell you?
- Why is "send a message, see if it errors" not a sufficient liveness check?
- Compare the ping/pong heartbeat to MPI's approach to detecting a dead
  rank. What's analogous, what's different, and why?

**Done when:** three tabs chat, a network-killed client is reaped within
your heartbeat window, and you can name the opcode of a ping frame without
looking it up.

---

## Phase 3 — Getting events *out* of Next.js (~1.5 hr)

Now the real app. The feature: when `contest.setStatus` flips a contest to
`active`, connected clients should hear about it.

**Task 3.1 — the naive attempt (do it, watch it fail).** Create
`src/server/api/events.ts` exporting a Node `EventEmitter`. In
`setStatus` (`src/server/api/routers/contest.ts:406`), emit
`("statusChanged", { contestId, status })`. In your Phase 2 server, import
that same emitter and broadcast on event. Run both. Flip a contest status.

It won't work. **Figure out precisely why before reading on.** Then
articulate it: how many OS processes are running? What does "the same
module" mean across processes? (This is the distributed-systems lesson that
motivates Redis, and it's worth earning the hard way.)

**Task 3.2 — the bridge.** Two legitimate fixes; implement **(a)**, read
about **(b)**:

- **(a) HTTP bridge:** the WS server also listens on a plain HTTP port
  (e.g. `POST /emit` on :3002). The tRPC mutation `fetch`es it after the DB
  write. Two processes, one explicit wire. Simple, debuggable, and it
  mirrors how microservices actually talk.
- **(b) Single-process custom server:** replace `next start` with a
  `server.ts` that hosts both Next's request handler and the
  `WebSocketServer` on the same port. Fewer moving parts in prod, but you
  give up some Next dev ergonomics. Read the Next.js "custom server" docs
  and know the tradeoffs; don't implement it now.

**Task 3.3 — a real browser client.** Write a throwaway React client
component that opens a WebSocket to your server and toasts (you have
`sonner`) on every `statusChanged` event. Mount it somewhere visible.

**Checkpoint questions:**

- Your bridge does a fire-and-forget `fetch` from inside a mutation. What
  happens to realtime delivery if the WS server is down but the mutation
  succeeds? Is that acceptable for this app? How would you make it
  at-least-once?
- WebSockets are **not** subject to CORS the way `fetch` is. What stops a
  random website from opening a socket to your server and receiving contest
  events? (Hint: what header *is* sent on the upgrade request, and are you
  checking it?)
- Why is emitting *after* the DB write commits (rather than before) the
  correct ordering?

**Done when:** clicking "Start Now" in the teacher UI produces a toast in a
separate browser within a second, and you can explain every hop the event
took.

---

## Phase 4 — tRPC subscriptions: the abstraction you just earned (~1.5 hr)

You've built pub/sub over WebSockets by hand. Now replace your hand-rolled
protocol with the framework's — and notice how much of it you now recognize.

**Task 4.1 — WS transport.** tRPC v11 has first-class subscriptions:

- Server: `applyWSSHandler` from `@trpc/server/adapters/ws`, wrapping your
  existing `appRouter` — this replaces your Phase 3 message protocol with
  tRPC's own.
- Router: add `contest.onStatusChange` as a `subscription` procedure
  returning an `async generator` that yields events from your `EventEmitter`
  (filtered by `contestId`). The generator's `try/finally` is where
  per-subscriber cleanup goes — think about what needs it.
- Client (`src/trpc/react.tsx`): add `wsLink`, and route operations with
  `splitLink` — subscriptions over WS, queries/mutations over the existing
  `httpBatchStreamLink`.
- Consume: `api.contest.onStatusChange.useSubscription(...)` in your Phase
  3.3 component.

**Task 4.2 — SSE transport, same procedures.** Now swap the client link to
`httpSubscriptionLink` and delete the WS server entirely — subscriptions
stream over your existing `/api/trpc` route handler. Verify the feature
still works.

**Task 4.3 — compare honestly.** Fill in this table in your notes (rows:
transport; columns: directionality, infra required, auto-reconnect,
resume-after-disconnect, behavior through corporate proxies, connection
limit per browser, fit for this app):

| | polling | SSE (`httpSubscriptionLink`) | WebSocket (`wsLink`) |
|---|---|---|---|
| … | | | |

**Checkpoint questions:**

- tRPC subscriptions are async generators. What does `return`ing from the
  generator do to the client? What does a `throw` do?
- In dev, React StrictMode double-mounts effects. Predict, then observe:
  how many WS connections does one mounted `useSubscription` briefly create?
  Is that a bug in your code?
- Your events will feel 100–500 ms "late" in dev even though the socket is
  instant. Find the culprit in `src/server/api/trpc.ts` and explain why it
  exists.

**Done when:** the same subscription procedure works over both transports,
and you've written down which one you'd ship for this app and why. (There
is a defensible argument for each — make yours explicit.)

---

## Phase 5 — Ship the feature (~2 hr)

Everything is in place. Now do the real work on the real pages.

**Task 5.1 — teacher dashboard.**
`src/app/(user)/dashboard/teacher/contests/[contestId]/page.tsx` is a client
component using `useQuery`. Add a `contest.onSubmission` subscription
(emit from `execute.submitCode` after the insert at
`src/server/api/routers/execute.ts:269`). On each event, use
`utils.contest.invalidate()` and let React Query refetch. Design decision to
make and defend in your notes: push the full submission row through the
socket vs. push a minimal "something changed" ping and refetch. Which is
more robust to missed events?

**Task 5.2 — student lobby.**
`src/app/contest/[contestId]/page.tsx` is a **server component** — no hooks.
The pattern: create a tiny client component
(`_status-listener.tsx`, colocated with `_enroll-button.tsx`) that
subscribes to `onStatusChange` and calls `router.refresh()` when the status
changes, causing Next to re-render the server component with fresh data.
Render it from the lobby. Test: two browsers, one teacher one student;
"Start Now" should unlock the student's view in ~a second with no refresh.

**Task 5.3 — close the gating gap.** The problem page
(`src/app/contest/[contestId]/problem/[label]/page.tsx`) never checks
`contest.status`, so problems are reachable before the contest opens. Add a
`status === "active"` guard (decide: redirect to lobby, or render a
"waiting" state?). Without this, your realtime "opening" is theater.

**Task 5.4 — auth.** Every procedure in this app is `publicProcedure`;
teacher gating lives only in the layout. Your new subscription streams
submission data to anyone who calls it. Add a `teacherProcedure` middleware
(session from better-auth via the request headers — the WS upgrade and the
SSE GET both carry cookies) and protect the teacher-facing subscription.

**Done when:** teacher sees submissions live; students see contests open,
freeze, and end live; problem pages are actually gated; the teacher stream
rejects anonymous callers.

---

## Phase 6 — Hardening (stretch, pick any two)

- **Resume after disconnect:** tRPC's `tracked()` events + `lastEventId`
  let a reconnecting client replay what it missed. Implement it, then test
  by sleeping your laptop mid-contest.
- **Load test:** write a script that opens 200 concurrent subscribers.
  Watch memory and event latency. Where does it degrade, and what's the
  first fix?
- **Heartbeat on the real transport:** port your Phase 2.3 heartbeat to the
  tRPC WS server (`applyWSSHandler` exposes the underlying `wss`).
- **Deployment analysis:** write a one-page memo: "why this architecture
  cannot run on Vercel serverless, and the three cheapest hosting options
  that would work." Include what breaks (in-memory bus, long-lived
  connections) and why.

---

## Final reflection (write this in your notes, ~15 min)

1. Explain to a hypothetical junior dev why SSE — not WebSockets — is the
   pragmatic choice for *this particular* feature set, and what future
   feature would flip the decision.
2. What did the framework (tRPC) hide that you were glad to have already
   seen by hand? What did it handle that you hadn't thought of?
3. Where in this codebase is realtime *not* worth it, and why?

## Resources

- RFC 6455 — the protocol. Surprisingly readable.
- MDN WebSocket API + Server-sent events docs.
- tRPC v11 docs: "Subscriptions", `wsLink`, `httpSubscriptionLink`,
  `tracked`.
- `ws` GitHub README — the sections on heartbeats and `bufferedAmount` are
  production wisdom, not boilerplate.
