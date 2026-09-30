import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderGit2,
  Kanban,
  MessageCircle,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Users,
  Vote,
} from 'lucide-react';
import { Avatar, Badge, Button, Card, Chip, Dialog, Github, TextField, TextArea } from '../components/m3';
import {
  AvailabilityPoll,
  Profile,
  Project,
  ProjectEvent,
  ProjectTask,
} from '../types/api';

interface ProjectsViewProps {
  currentUser: Profile;
  projects: Project[];
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  onCreateTask: (projectId: string, task: Omit<ProjectTask, 'id'>) => Promise<void>;
  onUpdateTask: (projectId: string, taskId: string, updates: Partial<ProjectTask>) => Promise<void>;
  onCreateEvent: (projectId: string, event: Omit<ProjectEvent, 'id'>) => Promise<void>;
  onVotePoll: (projectId: string, pollId: string, slotId: string) => Promise<void>;
  onCreatePoll: (projectId: string, poll: Omit<AvailabilityPoll, 'id' | 'voterCount'>) => Promise<void>;
  onOpenDiscordRoom: (projectId: string) => Promise<void>;
  onToast: (msg: string) => void;
  busy?: boolean;
}

const CATEGORIES = [
  'All',
  'Civic & Social Impact',
  'Campus Infrastructure',
  'AI & Robotics',
  'HealthTech',
];

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  currentUser,
  projects,
  onCreateProject,
  onCreateTask,
  onUpdateTask,
  onCreateEvent,
  onVotePoll,
  onCreatePoll,
  onOpenDiscordRoom,
  onToast,
  busy = false,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceTab, setWorkspaceTab] = useState<'tasks' | 'calendar' | 'polls'>('tasks');

  // Modal dialog states
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [isNewPollOpen, setIsNewPollOpen] = useState(false);

  // New Project Form
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState(CATEGORIES[1]);
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectTags, setNewProjectTags] = useState('');
  const [newProjectRoleTitle, setNewProjectRoleTitle] = useState('');
  const [newProjectRoleSkills, setNewProjectRoleSkills] = useState('');

  // New Task Form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskTags, setNewTaskTags] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');

  // New Event Form
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventType, setNewEventType] = useState<'DEADLINE' | 'MILESTONE' | 'MEETING' | 'SPRINT'>('MEETING');
  const [newEventStartDate, setNewEventStartDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');

  // New Poll Form
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollDescription, setNewPollDescription] = useState('');

  const currentProject = projects.find((p) => p.id === selectedProjectId) || null;

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    if (activeCategory !== 'All' && p.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = p.title.toLowerCase().includes(q);
      const descMatch = p.description.toLowerCase().includes(q);
      const tagMatch = p.tags.some((t) => t.toLowerCase().includes(q));
      const roleMatch = p.openRoles.some((r) =>
        r.title.toLowerCase().includes(q) || r.skillsNeeded.some((s) => s.toLowerCase().includes(q))
      );
      return titleMatch || descMatch || tagMatch || roleMatch;
    }
    return true;
  });

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    await onCreateProject({
      title: newProjectTitle.trim(),
      slug: newProjectTitle.trim().toLowerCase().replace(/\s+/g, '-'),
      category: newProjectCategory,
      description: newProjectDescription.trim(),
      status: 'ACTIVE',
      lead: {
        id: currentUser.id,
        displayName: currentUser.displayName,
        username: currentUser.username,
      },
      members: [
        {
          id: currentUser.id,
          displayName: currentUser.displayName,
          username: currentUser.username,
          role: 'Project Founder',
          avatarKey: currentUser.avatarKey,
        },
      ],
      openRoles: newProjectRoleTitle.trim()
        ? [
            {
              title: newProjectRoleTitle.trim(),
              skillsNeeded: newProjectRoleSkills
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
              capacity: 1,
            },
          ]
        : [],
      tags: newProjectTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      tasks: [],
      events: [],
      availabilityPolls: [],
    });

    setIsNewProjectOpen(false);
    setNewProjectTitle('');
    setNewProjectDescription('');
    setNewProjectTags('');
    setNewProjectRoleTitle('');
    setNewProjectRoleSkills('');
    onToast('Project created and published to campus explorer!');
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newTaskTitle.trim()) return;

    const assignee = currentProject.members.find((m) => m.id === newTaskAssigneeId);

    await onCreateTask(currentProject.id, {
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      status: 'TODO',
      priority: newTaskPriority,
      assignee: assignee
        ? {
            id: assignee.id,
            displayName: assignee.displayName,
            avatarKey: assignee.avatarKey,
          }
        : undefined,
      dueDate: newTaskDueDate || undefined,
      tags: newTaskTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setIsNewTaskOpen(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDueDate('');
    setNewTaskTags('');
    onToast('Task added to Kanban backlog.');
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newEventTitle.trim()) return;

    await onCreateEvent(currentProject.id, {
      title: newEventTitle.trim(),
      description: newEventDescription.trim(),
      type: newEventType,
      startDate: newEventStartDate || new Date().toISOString(),
      endDate: newEventStartDate || new Date().toISOString(),
      location: newEventLocation.trim() || undefined,
    });

    setIsNewEventOpen(false);
    setNewEventTitle('');
    setNewEventDescription('');
    setNewEventLocation('');
    onToast('Milestone / Event added to project calendar.');
  };

  const handleCreatePollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newPollTitle.trim()) return;

    await onCreatePoll(currentProject.id, {
      title: newPollTitle.trim(),
      description: newPollDescription.trim(),
      status: 'OPEN',
      slots: [
        { id: `slot-${Date.now()}-1`, day: 'Monday', timeRange: '16:00 - 17:00', votes: [] },
        { id: `slot-${Date.now()}-2`, day: 'Wednesday', timeRange: '17:00 - 18:00', votes: [] },
        { id: `slot-${Date.now()}-3`, day: 'Thursday', timeRange: '15:00 - 16:00', votes: [] },
        { id: `slot-${Date.now()}-4`, day: 'Friday', timeRange: '14:00 - 15:00', votes: [] },
      ],
    });

    setIsNewPollOpen(false);
    setNewPollTitle('');
    setNewPollDescription('');
    onToast('Availability poll opened for team voting.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      {!currentProject ? (
        /* EXPLORER HEADER */
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--md-sys-color-primary)',
                }}
              >
                Campus Project Directory
              </span>
              <Badge variant="synergy">{projects.length} Active Initiatives</Badge>
            </div>
            <h1 style={{ margin: '4px 0 0 0', fontSize: 24, fontWeight: 750, color: 'var(--md-sys-color-on-surface)' }}>
              Project Explorer &amp; Teams
            </h1>
          </div>

          <Button
            variant="filled"
            icon={<Plus size={16} />}
            onClick={() => setIsNewProjectOpen(true)}
          >
            Create New Project
          </Button>
        </div>
      ) : (
        /* WORKSPACE HEADER & BREADCRUMB */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingBottom: 16,
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setSelectedProjectId(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--md-sys-color-primary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 0',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Project Explorer</span>
            </button>
            <span style={{ color: 'var(--md-sys-color-outline-variant)' }}>/</span>
            <span style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
              {currentProject.title}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 750, color: 'var(--md-sys-color-on-surface)' }}>
                  {currentProject.title}
                </h1>
                <Badge variant="synergy">{currentProject.status}</Badge>
                <span
                  style={{
                    fontSize: 12,
                    padding: '3px 10px',
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  {currentProject.category}
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: 14, color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 700 }}>
                {currentProject.description}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button variant="tonal" size="sm" icon={<MessageCircle size={15} />} onClick={() => onOpenDiscordRoom(currentProject.id)}>
                Open team room
              </Button>
              {currentProject.githubRepoUrl && (
                <a
                  href={currentProject.githubRepoUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    color: 'var(--md-sys-color-on-surface)',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <Github size={15} />
                  <span>Repository</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          {/* Members Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
              Team ({currentProject.members.length}):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {currentProject.members.map((member) => (
                <div
                  key={member.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    backgroundColor: 'var(--md-sys-color-secondary-container)',
                    color: 'var(--md-sys-color-on-secondary-container)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <Avatar name={member.displayName} tone={member.avatarKey || 'sapphire'} size="xs" />
                  <span>{member.displayName}</span>
                  <span style={{ opacity: 0.75, fontWeight: 400 }}>({member.role})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Workspace Sub-tabs */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Chip
              selected={workspaceTab === 'tasks'}
              onClick={() => setWorkspaceTab('tasks')}
              icon={<Kanban size={14} />}
            >
              Tasks Kanban ({currentProject.tasks.length})
            </Chip>
            <Chip
              selected={workspaceTab === 'calendar'}
              onClick={() => setWorkspaceTab('calendar')}
              icon={<Calendar size={14} />}
            >
              Schedule &amp; Milestones ({currentProject.events.length})
            </Chip>
            <Chip
              selected={workspaceTab === 'polls'}
              onClick={() => setWorkspaceTab('polls')}
              icon={<Vote size={14} />}
            >
              Availability Poll ({currentProject.availabilityPolls.length})
            </Chip>
          </div>
        </div>
      )}

      {/* VIEW BODY */}
      {!currentProject ? (
        /* EXPLORER LISTING */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Category Chips and Search */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  selected={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Chip>
              ))}
            </div>

            <div style={{ minWidth: 260 }}>
              <TextField
                label="Search projects"
                placeholder="Title, skill, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leadingIcon={<Search size={16} />}
              />
            </div>
          </div>

          {/* Projects Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 20,
            }}
          >
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                variant="elevated"
                interactive
                onClick={() => setSelectedProjectId(project.id)}
                style={{
                  padding: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  cursor: 'pointer',
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--md-sys-color-primary)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {project.category}
                    </span>
                    <h2 style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 750, color: 'var(--md-sys-color-on-surface)' }}>
                      {project.title}
                    </h2>
                  </div>
                  <Badge variant="synergy">{project.status}</Badge>
                </div>

                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--md-sys-color-on-surface-variant)', flex: 1 }}>
                  {project.description}
                </p>

                {/* Open Roles */}
                {project.openRoles.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--md-sys-color-outline)' }}>
                      Seeking:
                    </span>
                    {project.openRoles.map((role) => (
                      <span
                        key={role.title}
                        title={`Skills needed: ${role.skillsNeeded.join(', ')}`}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 'var(--md-sys-shape-corner-small)',
                          backgroundColor: 'var(--md-sys-color-surface-container-high)',
                          color: 'var(--md-sys-color-primary)',
                          border: '1px solid var(--md-sys-color-outline-variant)',
                        }}
                      >
                        {role.title}
                      </span>
                    ))}
                  </div>
                )}

                {/* Team members & Action */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--md-sys-color-outline-variant)',
                    paddingTop: 12,
                    marginTop: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', marginLeft: 4 }}>
                      {project.members.map((m) => (
                        <span key={m.id} style={{ marginLeft: -6, display: 'inline-block' }}>
                          <Avatar name={m.displayName} tone={m.avatarKey || 'sapphire'} size="xs" />
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)', marginLeft: 4 }}>
                      {project.members.length} {project.members.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  <Button
                    variant="tonal"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProjectId(project.id);
                    }}
                  >
                    Open Workspace
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* WORKSPACE DETAIL VIEWS */
        <div>
          {workspaceTab === 'tasks' && (
            /* KANBAN BOARD */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Sprint Task Board</h2>
                </div>
                <Button
                  variant="filled"
                  size="sm"
                  icon={<Plus size={15} />}
                  onClick={() => setIsNewTaskOpen(true)}
                >
                  Add Task
                </Button>
              </div>

              {/* 4-column Kanban Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
                {(
                  [
                    { id: 'TODO', label: 'To Do', color: 'var(--md-sys-color-surface-container)' },
                    { id: 'IN_PROGRESS', label: 'In Progress', color: 'var(--md-sys-color-secondary-container)' },
                    { id: 'IN_REVIEW', label: 'In Review', color: '#FFF8E1' },
                    { id: 'DONE', label: 'Done', color: 'var(--md-custom-color-synergy-container)' },
                  ] as const
                ).map((col) => {
                  const tasksInCol = currentProject.tasks.filter((t) => t.status === col.id);

                  return (
                    <div
                      key={col.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        backgroundColor: 'var(--md-sys-color-surface-container-low)',
                        padding: 14,
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        minHeight: 380,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <strong style={{ fontSize: 14 }}>{col.label}</strong>
                        <Badge variant="standard">{tasksInCol.length}</Badge>
                      </div>

                      {tasksInCol.map((task) => (
                        <Card
                          key={task.id}
                          variant="elevated"
                          style={{
                            padding: 14,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            backgroundColor: 'var(--md-sys-color-surface)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 'var(--md-sys-shape-corner-full)',
                                backgroundColor:
                                  task.priority === 'HIGH'
                                    ? 'var(--md-sys-color-error-container)'
                                    : task.priority === 'MEDIUM'
                                    ? 'var(--md-custom-color-warning-container)'
                                    : 'var(--md-sys-color-surface-container-high)',
                                color:
                                  task.priority === 'HIGH'
                                    ? 'var(--md-sys-color-on-error-container)'
                                    : 'var(--md-sys-color-on-surface)',
                              }}
                            >
                              {task.priority} Priority
                            </span>

                            {/* Status Change Selector */}
                            <select
                              value={task.status}
                              onChange={(e) =>
                                onUpdateTask(currentProject.id, task.id, {
                                  status: e.target.value as any,
                                })
                              }
                              style={{
                                fontSize: 11,
                                padding: '2px 4px',
                                borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                                border: '1px solid var(--md-sys-color-outline-variant)',
                                backgroundColor: 'transparent',
                                color: 'var(--md-sys-color-on-surface-variant)',
                              }}
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="IN_REVIEW">In Review</option>
                              <option value="DONE">Done</option>
                            </select>
                          </div>

                          <strong style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface)' }}>
                            {task.title}
                          </strong>

                          {task.description && (
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.4 }}>
                              {task.description}
                            </p>
                          )}

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: 11,
                              color: 'var(--md-sys-color-outline)',
                              marginTop: 4,
                            }}
                          >
                            {task.assignee ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Avatar name={task.assignee.displayName} tone={task.assignee.avatarKey || 'sapphire'} size="xs" />
                                <span>{task.assignee.displayName.split(' ')[0]}</span>
                              </div>
                            ) : (
                              <span>Unassigned</span>
                            )}

                            {task.dueDate && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <Clock size={11} /> {task.dueDate}
                              </span>
                            )}
                          </div>
                        </Card>
                      ))}

                      {tasksInCol.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--md-sys-color-outline)', fontSize: 12 }}>
                          No tasks in {col.label.toLowerCase()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {workspaceTab === 'calendar' && (
            /* CALENDAR & MILESTONES */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Project Schedule &amp; Deadlines</h2>
                </div>
                <Button
                  variant="filled"
                  size="sm"
                  icon={<Plus size={15} />}
                  onClick={() => setIsNewEventOpen(true)}
                >
                  Add Milestone / Event
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {currentProject.events.length === 0 ? (
                  <Card variant="outlined" style={{ padding: 32, textAlign: 'center' }}>
                    <Calendar size={32} color="var(--md-sys-color-primary)" style={{ marginBottom: 8 }} />
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                      No milestones registered. Add deadlines or review meetings to align the team.
                    </p>
                  </Card>
                ) : (
                  currentProject.events.map((ev) => (
                    <Card
                      key={ev.id}
                      variant="elevated"
                      style={{
                        padding: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        backgroundColor: 'var(--md-sys-color-surface-container-low)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            backgroundColor:
                              ev.type === 'DEADLINE'
                                ? 'var(--md-sys-color-error-container)'
                                : ev.type === 'MILESTONE'
                                ? 'var(--md-sys-color-tertiary-container)'
                                : 'var(--md-sys-color-primary-container)',
                            color:
                              ev.type === 'DEADLINE'
                                ? 'var(--md-sys-color-on-error-container)'
                                : 'var(--md-sys-color-on-primary-container)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 16,
                          }}
                        >
                          <Calendar size={20} />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: 15 }}>{ev.title}</strong>
                            <Badge variant={ev.type === 'DEADLINE' ? 'warning' : 'synergy'}>
                              {ev.type}
                            </Badge>
                          </div>
                          {ev.description && (
                            <p style={{ margin: '2px 0 0 0', fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {ev.description}
                            </p>
                          )}
                          {ev.location && (
                            <span style={{ fontSize: 12, color: 'var(--md-sys-color-outline)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <MapPin size={12} /> {ev.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>
                          {new Date(ev.startDate).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--md-sys-color-outline)' }}>
                          {new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {workspaceTab === 'polls' && (
            /* AVAILABILITY POLLS (MEETING SCHEDULER) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Team Availability Poll</h2>
                </div>
                <Button
                  variant="filled"
                  size="sm"
                  icon={<Plus size={15} />}
                  onClick={() => setIsNewPollOpen(true)}
                >
                  Create New Poll
                </Button>
              </div>

              {currentProject.availabilityPolls.length === 0 ? (
                <Card variant="outlined" style={{ padding: 32, textAlign: 'center' }}>
                  <Vote size={32} color="var(--md-sys-color-primary)" style={{ marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                    No active polls. Create a poll to schedule weekly syncs.
                  </p>
                </Card>
              ) : (
                currentProject.availabilityPolls.map((poll) => {
                  const maxVotes = Math.max(...poll.slots.map((s) => s.votes.length), 1);

                  return (
                    <Card
                      key={poll.id}
                      variant="elevated"
                      style={{
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        backgroundColor: 'var(--md-sys-color-surface-container-low)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: 16 }}>{poll.title}</strong>
                          <p style={{ margin: '2px 0 0 0', fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {poll.description}
                          </p>
                        </div>
                        <Badge variant="synergy">{poll.voterCount} team votes recorded</Badge>
                      </div>

                      {/* Slots Matrix */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {poll.slots.map((slot) => {
                          const hasVoted = slot.votes.includes(currentUser.id);
                          const isTopConsensus = slot.votes.length === maxVotes && slot.votes.length > 0;

                          return (
                            <div
                              key={slot.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                borderRadius: 'var(--md-sys-shape-corner-medium)',
                                backgroundColor: isTopConsensus
                                  ? 'var(--md-custom-color-synergy-container)'
                                  : 'var(--md-sys-color-surface)',
                                border: `1px solid ${
                                  hasVoted
                                    ? 'var(--md-sys-color-primary)'
                                    : 'var(--md-sys-color-outline-variant)'
                                }`,
                                transition: 'all 150ms ease',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ minWidth: 120 }}>
                                  <strong style={{ fontSize: 14, display: 'block' }}>{slot.day}</strong>
                                  <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
                                    {slot.timeRange}
                                  </span>
                                </div>

                                {isTopConsensus && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 750,
                                      padding: '2px 8px',
                                      borderRadius: 'var(--md-sys-shape-corner-full)',
                                      backgroundColor: 'var(--md-custom-color-synergy)',
                                      color: '#ffffff',
                                    }}
                                  >
                                    ★ Top Consensus
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ display: 'flex', marginLeft: 4 }}>
                                    {slot.votes.map((voterId) => {
                                      const member = currentProject.members.find((m) => m.id === voterId);
                                      return (
                                        <span key={voterId} style={{ marginLeft: -6 }}>
                                          <Avatar
                                            name={member?.displayName || 'Teammate'}
                                            tone={member?.avatarKey || 'sapphire'}
                                            size="xs"
                                          />
                                        </span>
                                      );
                                    })}
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 700, minWidth: 50 }}>
                                    {slot.votes.length} {slot.votes.length === 1 ? 'vote' : 'votes'}
                                  </span>
                                </div>

                                <Button
                                  variant={hasVoted ? 'filled' : 'outlined'}
                                  size="sm"
                                  icon={hasVoted ? <Check size={14} /> : undefined}
                                  disabled={busy}
                                  onClick={() => onVotePoll(currentProject.id, poll.id, slot.id)}
                                >
                                  {hasVoted ? 'Available' : 'Vote Free'}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATE NEW PROJECT DIALOG */}
      <Dialog
        open={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        headline="Create Project Workspace"
        actions={
          <>
            <Button variant="text" onClick={() => setIsNewProjectOpen(false)}>
              Cancel
            </Button>
            <Button variant="filled" disabled={!newProjectTitle.trim() || busy} onClick={handleCreateProjectSubmit}>
              Create Workspace
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TextField
            label="Project Title"
            placeholder="e.g. Campus Navigation, Peer Tutor Network..."
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
              Project Category
            </label>
            <select
              value={newProjectCategory}
              onChange={(e) => setNewProjectCategory(e.target.value)}
              style={{
                height: 48,
                borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                border: '1px solid var(--md-sys-color-outline)',
                padding: '0 12px',
                backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                fontSize: 14,
              }}
            >
              {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <TextArea
            label="Project Description &amp; Problem Statement"
            placeholder="What does your project solve, and what stack are you building with?"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            rows={3}
            maxLength={400}
            required
          />

          <TextField
            label="Technology Tags"
            placeholder="React, Python, Docker, PostGIS..."
            value={newProjectTags}
            onChange={(e) => setNewProjectTags(e.target.value)}
          />

          <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 12 }}>
            <strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              Open Role You Need (Optional)
            </strong>
            <div style={{ display: 'flex', gap: 12 }}>
              <TextField
                label="Role Title"
                placeholder="e.g. Backend Lead"
                value={newProjectRoleTitle}
                onChange={(e) => setNewProjectRoleTitle(e.target.value)}
                style={{ flex: 1 }}
              />
              <TextField
                label="Skills Needed"
                placeholder="Java, PostgreSQL"
                value={newProjectRoleSkills}
                onChange={(e) => setNewProjectRoleSkills(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </form>
      </Dialog>

      {/* CREATE NEW TASK DIALOG */}
      <Dialog
        open={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        headline="Add Task to Kanban"
        actions={
          <>
            <Button variant="text" onClick={() => setIsNewTaskOpen(false)}>
              Cancel
            </Button>
            <Button variant="filled" disabled={!newTaskTitle.trim() || busy} onClick={handleCreateTaskSubmit}>
              Add Task
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TextField
            label="Task Title"
            placeholder="e.g. Build API routing algorithm"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            required
          />

          <TextArea
            label="Details &amp; Acceptance Criteria"
            placeholder="What needs to be implemented or tested?"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            rows={3}
          />

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Priority
              </label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                style={{
                  height: 48,
                  borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                  border: '1px solid var(--md-sys-color-outline)',
                  padding: '0 12px',
                  backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                  fontSize: 14,
                }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <TextField
              label="Due Date"
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>

          {currentProject && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Assignee
              </label>
              <select
                value={newTaskAssigneeId}
                onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                style={{
                  height: 48,
                  borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                  border: '1px solid var(--md-sys-color-outline)',
                  padding: '0 12px',
                  backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                  fontSize: 14,
                }}
              >
                <option value="">Unassigned</option>
                {currentProject.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>
      </Dialog>

      {/* CREATE NEW EVENT / MILESTONE DIALOG */}
      <Dialog
        open={isNewEventOpen}
        onClose={() => setIsNewEventOpen(false)}
        headline="Add Schedule Milestone or Meeting"
        actions={
          <>
            <Button variant="text" onClick={() => setIsNewEventOpen(false)}>
              Cancel
            </Button>
            <Button variant="filled" disabled={!newEventTitle.trim() || busy} onClick={handleCreateEventSubmit}>
              Schedule Event
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateEventSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TextField
            label="Milestone / Meeting Title"
            placeholder="e.g. Beta Prototype Demo, Sprint Planning..."
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            required
          />

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Event Type
              </label>
              <select
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value as any)}
                style={{
                  height: 48,
                  borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                  border: '1px solid var(--md-sys-color-outline)',
                  padding: '0 12px',
                  backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                  fontSize: 14,
                }}
              >
                <option value="MEETING">Team Meeting</option>
                <option value="MILESTONE">Milestone Deliverable</option>
                <option value="DEADLINE">Hard Deadline</option>
                <option value="SPRINT">Sprint Check-in</option>
              </select>
            </div>

            <TextField
              label="Date &amp; Time"
              type="datetime-local"
              value={newEventStartDate}
              onChange={(e) => setNewEventStartDate(e.target.value)}
              style={{ flex: 1 }}
              required
            />
          </div>

          <TextField
            label="Location or Meet Link"
            placeholder="e.g. Lab 204 or https://meet.google.com/..."
            value={newEventLocation}
            onChange={(e) => setNewEventLocation(e.target.value)}
          />

          <TextArea
            label="Notes &amp; Agenda"
            placeholder="What will be reviewed during this session?"
            value={newEventDescription}
            onChange={(e) => setNewEventDescription(e.target.value)}
            rows={2}
          />
        </form>
      </Dialog>

      {/* CREATE AVAILABILITY POLL DIALOG */}
      <Dialog
        open={isNewPollOpen}
        onClose={() => setIsNewPollOpen(false)}
        headline="Create Availability Poll"
        actions={
          <>
            <Button variant="text" onClick={() => setIsNewPollOpen(false)}>
              Cancel
            </Button>
            <Button variant="filled" disabled={!newPollTitle.trim() || busy} onClick={handleCreatePollSubmit}>
              Launch Poll
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePollSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TextField
            label="Poll Title"
            placeholder="e.g. Sprint 2 Review Sync Time"
            value={newPollTitle}
            onChange={(e) => setNewPollTitle(e.target.value)}
            required
          />

          <TextArea
            label="Instructions"
            placeholder="Select all slots you can make next week."
            value={newPollDescription}
            onChange={(e) => setNewPollDescription(e.target.value)}
            rows={2}
          />

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              fontSize: 12,
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            Will generate standard recurring time slots across Monday to Friday afternoon windows. Members can vote immediately upon launch.
          </div>
        </form>
      </Dialog>
    </div>
  );
};
