import React from 'react';
import { Button, Card, MaterialSymbol, Avatar } from '../components/m3';
import { Profile, Project, Skill, BlueprintSuggestionRequest } from '../types/api';
import { ProjectIdeaInput } from '../components/project-creation';

export interface HomeWorkbenchViewProps {
  currentUser: Profile;
  projects: Project[];
  availableSkills: Skill[];
  onOpenProject: (projectId: string) => void;
  onStartBlueprint: (request: BlueprintSuggestionRequest) => void;
  onExploreProjects: () => void;
  onToast: (msg: string) => void;
}

export const HomeWorkbenchView: React.FC<HomeWorkbenchViewProps> = ({
  currentUser,
  projects,
  onOpenProject,
  onStartBlueprint,
  onExploreProjects,
  onToast,
}) => {
  const firstName = currentUser.displayName.trim().split(' ')[0] || 'Engineer';
  const myProjects = projects.filter(
    (p) => p.lead.id === currentUser.id || p.members.some((m) => m.id === currentUser.id)
  );

  // Real campus projects looking for collaborators (excluding ones user is lead of, or taking top 3)
  const recruitingProjects = projects.filter(
    (p) => p.status === 'ACTIVE' || p.openRoles.length > 0
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        maxWidth: 1240,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* 1. Personal Editorial Header */}
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          paddingBottom: 20,
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            fontWeight: 750,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--md-sys-color-primary)',
          }}
        >
          <span>Studio Workspace</span>
          <span style={{ color: 'var(--md-sys-color-outline-variant)' }}>&bull;</span>
          <span>{currentUser.department || 'Engineering Faculty'}</span>
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(26px, 4vw, 34px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--md-sys-color-on-surface)',
            lineHeight: 1.15,
          }}
        >
          Good day, {firstName}.
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: 'clamp(14px, 1.8vw, 16px)',
            color: 'var(--md-sys-color-on-surface-variant)',
            maxWidth: 620,
            lineHeight: 1.5,
          }}
        >
          What are we building today? Draft an idea into a structured blueprint, or continue
          advancing your active project teams.
        </p>
      </header>

      {/* 2. Asymmetric Dual-Column Studio Layout (Concept A) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.55fr) minmax(320px, 1fr)',
          gap: 28,
          alignItems: 'start',
        }}
        className="mesh-workbench-grid"
      >
        {/* LEFT COLUMN (62%): The Creative Drafting Canvas */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MaterialSymbol name="architecture" size={18} color="var(--md-sys-color-primary)" />
                <h2
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 750,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--md-sys-color-on-surface)',
                  }}
                >
                  Blueprint Drafting Canvas
                </h2>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--md-sys-color-on-surface-variant)',
                  fontFamily: 'monospace',
                }}
              >
                STAGE 1 &rarr; STAGE 2
              </span>
            </div>

            {/* Reusable ProjectIdeaInput embedded into the studio layout */}
            <ProjectIdeaInput
              onSubmit={async (req) => {
                onStartBlueprint(req);
              }}
              isLoading={false}
            />
          </div>

          {/* Secondary Left Column: Campus Recruiting Projects */}
          <div
            style={{
              padding: '24px 28px',
              borderRadius: 'var(--md-sys-shape-corner-large)',
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 750,
                    color: 'var(--md-sys-color-on-surface)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Recruiting Campus Initiatives
                </h3>
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: 12,
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  Verified peer initiatives actively searching for complementary skills.
                </p>
              </div>

              <Button
                variant="outlined"
                size="sm"
                onClick={onExploreProjects}
                trailingIcon={<MaterialSymbol name="arrow_forward" size={14} />}
              >
                View Directory
              </Button>
            </div>

            {recruitingProjects.length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  borderRadius: 'var(--md-sys-shape-corner-small)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  border: '1px dashed var(--md-sys-color-outline-variant)',
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: 0, fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                  No open recruiting initiatives at this time. Create the first one above!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recruitingProjects.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onOpenProject(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease, background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--md-sys-color-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--md-sys-color-outline-variant)';
                      e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface)';
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 750,
                          textTransform: 'uppercase',
                          color: 'var(--md-sys-color-primary)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {p.category}
                      </span>
                      <strong style={{ fontSize: 14, color: 'var(--md-sys-color-on-surface)' }}>
                        {p.title}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--md-sys-color-on-surface-variant)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {p.members.length} {p.members.length === 1 ? 'member' : 'members'}
                      </span>
                      <MaterialSymbol name="arrow_forward_ios" size={14} color="var(--md-sys-color-outline)" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN (38%): Active Workbench Desk & Ledger */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              padding: '24px 22px',
              borderRadius: 'var(--md-sys-shape-corner-large)',
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MaterialSymbol name="folder_open" size={18} color="var(--md-sys-color-primary)" />
                <h2
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 750,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--md-sys-color-on-surface)',
                  }}
                >
                  Active Workspaces ({myProjects.length})
                </h2>
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 650,
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                Confirmed Desk
              </span>
            </div>

            {myProjects.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  border: '1px dashed var(--md-sys-color-outline-variant)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <MaterialSymbol name="edit_note" size={24} color="var(--md-sys-color-outline)" />
                <strong style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface)' }}>
                  No active workspaces yet
                </strong>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: 'var(--md-sys-color-on-surface-variant)',
                    lineHeight: 1.4,
                  }}
                >
                  Enter a project description on the left drafting canvas to generate and initialize
                  your first engineering blueprint.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myProjects.map((project) => {
                  const isLead = project.lead.id === currentUser.id;
                  const isRecruiting = project.status === 'ACTIVE';

                  return (
                    <Card
                      key={project.id}
                      variant="outlined"
                      interactive
                      onClick={() => onOpenProject(project.id)}
                      style={{
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        backgroundColor: 'var(--md-sys-color-surface)',
                        borderColor: 'var(--md-sys-color-outline-variant)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 750,
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: 'var(--md-sys-shape-corner-full)',
                                backgroundColor: isLead
                                  ? 'var(--md-sys-color-primary-container)'
                                  : 'var(--md-sys-color-secondary-container)',
                                color: isLead
                                  ? 'var(--md-sys-color-on-primary-container)'
                                  : 'var(--md-sys-color-on-secondary-container)',
                              }}
                            >
                              {isLead ? 'Owner' : 'Member'}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 750,
                                textTransform: 'uppercase',
                                color: isRecruiting
                                  ? 'var(--md-custom-color-synergy)'
                                  : 'var(--md-sys-color-outline)',
                              }}
                            >
                              &bull; {project.status}
                            </span>
                          </div>

                          <h4
                            style={{
                              margin: 0,
                              fontSize: 15,
                              fontWeight: 750,
                              color: 'var(--md-sys-color-on-surface)',
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {project.title}
                          </h4>
                        </div>

                        <MaterialSymbol name="arrow_forward" size={16} color="var(--md-sys-color-primary)" />
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: 'var(--md-sys-color-on-surface-variant)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {project.description}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--md-sys-color-outline-variant)',
                          paddingTop: 10,
                          marginTop: 2,
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
                          <span style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)', marginLeft: 4 }}>
                            {project.members.length} {project.members.length === 1 ? 'member' : 'members'}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 650,
                            color: 'var(--md-sys-color-primary)',
                          }}
                        >
                          Open Workspace &rarr;
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Guidance Card */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MaterialSymbol name="lightbulb" size={16} color="var(--md-sys-color-primary)" />
              <strong style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface)' }}>
                Deterministic Blueprint Methodology
              </strong>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'var(--md-sys-color-on-surface-variant)',
                lineHeight: 1.4,
              }}
            >
              MESH translates problem statements into discrete technical competencies using
              deterministic rules. All suggestions are fully editable before team formation.
            </p>
          </div>
        </aside>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .mesh-workbench-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

