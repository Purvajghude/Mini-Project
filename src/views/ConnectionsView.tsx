import React, { useMemo, useState } from 'react';
import { Check, Compass, Copy, ExternalLink, Inbox, MessageCircle, ShieldCheck, Users, X } from 'lucide-react';
import { Avatar, Button, Card, Chip } from '../components/m3';
import { ConnectionMatch, DiscordConnectionStatus, IncomingInterest, Profile } from '../types/api';
import './ConnectionsView.css';

interface ConnectionsViewProps {
  currentUser: Profile;
  matches: ConnectionMatch[];
  incomingRequests: IncomingInterest[];
  discordConnection: DiscordConnectionStatus;
  onOpenDiscordCommunity: () => void;
  onAcceptRequest: (requestId: string) => Promise<void>;
  onDeclineRequest: (requestId: string) => Promise<void>;
  onToast: (msg: string) => void;
  busy?: boolean;
}

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({ currentUser, matches, incomingRequests, discordConnection, onOpenDiscordCommunity, onAcceptRequest, onDeclineRequest, onToast, busy = false }) => {
  const [tab, setTab] = useState<'community' | 'requests'>('community');
  const pending = useMemo(() => incomingRequests.filter((request) => request.status === 'PENDING'), [incomingRequests]);

  const accept = async (request: IncomingInterest) => {
    await onAcceptRequest(request.id);
    setTab('community');
    onToast(`You are now connected with ${request.senderName}. Start the group conversation in Discord.`);
  };

  return <main className="community-page">
    <header className="community-heading">
      <div><p>COMMUNITY</p><h1>Meet in MESH. Build in Discord.</h1></div>
      <div className="community-tabs" role="tablist"><Chip selected={tab === 'community'} onClick={() => setTab('community')} icon={<Users size={14} />}>Collaborators ({matches.length})</Chip><Chip selected={tab === 'requests'} onClick={() => setTab('requests')} icon={<Inbox size={14} />}>Requests{pending.length ? ` (${pending.length})` : ''}</Chip></div>
    </header>

    {tab === 'community' ? <>
      <Card variant="elevated" className="community-discord-card">
        <div className="community-discord-mark"><MessageCircle size={29} /></div>
        <div><span className="community-kicker">MESH DISCORD</span><h2>{discordConnection.connected ? `Linked as ${discordConnection.globalName || discordConnection.username}` : 'Join the MESH Discord server'}</h2><p>Use the server for community conversations. Each project can open its own invite-only room from the Projects tab.</p></div>
        <Button variant="filled" icon={<ExternalLink size={16} />} onClick={onOpenDiscordCommunity}>Open Discord</Button>
      </Card>
      <section className="community-flow" aria-label="How collaboration works"><div><ShieldCheck size={18} /><strong>Discover</strong><span>MESH ranks compatible people using the profile signals they chose to share.</span></div><div><Check size={18} /><strong>Connect</strong><span>Mutual interest turns a recommendation into a collaborator connection.</span></div><div><MessageCircle size={18} /><strong>Coordinate</strong><span>Project members open their dedicated Discord room from Projects.</span></div></section>
      <section className="community-collaborators"><div className="community-section-heading"><div><h2>Your collaborators</h2></div>{pending.length > 0 && <Button variant="tonal" size="sm" onClick={() => setTab('requests')}>Review requests</Button>}</div>
        {matches.length ? <div className="community-match-grid">{matches.map((match) => <Card key={match.id} variant="outlined" className="community-match-card"><Avatar name={match.collaborator.displayName} tone={match.collaborator.avatarKey} size="lg" online /><div style={{ flex: 1 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><h3>{match.collaborator.displayName}</h3>{match.collaborator.discordId && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#5865F2', backgroundColor: 'rgba(88, 101, 242, 0.1)', padding: '2px 8px', borderRadius: 'var(--md-sys-shape-corner-full)' }} title={`Discord ID: ${match.collaborator.discordId}`}><MessageCircle size={12} /> {match.collaborator.discordId}</span>}</div><p>{match.collaborator.department || 'Student collaborator'} · {match.collaborator.primaryDomain || 'Open to build'}</p><span>{match.fitDescription}</span></div><div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch' }}>{match.collaborator.discordId && <div style={{ display: 'flex', gap: 6 }}><a href={`discord://users/${match.collaborator.discordId}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--md-sys-shape-corner-full)', backgroundColor: '#5865F2', color: '#FFFFFF', fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }} title={`Direct message ${match.collaborator.displayName} on Discord`}><MessageCircle size={14} /><span>DM on Discord</span></a><button type="button" onClick={() => { navigator.clipboard.writeText(match.collaborator.discordId!); onToast(`Copied ${match.collaborator.displayName}'s Discord ID (${match.collaborator.discordId})`); }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 'var(--md-sys-shape-corner-full)', padding: '6px 8px', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer' }} title="Copy Discord ID"><Copy size={13} /></button></div>}<Button variant="tonal" size="sm" icon={<Compass size={15} />} onClick={onOpenDiscordCommunity}>Server room</Button></div></Card>)}</div> : <Card variant="outlined" className="community-empty"><Users size={26} /><h3>Your collaborators will appear here.</h3><p>Send a request from Discover, or accept one from the Requests tab.</p></Card>}
      </section>
    </> : <section className="community-requests"><div className="community-section-heading"><div><h2>Collaboration requests</h2></div></div>{pending.length ? <div className="community-request-list">{pending.map((request) => <Card key={request.id} variant="outlined" className="community-request-card"><div className="community-request-person"><Avatar name={request.senderName} tone={request.avatarKey} size="md" online /><div><h3>{request.senderName}</h3><p>{request.senderDepartment || 'Student collaborator'}{request.senderYear ? ` · Year ${request.senderYear}` : ''}</p></div></div><p>{request.reason || 'This person would like to collaborate based on your shared profile signals.'}</p><div className="community-request-actions"><Button variant="text" size="sm" icon={<X size={15} />} disabled={busy} onClick={() => onDeclineRequest(request.id)}>Decline</Button><Button variant="filled" size="sm" icon={<Check size={15} />} disabled={busy} onClick={() => accept(request)}>Accept connection</Button></div></Card>)}</div> : <Card variant="outlined" className="community-empty"><Inbox size={26} /><h3>No requests waiting.</h3><p>When someone asks to connect, you can review it here.</p></Card>}</section>}
  </main>;
};
