import React, { useState } from 'react';
import { MaterialSymbol, Dialog, TextField, Button } from '../m3';

interface QuickActionsToolbarProps {
  onOpenSchedule?: () => void;
  onOpenNotifications?: () => void;
  onCreateProject?: () => void;
}

export const QuickActionsToolbar: React.FC<QuickActionsToolbarProps> = ({
  onOpenSchedule,
  onOpenNotifications,
  onCreateProject,
}) => {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState(() => {
    return localStorage.getItem('mesh_quick_note') || '';
  });
  const [noteSavedToast, setNoteSavedToast] = useState(false);

  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const saveNote = () => {
    localStorage.setItem('mesh_quick_note', noteContent);
    setNoteSavedToast(true);
    setTimeout(() => setNoteSavedToast(false), 2000);
    setShowNoteModal(false);
  };

  return (
    <>
      <div
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderRadius: 'var(--md-sys-shape-corner-xl)',
          padding: '12px 16px',
          border: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          Other tools / quick actions
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          {/* Note scratchpad */}
          <button
            onClick={() => setShowNoteModal(true)}
            title="Quick Notes"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 150ms ease',
            }}
          >
            <MaterialSymbol name="description" size={20} />
          </button>

          {/* Calendar schedule */}
          <button
            onClick={onOpenSchedule}
            title="Project Milestones Schedule"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 150ms ease',
            }}
          >
            <MaterialSymbol name="calendar_month" size={20} />
          </button>

          {/* Alerts */}
          <button
            onClick={onOpenNotifications}
            title="Team Alerts & Invites"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 150ms ease',
            }}
          >
            <MaterialSymbol name="notifications" size={20} />
          </button>

          {/* Plus FAB */}
          <button
            onClick={() => setShowQuickCreate(true)}
            title="Quick Create"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              border: 'none',
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--md-sys-elevation-level-1)',
              transition: 'transform 150ms ease, background-color 150ms ease',
            }}
          >
            <MaterialSymbol name="add" size={24} />
          </button>
        </div>
      </div>

      {/* Note Modal */}
      <Dialog
        open={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        headline="Quick Scratchpad Note"
        actions={
          <>
            <Button variant="text" onClick={() => setShowNoteModal(false)}>
              Cancel
            </Button>
            <Button variant="filled" onClick={saveNote}>
              Save Note
            </Button>
          </>
        }
      >
        <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)' }}>
          Jot down quick thoughts, meeting notes, or project task ideas saved locally.
        </p>
        <textarea
          rows={5}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="e.g. Discuss ROS2 odometry topic with robotics team on Thursday..."
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            fontFamily: 'inherit',
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            border: '1px solid var(--md-sys-color-outline)',
            backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
            color: 'var(--md-sys-color-on-surface)',
            resize: 'vertical',
            outline: 'none',
          }}
        />
      </Dialog>

      {/* Quick Create Dialog */}
      <Dialog
        open={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        headline="Quick Actions"
        actions={
          <Button variant="text" onClick={() => setShowQuickCreate(false)}>
            Close
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => {
              setShowQuickCreate(false);
              onCreateProject?.();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialSymbol name="folder_special" size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--md-sys-color-on-surface)' }}>
                Create New Project
              </div>
              <div style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Recruit student team members and track tasks
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowQuickCreate(false);
              onOpenSchedule?.();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                backgroundColor: 'var(--md-sys-color-secondary-container)',
                color: 'var(--md-sys-color-on-secondary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialSymbol name="calendar_month" size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--md-sys-color-on-surface)' }}>
                View Team Milestones
              </div>
              <div style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Check upcoming deliverables and deadlines
              </div>
            </div>
          </button>
        </div>
      </Dialog>
    </>
  );
};
