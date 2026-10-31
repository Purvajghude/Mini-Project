import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CalendarPlus, Check, Plus, Send, Trash2, Vote, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useMe } from '../lib/auth';
import { useLoad } from '../lib/hooks';
import { dateTime, relative, timeOnly } from '../lib/format';
import type { AvailabilityPoll, Project, ProjectTask, TaskStatus } from '../lib/types';
import { Avatar, Button, ErrorNote, Field, Loading, useToast } from '../ui';

// ---------------- Tasks ----------------
const COLUMNS: [TaskStatus, string][] = [['TODO', 'To do'], ['IN_PROGRESS', 'In progress'], ['DONE', 'Done']];

export function Tasks({ project }: { project: Project }) {
  const toast = useToast();
  const tasks = useLoad(() => api.tasks(project.id), [project.id]);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [due, setDue] = useState('');
  const [adding, setAdding] = useState(false);
  const member = (id: string | null) => project.members.find((m) => m.userId === id);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      const t = await api.createTask(project.id, { title: title.trim(), assigneeUserId: assignee || null, dueDate: due || null });
      tasks.setData((prev) => [...(prev ?? []), t]);
      setTitle('');
    } catch (err) { toast((err as ApiError).message, 'error'); } finally { setAdding(false); }
  }

  async function update(t: ProjectTask, patch: Partial<ProjectTask>) {
    const next = { ...t, ...patch };
    tasks.setData((prev) => (prev ?? []).map((x) => (x.id === t.id ? next : x)));
    try {
      const saved = await api.updateTask(project.id, t.id, { title: next.title, description: next.description, status: next.status, assigneeUserId: next.assigneeUserId, dueDate: next.dueDate });
      tasks.setData((prev) => (prev ?? []).map((x) => (x.id === t.id ? saved : x)));
    } catch (err) {
      tasks.setData((prev) => (prev ?? []).map((x) => (x.id === t.id ? t : x)));
      toast((err as ApiError).message, 'error');
    }
  }

  async function remove(t: ProjectTask) {
    tasks.setData((prev) => (prev ?? []).filter((x) => x.id !== t.id));
    try { await api.deleteTask(project.id, t.id); } catch (err) { tasks.setData((prev) => [...(prev ?? []), t]); toast((err as ApiError).message, 'error'); }
  }

  return (
    <div className="stack" style={{ '--gap': '20px' } as React.CSSProperties}>
      <form className="task-add sheet" onSubmit={add}>
        <input className="task-add-title" placeholder="Add a task…" aria-label="Task title" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
        <select className="input" aria-label="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">Unassigned</option>
          {project.members.map((m) => <option key={m.userId} value={m.userId}>{m.displayName}</option>)}
        </select>
        <input className="input" type="date" aria-label="Due date" value={due} onChange={(e) => setDue(e.target.value)} />
        <Button type="submit" loading={adding} disabled={!title.trim()}><Plus />Add</Button>
      </form>
      <ErrorNote error={tasks.error} retry={tasks.reload} />
      {!tasks.data && tasks.loading ? <Loading /> : (
        <div className="kanban">
          {COLUMNS.map(([status, label], ci) => {
            const items = (tasks.data ?? []).filter((t) => t.status === status);
            return (
              <section key={status} className="kanban-col" aria-label={label}>
                <h2 className="meta">{label} · {items.length}</h2>
                {items.length === 0 && <p className="small muted kanban-empty">Nothing here.</p>}
                <ul>
                  {items.map((t) => {
                    const who = member(t.assigneeUserId);
                    return (
                      <li key={t.id} className={`task sheet ${status === 'DONE' ? 'done' : ''}`}>
                        <span className="task-title">{t.title}</span>
                        <div className="row spread" style={{ '--gap': '6px' } as React.CSSProperties}>
                          <span className="row small muted" style={{ '--gap': '6px' } as React.CSSProperties}>
                            {who && <Avatar id={who.userId} name={who.displayName} size={20} />}
                            {t.dueDate && <span className="mono">{new Date(t.dueDate + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                          </span>
                          <span className="task-actions">
                            {ci > 0 && <button className="btn btn-ghost btn-sm btn-icon" aria-label={`Move “${t.title}” to ${COLUMNS[ci - 1][1]}`} onClick={() => update(t, { status: COLUMNS[ci - 1][0] })}><ArrowLeft /></button>}
                            {ci < 2 && <button className="btn btn-ghost btn-sm btn-icon" aria-label={`Move “${t.title}” to ${COLUMNS[ci + 1][1]}`} onClick={() => update(t, { status: COLUMNS[ci + 1][0] })}>{ci === 1 ? <Check /> : <ArrowRight />}</button>}
                            <button className="btn btn-ghost btn-sm btn-icon" aria-label={`Delete “${t.title}”`} onClick={() => remove(t)}><Trash2 /></button>
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------- Schedule ----------------
const toIso = (date: string, time: string) => new Date(`${date}T${time}`).toISOString();
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export function Schedule({ project }: { project: Project }) {
  const me = useMe();
  const toast = useToast();
  const data = useLoad(async () => ({ events: await api.events(project.id), polls: await api.polls(project.id) }), [project.id]);
  const [mode, setMode] = useState<'none' | 'event' | 'poll'>('none');
  const isOwner = project.ownerUserId === me.id;

  const upcoming = (data.data?.events ?? []).filter((e) => Date.parse(e.endsAt) > Date.now() - 864e5).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const polls = (data.data?.polls ?? []).filter((p) => p.status !== 'SCHEDULED' || Date.now() - Date.parse(p.createdAt) < 7 * 864e5);

  async function vote(poll: AvailabilityPoll, optionId: string, on: boolean) {
    try { await api.vote(project.id, poll.id, optionId, on); await data.reload(); } catch (e) { toast((e as ApiError).message, 'error'); }
  }
  async function finalise(poll: AvailabilityPoll) {
    const best = [...poll.options].sort((a, b) => b.voteCount - a.voteCount || a.startsAt.localeCompare(b.startsAt))[0];
    try {
      if (poll.status === 'OPEN') await api.closePoll(project.id, poll.id, best.id);
      await api.schedulePoll(project.id, poll.id);
      toast('Meeting added to the schedule');
      await data.reload();
    } catch (e) { toast((e as ApiError).message, 'error'); }
  }

  return (
    <div className="schedule">
      <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
        <Button variant={mode === 'event' ? 'primary' : 'outline'} onClick={() => setMode(mode === 'event' ? 'none' : 'event')}><CalendarPlus />Schedule a meeting</Button>
        <Button variant={mode === 'poll' ? 'primary' : 'outline'} onClick={() => setMode(mode === 'poll' ? 'none' : 'poll')}><Vote />Find a time</Button>
      </div>
      {mode === 'event' && <EventForm project={project} onDone={() => { setMode('none'); void data.reload(); }} />}
      {mode === 'poll' && <PollForm project={project} onDone={() => { setMode('none'); void data.reload(); }} />}
      <ErrorNote error={data.error} retry={data.reload} />
      {!data.data && data.loading && <Loading />}
      {data.data && (
        <div className="schedule-cols">
          <section className="stack">
            <h2 className="meta">Meetings</h2>
            {upcoming.length === 0 && <p className="small muted">No meetings scheduled.</p>}
            <ol className="timeline">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <time className="timeline-date" dateTime={e.startsAt}>
                    <span className="meta">{new Date(e.startsAt).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                    <span className="title" style={{ fontSize: 28 }}>{new Date(e.startsAt).getDate()}</span>
                  </time>
                  <div><b>{e.title}</b><br /><span className="small muted">{timeOnly(e.startsAt)} – {timeOnly(e.endsAt)}</span>{e.description && <p className="small">{e.description}</p>}</div>
                </li>
              ))}
            </ol>
          </section>
          <section className="stack">
            <h2 className="meta">Time polls</h2>
            {polls.length === 0 && <p className="small muted">No polls. Use “Find a time” to let the team vote.</p>}
            {polls.map((poll) => (
              <article key={poll.id} className="poll sheet panel">
                <div className="row spread"><b>{poll.title}</b><span className="tag">{poll.status === 'OPEN' ? 'Voting' : poll.status === 'CLOSED' ? 'Closed' : 'Scheduled'}</span></div>
                <ul className="poll-options">
                  {poll.options.map((o) => (
                    <li key={o.id} className={poll.selectedOptionId === o.id ? 'selected' : ''}>
                      <button disabled={poll.status !== 'OPEN'} aria-pressed={o.votedByMe} onClick={() => vote(poll, o.id, !o.votedByMe)}>
                        <span className="poll-bar" style={{ width: `${(o.voteCount / project.members.length) * 100}%` }} />
                        <span className="poll-label">{dateTime(o.startsAt)} – {timeOnly(o.endsAt)}</span>
                        <span className="mono">{o.voteCount}/{project.members.length}{o.votedByMe ? ' · you' : ''}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {isOwner && poll.status !== 'SCHEDULED' && <Button size="sm" variant="outline" onClick={() => finalise(poll)}>Schedule the most popular time</Button>}
              </article>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}

function EventForm({ project, onDone }: { project: Project; onDone(): void }) {
  const [f, setF] = useState({ title: '', date: today(), start: '17:00', end: '18:00', description: '' });
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return setError(new ApiError('Give the meeting a title.', 400));
    if (f.end <= f.start) return setError(new ApiError('The meeting must end after it starts.', 400));
    setPending(true);
    setError(null);
    try { await api.createEvent(project.id, { title: f.title.trim(), description: f.description.trim() || null, startsAt: toIso(f.date, f.start), endsAt: toIso(f.date, f.end) }); onDone(); }
    catch (err) { setError(err as ApiError); } finally { setPending(false); }
  }
  return (
    <form className="sheet panel form-grid" onSubmit={submit}>
      <Field label="Title">{(id) => <input id={id} className="input" value={f.title} maxLength={160} autoFocus onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
      <Field label="Date">{(id) => <input id={id} className="input" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />}</Field>
      <Field label="From">{(id) => <input id={id} className="input" type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />}</Field>
      <Field label="To">{(id) => <input id={id} className="input" type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />}</Field>
      <div className="form-wide"><ErrorNote error={error} /></div>
      <div className="form-wide row" style={{ justifyContent: 'flex-end' }}><Button variant="ghost" onClick={onDone}>Cancel</Button><Button type="submit" loading={pending}>Add meeting</Button></div>
    </form>
  );
}

function PollForm({ project, onDone }: { project: Project; onDone(): void }) {
  const [title, setTitle] = useState('');
  const [opts, setOpts] = useState([{ date: today(), start: '17:00', end: '18:00' }, { date: today(), start: '19:00', end: '20:00' }]);
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError(new ApiError('Say what the poll is for.', 400));
    if (opts.some((o) => o.end <= o.start)) return setError(new ApiError('Each option must end after it starts.', 400));
    setPending(true);
    setError(null);
    try { await api.createPoll(project.id, { title: title.trim(), options: opts.map((o) => ({ startsAt: toIso(o.date, o.start), endsAt: toIso(o.date, o.end) })) }); onDone(); }
    catch (err) { setError(err as ApiError); } finally { setPending(false); }
  }
  return (
    <form className="sheet panel stack" onSubmit={submit}>
      <Field label="What’s it for?">{(id) => <input id={id} className="input" value={title} maxLength={160} placeholder="Weekly sync" autoFocus onChange={(e) => setTitle(e.target.value)} />}</Field>
      <span className="label">Options · 2 to 8</span>
      {opts.map((o, i) => (
        <div key={i} className="row poll-opt" style={{ '--gap': '8px' } as React.CSSProperties}>
          <input className="input" type="date" aria-label={`Option ${i + 1} date`} value={o.date} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} />
          <input className="input" type="time" aria-label={`Option ${i + 1} start`} value={o.start} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} />
          <input className="input" type="time" aria-label={`Option ${i + 1} end`} value={o.end} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} />
          <Button variant="ghost" icon size="sm" aria-label={`Remove option ${i + 1}`} disabled={opts.length <= 2} onClick={() => setOpts(opts.filter((_, j) => j !== i))}><X /></Button>
        </div>
      ))}
      <div><Button variant="ghost" size="sm" disabled={opts.length >= 8} onClick={() => setOpts([...opts, { ...opts[opts.length - 1] }])}><Plus />Add option</Button></div>
      <ErrorNote error={error} />
      <div className="row" style={{ justifyContent: 'flex-end' }}><Button variant="ghost" onClick={onDone}>Cancel</Button><Button type="submit" loading={pending}>Start poll</Button></div>
    </form>
  );
}

// ---------------- Messages ----------------
export function Messages({ project }: { project: Project }) {
  const me = useMe();
  const toast = useToast();
  const msgs = useLoad(() => api.messages(project.id), [project.id]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  // ponytail: polls every 4s; the backend has no push channel for project messages yet.
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') api.messages(project.id).then(msgs.setData).catch(() => {}); }, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.data?.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSending(true);
    try { const m = await api.sendMessage(project.id, content); msgs.setData((prev) => [...(prev ?? []), m]); setText(''); }
    catch (err) { toast((err as ApiError).message, 'error'); } finally { setSending(false); }
  }

  return (
    <div className="chat sheet">
      <div className="chat-log" aria-live="polite">
        <ErrorNote error={msgs.error} retry={msgs.reload} />
        {msgs.data?.length === 0 && <p className="muted small" style={{ textAlign: 'center', padding: 32 }}>No messages yet. Say hello to the team.</p>}
        {msgs.data?.map((m, i) => {
          const mine = m.senderId === me.id;
          const grouped = i > 0 && msgs.data![i - 1].senderId === m.senderId;
          return (
            <div key={m.id} className={`msg ${mine ? 'mine' : ''} ${grouped ? 'grouped' : ''}`}>
              {!grouped && !mine && <Avatar id={m.senderId} name={m.senderName} size={28} />}
              <div>
                {!grouped && <span className="small muted">{mine ? 'You' : m.senderName} · {relative(m.createdAt)}</span>}
                <p className="msg-body">{m.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form className="chat-compose" onSubmit={send}>
        <input className="input" placeholder={`Message ${project.name}`} aria-label="Message" value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" icon loading={sending} disabled={!text.trim()} aria-label="Send"><Send /></Button>
      </form>
    </div>
  );
}
