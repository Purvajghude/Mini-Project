import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  ExternalLink,
  Info,
  Inbox,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { Avatar, Badge, Button, Card, Chip, Dialog, TextField } from '../components/m3';
import { ChatMessage, ConnectionMatch, IncomingInterest, Profile } from '../types/api';

interface ConnectionsViewProps {
  currentUser: Profile;
  matches: ConnectionMatch[];
  incomingRequests: IncomingInterest[];
  onSendMessage: (matchId: string, content: string) => Promise<void>;
  onAcceptRequest: (requestId: string) => Promise<void>;
  onDeclineRequest: (requestId: string) => Promise<void>;
  onToast: (msg: string) => void;
  busy?: boolean;
}

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({
  currentUser,
  matches,
  incomingRequests,
  onSendMessage,
  onAcceptRequest,
  onDeclineRequest,
  onToast,
  busy = false,
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'inbox'>('chats');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(() => {
    return matches[0]?.id || null;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [collaboratorDossierOpen, setCollaboratorDossierOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync selected match if matches list changes
  useEffect(() => {
    if (matches.length > 0) {
      if (!selectedMatchId || !matches.some((m) => m.id === selectedMatchId)) {
        setSelectedMatchId(matches[0].id);
      }
    } else {
      setSelectedMatchId(null);
    }
  }, [matches, selectedMatchId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMatchId, matches]);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || null;

  // Filtered matches by search
  const filteredMatches = matches.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = m.collaborator.displayName.toLowerCase().includes(q);
    const projMatch = m.projectTitle.toLowerCase().includes(q);
    return nameMatch || projMatch;
  });

  const pendingCount = incomingRequests.filter((r) => r.status === 'PENDING').length;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !selectedMatchId) return;

    const content = messageInput.trim();
    setMessageInput('');
    await onSendMessage(selectedMatchId, content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* View Header with Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingBottom: 16,
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: 24, fontWeight: 750, color: 'var(--md-sys-color-on-surface)' }}>
            Connections &amp; Project Channels
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Direct channels provisioned after mutual interest. Coordinate sprints and project milestones.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Chip
            selected={activeTab === 'chats'}
            onClick={() => setActiveTab('chats')}
            icon={<MessageSquare size={14} />}
          >
            Active Conversations ({matches.length})
          </Chip>
          <Chip
            selected={activeTab === 'inbox'}
            onClick={() => setActiveTab('inbox')}
            icon={<Inbox size={14} />}
          >
            Incoming Requests {pendingCount > 0 && `(${pendingCount})`}
          </Chip>
        </div>
      </div>

      {activeTab === 'inbox' ? (
        /* INCOMING REQUESTS INBOX */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 840, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              Collaboration Requests ({incomingRequests.length})
            </h2>
            <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
              Accepting opens a mutual direct chat and project workspace.
            </span>
          </div>

          {incomingRequests.length === 0 ? (
            <Card variant="outlined" style={{ padding: 40, textAlign: 'center' }}>
              <Inbox size={36} color="var(--md-sys-color-primary)" style={{ marginBottom: 12 }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700 }}>No Pending Requests</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                When peers review your competencies and request collaboration, their notes will appear here.
              </p>
            </Card>
          ) : (
            incomingRequests.map((req) => (
              <Card
                key={req.id}
                variant="elevated"
                style={{
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Avatar name={req.senderName} tone={req.avatarKey || 'sapphire'} size="md" online />
                    <div>
                      <strong style={{ fontSize: 16, color: 'var(--md-sys-color-on-surface)' }}>
                        {req.senderName}
                      </strong>
                      <div style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {req.senderDepartment || 'Engineering'} · {req.senderYear ? `Year ${req.senderYear}` : ''}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                      backgroundColor: 'var(--md-custom-color-synergy-container)',
                      color: 'var(--md-custom-color-on-synergy-container)',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <Sparkles size={12} />
                    <span>{req.matchScore}% Synergy</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: 4, color: 'var(--md-sys-color-primary)' }}>
                    Note from {req.senderName.split(' ')[0]}:
                  </strong>
                  "{req.note}"
                </div>

                <div style={{ fontSize: 12, color: 'var(--md-sys-color-outline)' }}>
                  💡 <strong>Synergy Context:</strong> {req.reason} · Sent {req.sentAt}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <Button
                    variant="outlined"
                    size="sm"
                    disabled={busy}
                    onClick={() => onDeclineRequest(req.id)}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="filled"
                    size="sm"
                    icon={<Check size={15} />}
                    disabled={busy}
                    onClick={() => {
                      onAcceptRequest(req.id);
                      setActiveTab('chats');
                    }}
                  >
                    Accept Collaboration
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* CONVERSATIONS SPLIT SCREEN */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 340px) 1fr',
            gap: 20,
            height: 'calc(100vh - 200px)',
            minHeight: 520,
          }}
          className="connections-split-grid"
        >
          {/* Left Column: Thread List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              height: '100%',
              overflowY: 'auto',
            }}
            className={`connections-thread-list-col ${mobileChatOpen ? 'mobile-hidden' : ''}`}
          >
            {/* Search Box */}
            <TextField
              label="Search conversations"
              placeholder="Name or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leadingIcon={<Search size={16} />}
            />

            {/* Quick banner if pending requests exist */}
            {pendingCount > 0 && (
              <div
                onClick={() => setActiveTab('inbox')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--md-sys-shape-corner-small)',
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Inbox size={15} />
                  <span>{pendingCount} collaboration {pendingCount === 1 ? 'request' : 'requests'} waiting</span>
                </div>
                <ChevronRight size={14} />
              </div>
            )}

            {filteredMatches.length === 0 ? (
              <Card variant="outlined" style={{ padding: 24, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                  No connections found.
                </p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredMatches.map((m) => {
                  const isSelected = m.id === selectedMatchId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMatchId(m.id);
                        if (window.innerWidth <= 840) {
                          setMobileChatOpen(true);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background-color 150ms ease',
                        backgroundColor: isSelected
                          ? 'var(--md-sys-color-secondary-container)'
                          : 'var(--md-sys-color-surface-container-low)',
                        color: isSelected
                          ? 'var(--md-sys-color-on-secondary-container)'
                          : 'var(--md-sys-color-on-surface)',
                      }}
                    >
                      <Avatar
                        name={m.collaborator.displayName}
                        tone={m.collaborator.avatarKey || 'sapphire'}
                        size="md"
                        online
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: 14, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {m.collaborator.displayName}
                          </strong>
                          <span style={{ fontSize: 11, opacity: 0.75 }}>
                            {m.lastMessageAt || ''}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.85, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: 2 }}>
                          {m.projectTitle}
                        </div>
                        <p style={{ margin: '3px 0 0 0', fontSize: 12, opacity: 0.65, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {m.lastMessage || 'Channel created.'}
                        </p>
                      </div>

                      {m.unreadCount > 0 && (
                        <Badge variant="standard" count={m.unreadCount} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Active Conversation Stream & Composer */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
              borderRadius: 'var(--md-sys-shape-corner-large)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              overflow: 'hidden',
            }}
            className={`connections-chat-col ${!mobileChatOpen ? 'mobile-hidden-chat' : ''}`}
          >
            {selectedMatch ? (
              <>
                {/* Chat Top Bar */}
                <div
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Back button on mobile */}
                    <button
                      type="button"
                      onClick={() => setMobileChatOpen(false)}
                      className="mobile-back-btn"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'none',
                      }}
                    >
                      <ArrowLeft size={18} />
                    </button>

                    <Avatar
                      name={selectedMatch.collaborator.displayName}
                      tone={selectedMatch.collaborator.avatarKey || 'sapphire'}
                      size="sm"
                      online
                    />
                    <div>
                      <strong style={{ fontSize: 15, color: 'var(--md-sys-color-on-surface)' }}>
                        {selectedMatch.collaborator.displayName}
                      </strong>
                      <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)', marginLeft: 8 }}>
                        {selectedMatch.projectTitle}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="tonal"
                    size="sm"
                    icon={<Info size={14} />}
                    onClick={() => setCollaboratorDossierOpen(true)}
                  >
                    Synergy Dossier
                  </Button>
                </div>

                {/* Match Synergy Kicker Strip */}
                <div
                  style={{
                    padding: '8px 20px',
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  <Sparkles size={14} color="var(--md-sys-color-primary)" />
                  <span>
                    <strong>Why you matched:</strong> {selectedMatch.fitDescription}
                  </span>
                </div>

                {/* Message Stream */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {/* Messages mock stream */}
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      maxWidth: '75%',
                      padding: '10px 14px',
                      borderRadius: '16px 16px 16px 4px',
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      Hey Purvaj! Great to connect. I saw your frontend work and would love to coordinate on the project architecture.
                    </p>
                    <span style={{ fontSize: 10, opacity: 0.6, display: 'block', marginTop: 4 }}>
                      Yesterday, 14:10
                    </span>
                  </div>

                  <div
                    style={{
                      alignSelf: 'flex-end',
                      maxWidth: '75%',
                      padding: '10px 14px',
                      borderRadius: '16px 16px 4px 16px',
                      backgroundColor: 'var(--md-sys-color-primary)',
                      color: 'var(--md-sys-color-on-primary)',
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      Hi {selectedMatch.collaborator.displayName.split(' ')[0]}! Excited to collaborate. I have set up our project tasks and calendar.
                    </p>
                    <span style={{ fontSize: 10, opacity: 0.8, display: 'block', marginTop: 4, textAlign: 'right' }}>
                      Yesterday, 14:25
                    </span>
                  </div>

                  {selectedMatch.lastMessage && (
                    <div
                      style={{
                        alignSelf: 'flex-start',
                        maxWidth: '75%',
                        padding: '10px 14px',
                        borderRadius: '16px 16px 16px 4px',
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        color: 'var(--md-sys-color-on-surface)',
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      <p style={{ margin: 0 }}>{selectedMatch.lastMessage}</p>
                      <span style={{ fontSize: 10, opacity: 0.6, display: 'block', marginTop: 4 }}>
                        {selectedMatch.lastMessageAt || 'Today'}
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <form
                  onSubmit={handleSend}
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface-container-low)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <textarea
                    rows={1}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${selectedMatch.collaborator.displayName.split(' ')[0]} (Enter to send)...`}
                    style={{
                      flex: 1,
                      minHeight: 40,
                      maxHeight: 100,
                      padding: '10px 14px',
                      borderRadius: 'var(--md-sys-shape-corner-large)',
                      border: '1px solid var(--md-sys-color-outline)',
                      backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontFamily: 'inherit',
                      fontSize: 14,
                      resize: 'none',
                      outline: 'none',
                    }}
                  />
                  <Button
                    type="submit"
                    variant="filled"
                    icon={<Send size={16} />}
                    disabled={!messageInput.trim() || busy}
                  >
                    Send
                  </Button>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24, textAlign: 'center' }}>
                <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 14 }}>
                  Select a connection thread to start messaging.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collaborator Synergy Dossier Dialog */}
      {selectedMatch && (
        <Dialog
          open={collaboratorDossierOpen}
          onClose={() => setCollaboratorDossierOpen(false)}
          headline={`${selectedMatch.collaborator.displayName}'s Synergy Dossier`}
          actions={
            <Button variant="filled" onClick={() => setCollaboratorDossierOpen(false)}>
              Done
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Avatar
                name={selectedMatch.collaborator.displayName}
                tone={selectedMatch.collaborator.avatarKey || 'sapphire'}
                size="md"
              />
              <div>
                <strong style={{ fontSize: 16 }}>{selectedMatch.collaborator.displayName}</strong>
                <div style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {selectedMatch.collaborator.department} · {selectedMatch.collaborator.yearOfStudy ? `Year ${selectedMatch.collaborator.yearOfStudy}` : ''}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--md-sys-shape-corner-small)',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
              }}
            >
              <strong style={{ fontSize: 13, color: 'var(--md-sys-color-primary)', display: 'block', marginBottom: 4 }}>
                Project &amp; Role Fit
              </strong>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                {selectedMatch.fitDescription}
              </p>
            </div>

            <div>
              <span style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Declared Competencies
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedMatch.collaborator.skills?.map((skill) => (
                  <span
                    key={skill.id || skill.name}
                    style={{
                      fontSize: 12,
                      padding: '3px 8px',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                      backgroundColor: 'var(--md-sys-color-secondary-container)',
                      color: 'var(--md-sys-color-on-secondary-container)',
                    }}
                  >
                    {skill.name} (Lvl {skill.proficiency})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
