import { useCallback, useEffect, useMemo, useState } from 'react';
import { Tldraw, computed, createUserId, inlineBase64AssetStore } from 'tldraw';
import { useSync } from '@tldraw/sync';
import 'tldraw/tldraw.css';
import { session } from '../lib/api';
import { useMe } from '../lib/auth';
import { hueFor } from '../lib/format';
import type { Project } from '../lib/types';
import { Loading } from '../ui';

const SYNC_HTTP = (import.meta.env.VITE_SYNC_URL ?? location.origin).replace(/\/$/, '');
const SYNC_WS = SYNC_HTTP.replace(/^http/, 'ws');

class TicketError extends Error { constructor(readonly status: number, message: string) { super(message); } }

/** Exchange the MESH session for a single-use room ticket; the sync server checks membership with the API. */
async function ticket(projectId: string) {
  let r: Response;
  try {
    r = await fetch(`${SYNC_HTTP}/sync/tickets/${projectId}`, { method: 'POST', headers: { Authorization: `Bearer ${session.token()}` } });
  } catch {
    throw new TicketError(0, 'The board server isn’t reachable. Start it with “npm run web:sync”.');
  }
  if (!r.ok) {
    const body = await r.json().catch(() => null);
    throw new TicketError(r.status, body?.message ?? `Board server returned ${r.status}.`);
  }
  return (await r.json()).ticket as string;
}

export default function Board({ project }: { project: Project }) {
  const [check, setCheck] = useState<'checking' | 'ok' | TicketError>('checking');
  useEffect(() => {
    // One upfront check gives a clear message for non-members or a stopped server before the canvas mounts.
    ticket(project.id).then(() => setCheck('ok'), (e: TicketError) => setCheck(e));
  }, [project.id]);

  if (check === 'checking') return <div className="wrap"><Loading label="Connecting to the board" /></div>;
  if (check instanceof TicketError) {
    return (
      <div className="wrap empty sheet">
        <h2 className="title" style={{ fontSize: 26 }}>{check.status === 403 ? 'Only project members can open this board' : 'The board isn’t available'}</h2>
        <p>{check.message}</p>
      </div>
    );
  }
  return <LiveBoard project={project} />;
}

function LiveBoard({ project }: { project: Project }) {
  const me = useMe();
  const users = useMemo(() => ({
    currentUser: computed('mesh-user', () => ({
      typeName: 'user' as const, id: createUserId(me.id), name: me.displayName, imageUrl: '', color: `hsl(${hueFor(me.id)} 60% 45%)`, meta: {},
    })),
  }), [me.id, me.displayName]);

  // useSync rebuilds its client whenever an option changes identity, so the uri callback must be stable.
  const uri = useCallback(async () => `${SYNC_WS}/sync/rooms/${project.id}?ticket=${await ticket(project.id)}`, [project.id]);
  const store = useSync({
    uri,
    // ponytail: images are embedded as base64 in the board document; add an upload endpoint if boards get image-heavy.
    assets: inlineBase64AssetStore,
    users,
  });

  if (store.status === 'loading') return <div className="wrap"><Loading label="Loading the board" /></div>;
  if (store.status === 'error') return <div className="wrap empty sheet"><h2 className="title" style={{ fontSize: 26 }}>Lost the board connection</h2><p>{store.error.message}</p></div>;
  return (
    <div className="board" aria-label={`${project.name} whiteboard`}>
      <Tldraw
        store={store.store}
        licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
        // Dev-only handle for end-to-end sync checks.
        onMount={(editor) => { if (import.meta.env.DEV) (window as unknown as { editor: unknown }).editor = editor; }}
      />
      {store.connectionStatus === 'offline' && <div className="board-offline" role="status">Reconnecting… your edits will sync when the connection returns.</div>}
    </div>
  );
}
