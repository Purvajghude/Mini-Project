import React, { useState, useEffect } from 'react';
import { MaterialSymbol } from '../m3';

export interface DashboardTask {
  id: string;
  title: string;
  tag: string;
  completed: boolean;
}

const INITIAL_TASKS: DashboardTask[] = [
  { id: 't1', title: 'Review ROS2 navigation nodes PR', tag: 'Rover Team', completed: false },
  { id: 't2', title: 'Submit hardware parts requisition form', tag: 'Core Robotics', completed: false },
  { id: 't3', title: 'Sync with Maya on design tokens', tag: 'MESH Platform', completed: true },
  { id: 't4', title: 'Schedule weekly architecture sprint', tag: 'Personal', completed: false },
];

export const TodoWidget: React.FC = () => {
  const [tasks, setTasks] = useState<DashboardTask[]>(() => {
    try {
      const stored = localStorage.getItem('mesh_dashboard_todos');
      return stored ? JSON.parse(stored) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [newTaskInput, setNewTaskInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('mesh_dashboard_todos', JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save todos:', e);
    }
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask: DashboardTask = {
      id: `task-${Date.now()}`,
      title: newTaskInput.trim(),
      tag: 'Team Project',
      completed: false,
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskInput('');
    setIsAdding(false);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderRadius: 'var(--md-sys-shape-corner-xl)',
        padding: '16px',
        border: '1px solid var(--md-sys-color-outline-variant)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--md-ref-typeface-brand)',
              fontWeight: 700,
              fontSize: '14px',
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            To do today
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            (By team / personal)
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            color: 'var(--md-sys-color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Add task"
          aria-label="Add Task"
        >
          <MaterialSymbol name={isAdding ? 'close' : 'add'} size={20} />
        </button>
      </div>

      {/* Add Task Input */}
      {isAdding && (
        <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Type a new task..."
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '12px',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              border: '1px solid var(--md-sys-color-outline)',
              backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
              color: 'var(--md-sys-color-on-surface)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              border: 'none',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              padding: '0 10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </form>
      )}

      {/* Checklist items */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '180px',
          overflowY: 'auto',
          paddingRight: '2px',
        }}
      >
        {tasks.map((task) => (
          <label
            key={task.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '6px 8px',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              backgroundColor: task.completed
                ? 'transparent'
                : 'var(--md-sys-color-surface-container-lowest)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background-color 150ms ease, opacity 150ms ease',
              opacity: task.completed ? 0.6 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
              style={{
                accentColor: 'var(--md-sys-color-primary)',
                marginTop: '2px',
                width: '14px',
                height: '14px',
                cursor: 'pointer',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  lineHeight: 1.3,
                  color: 'var(--md-sys-color-on-surface)',
                  textDecoration: task.completed ? 'line-through' : 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {task.title}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--md-sys-color-secondary)',
                  marginTop: '1px',
                }}
              >
                {task.tag}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};
