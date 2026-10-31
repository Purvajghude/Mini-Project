import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useLoad } from '../lib/hooks';
import { relative } from '../lib/format';
import { navigate } from '../lib/router';
import type { ProjectInvitation } from '../lib/types';
import { Avatar, Button, ErrorNote, Loading, useToast } from '../ui';

export function People() {
  const toast = useToast();
  const data = useLoad(async () => {
    const [invitations, incoming, connections] = await Promise.all([api.incomingInvitations(), api.incomingRequests(), api.connections()]);
    return { invitations, incoming, connections };
  }, []);
  const [busy, setBusy] = useState<string | null>(null);

  async function answer(inv: ProjectInvitation, accept: boolean) {
    setBusy(inv.id);
    try {
      if (accept) {
        await api.acceptInvitation(inv.id);
        toast(`You joined ${inv.projectName}`);
        navigate(`/p/${inv.projectId}`);
      } else {
        await api.declineInvitation(inv.id);
        toast('Invitation declined');
        await data.reload();
      }
    } catch (e) { toast((e as ApiError).message, 'error'); } finally { setBusy(null); }
  }

  async function respond(id: string, name: string, accept: boolean) {
    setBusy(id);
    try {
      if (accept) await api.acceptRequest(id); else await api.declineRequest(id);
      toast(accept ? `You’re connected with ${name}. Project owners can now add you to their team.` : 'Request declined');
      await data.reload();
    } catch (e) { toast((e as ApiError).message, 'error'); } finally { setBusy(null); }
  }

  return (
    <div className="wrap people">
      <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
        <h1 className="title">Your <em>collaborators.</em></h1>
        <p className="muted" style={{ maxWidth: 560 }}>When your declared skills fill a gap in someone’s project, they can invite you. Join, and the project opens in your studio with its tasks, schedule and board.</p>
      </div>
      <ErrorNote error={data.error} retry={data.reload} />
      {!data.data && data.loading && <Loading />}
      {data.data && (
        <div className="people-cols">
          <section className="stack">
            <h2 className="meta">Project invitations · {data.data.invitations.length}</h2>
            {data.data.invitations.length === 0 && <p className="small muted">No invitations right now.</p>}
            <ul className="requests">
              {data.data.invitations.map((inv) => (
                <li key={inv.id} className="sheet panel request invite">
                  <Avatar id={inv.inviterUserId} name={inv.inviterName} size={40} />
                  <div style={{ flex: 1 }}>
                    <b>{inv.inviterName}</b> invited you to join<br />
                    <span className="invite-project">{inv.projectName}</span>
                    <span className="small muted"> · {relative(inv.createdAt)}</span>
                  </div>
                  <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
                    <Button size="sm" variant="ghost" disabled={busy === inv.id} onClick={() => answer(inv, false)}><X />Decline</Button>
                    <Button size="sm" variant="signal" loading={busy === inv.id} onClick={() => answer(inv, true)}><Check />Join project</Button>
                  </div>
                </li>
              ))}
            </ul>
            <h2 className="meta" style={{ marginTop: 16 }}>Connection requests · {data.data.incoming.length}</h2>
            {data.data.incoming.length === 0 && <p className="small muted">No pending requests.</p>}
            <ul className="requests">
              {data.data.incoming.map((r) => (
                <li key={r.id} className="sheet panel request">
                  <Avatar id={r.senderId} name={r.senderName} size={40} />
                  <div style={{ flex: 1 }}><b>{r.senderName}</b> wants to collaborate<br /><span className="small muted">@{r.senderUsername} · {relative(r.createdAt)}</span></div>
                  <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
                    <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => respond(r.id, r.senderName, false)}><X />Decline</Button>
                    <Button size="sm" loading={busy === r.id} onClick={() => respond(r.id, r.senderName, true)}><Check />Accept</Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="stack">
            <h2 className="meta">Connected · {data.data.connections.length}</h2>
            {data.data.connections.length === 0 && <p className="small muted">No connections yet.</p>}
            <ul className="roster">
              {data.data.connections.map((c) => (
                <li key={c.id}>
                  <Avatar id={c.collaborator.id} name={c.collaborator.displayName} size={32} />
                  <span><b>{c.collaborator.displayName}</b><br /><span className="small muted">@{c.collaborator.username}{c.collaborator.department ? ` · ${c.collaborator.department}` : ''}</span></span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
