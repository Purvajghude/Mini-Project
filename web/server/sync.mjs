// MESH whiteboard sync server: one tldraw room per project, persisted to disk.
// Authorization is delegated to the MESH API: a caller may open a room only if
// GET /projects/{id} succeeds with their own bearer token (i.e. they are a member).
//
//   POST /sync/tickets/:projectId   (Authorization: Bearer <MESH JWT>) -> { ticket }
//   WS   /sync/rooms/:projectId?ticket=...&sessionId=...
//
// Env: MESH_API (default http://localhost:8080/api/v1), SYNC_PORT (5858),
//      SYNC_DATA_DIR (web/server/data), SYNC_ALLOWED_ORIGIN (CORS for the ticket endpoint when not proxied).

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { TLSocketRoom } from '@tldraw/sync-core';

const API = (process.env.MESH_API ?? 'http://localhost:8080/api/v1').replace(/\/$/, '');
const PORT = Number(process.env.SYNC_PORT ?? 5858);
const DATA = process.env.SYNC_DATA_DIR ?? join(dirname(fileURLToPath(import.meta.url)), 'data');
const ORIGIN = process.env.SYNC_ALLOWED_ORIGIN ?? '';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TICKET_TTL_MS = 60_000;

/** ticket -> { projectId, expires } ; single use */
const tickets = new Map();
/** projectId -> { room, saveTimer } */
const rooms = new Map();

await mkdir(DATA, { recursive: true });
const fileFor = (id) => join(DATA, `${id}.json`); // id is UUID-validated before use

async function loadRoom(id) {
  let entry = rooms.get(id);
  if (entry) return entry;
  let initialSnapshot;
  try { initialSnapshot = JSON.parse(await readFile(fileFor(id), 'utf8')); } catch { /* new board */ }
  entry = rooms.get(id); // another connection may have created it while we awaited
  if (entry) return entry;
  entry = { saveTimer: null, room: null };
  entry.room = new TLSocketRoom({
    initialSnapshot,
    log: { warn: (...a) => console.warn(`[room ${id}]`, ...a), error: (...a) => console.error(`[room ${id}]`, ...a) },
    ...(process.env.SYNC_DEBUG ? {
      onBeforeSendMessage: ({ stringified }) => console.log('→', stringified.slice(0, 200)),
      onAfterReceiveMessage: ({ stringified }) => console.log('←', stringified.slice(0, 200)),
    } : {}),
    onDataChange: () => scheduleSave(id),
    onSessionRemoved: async (room, { numSessionsRemaining }) => {
      if (numSessionsRemaining > 0) return;
      await save(id);
      room.close();
      rooms.delete(id);
    },
  });
  rooms.set(id, entry);
  return entry;
}

function scheduleSave(id) {
  const entry = rooms.get(id);
  if (!entry || entry.saveTimer) return;
  entry.saveTimer = setTimeout(() => { entry.saveTimer = null; void save(id); }, 1500);
}

async function save(id) {
  const entry = rooms.get(id);
  if (!entry) return;
  clearTimeout(entry.saveTimer);
  entry.saveTimer = null;
  const tmp = `${fileFor(id)}.tmp`;
  await writeFile(tmp, JSON.stringify(entry.room.getCurrentSnapshot()));
  await rename(tmp, fileFor(id)); // atomic replace so a crash never leaves a half-written board
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...(ORIGIN ? { 'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Allow-Headers': 'Authorization' } : {}) });
  res.end(JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local');
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method === 'GET' && url.pathname === '/sync/health') return send(res, 200, { status: 'UP', rooms: rooms.size });
  const m = url.pathname.match(/^\/sync\/tickets\/([^/]+)$/);
  if (req.method !== 'POST' || !m) return send(res, 404, { message: 'Not found.' });
  const projectId = m[1];
  if (!UUID.test(projectId)) return send(res, 400, { message: 'Invalid project id.' });
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return send(res, 401, { message: 'Sign in to open the board.' });
  let check;
  try {
    check = await fetch(`${API}/projects/${projectId}`, { headers: { Authorization: auth } });
  } catch {
    return send(res, 503, { message: 'The board server cannot reach the MESH API.' });
  }
  if (check.status === 401) return send(res, 401, { message: 'Your session has expired. Sign in again.' });
  if (check.status === 403 || check.status === 404) return send(res, 403, { message: 'You are not a member of this project.' });
  if (!check.ok) return send(res, 502, { message: `MESH API returned ${check.status}.` });
  const ticket = randomUUID();
  tickets.set(ticket, { projectId, expires: Date.now() + TICKET_TTL_MS });
  send(res, 200, { ticket });
});

const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, 'http://local');
  const m = url.pathname.match(/^\/sync\/rooms\/([^/]+)$/);
  const ticketId = url.searchParams.get('ticket') ?? '';
  const sessionId = url.searchParams.get('sessionId') ?? '';
  const t = tickets.get(ticketId);
  tickets.delete(ticketId);
  if (!m || !t || t.projectId !== m[1] || t.expires < Date.now() || !sessionId) {
    socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
    return socket.destroy();
  }
  wss.handleUpgrade(req, socket, head, async (ws) => {
    // Buffer messages that arrive while the room loads from disk.
    const pending = [];
    ws.on('message', (data) => pending.push(data));
    const { room } = await loadRoom(t.projectId);
    room.handleSocketConnect({ sessionId, socket: ws });
    ws.removeAllListeners('message');
    for (const data of pending) room.handleSocketMessage(sessionId, data.toString());
    ws.on('message', (data) => room.handleSocketMessage(sessionId, data.toString()));
    ws.on('close', (code, reason) => {
      if (process.env.SYNC_DEBUG) console.log(`[ws ${sessionId}] closed ${code} ${reason}`);
      room.handleSocketClose(sessionId);
    });
    ws.on('error', () => room.handleSocketError(sessionId));
  });
});

// ponytail: a member removed mid-session keeps their open socket until it reconnects; re-check on an interval if that matters.
setInterval(() => { const now = Date.now(); for (const [k, v] of tickets) if (v.expires < now) tickets.delete(k); }, 30_000).unref();

async function shutdown() {
  await Promise.all([...rooms.keys()].map(save));
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, () => console.log(`MESH board sync on :${PORT} → API ${API}, data in ${DATA}`));
