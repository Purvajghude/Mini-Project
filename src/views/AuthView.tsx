import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, Sparkles, User, UserCheck } from 'lucide-react';
import { Button, Card, TextField } from '../components/m3';
import { LoginRequest, RegisterRequest } from '../types/api';

interface AuthViewProps {
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
  onSubmit: (data: RegisterRequest | LoginRequest, isRegister: boolean) => Promise<void>;
  busy?: boolean;
  error?: string | null;
}

export const AuthView: React.FC<AuthViewProps> = ({
  mode,
  onModeChange,
  onSubmit,
  busy = false,
  error,
}) => {
  const isRegister = mode === 'register';

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email || !email.includes('@')) {
      errors.email = 'Valid university or academic email required';
    }
    if (!password || password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (isRegister) {
      if (!displayName.trim()) {
        errors.displayName = 'Display name is required';
      }
      if (!username || username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      } else if (!/^[A-Za-z0-9._-]+$/.test(username)) {
        errors.username = 'Letters, numbers, dots, and hyphens only';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isRegister) {
      await onSubmit({ displayName, username, email, password }, true);
    } else {
      await onSubmit({ email, password }, false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Header / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              background: 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, var(--md-sys-color-tertiary) 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--md-ref-typeface-brand)',
              fontWeight: 800,
              fontSize: 24,
              boxShadow: 'var(--md-sys-elevation-level-2)',
              marginBottom: 16,
            }}
          >
            M
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 750, margin: '0 0 8px 0', color: 'var(--md-sys-color-on-surface)' }}>
            {isRegister ? 'Create your MESH Profile' : 'Sign in to MESH'}
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--md-sys-color-on-surface-variant)' }}>
            {isRegister
              ? 'Join university project teams and find peers with complementary skills.'
              : 'Pick up where your campus projects and team conversations left off.'}
          </p>
        </div>

        <Card variant="elevated" style={{ padding: 28 }}>
          {error && (
            <div
              role="alert"
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 'var(--md-sys-shape-corner-small)',
                backgroundColor: 'var(--md-sys-color-error-container)',
                color: 'var(--md-sys-color-on-error-container)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isRegister && (
              <>
                <TextField
                  label="Full Name"
                  placeholder="e.g. Asha Patel"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  leadingIcon={<User size={18} />}
                  error={fieldErrors.displayName}
                  required
                />
                <TextField
                  label="Username"
                  placeholder="e.g. asha.builds"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  leadingIcon={<UserCheck size={18} />}
                  error={fieldErrors.username}
                  required
                />
              </>
            )}

            <TextField
              label="College Email"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leadingIcon={<Mail size={18} />}
              error={fieldErrors.email}
              required
            />

            <TextField
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leadingIcon={<Lock size={18} />}
              error={fieldErrors.password}
              required
            />

            <Button
              type="submit"
              variant="filled"
              fullWidth
              loading={busy}
              trailingIcon={<ArrowRight size={18} />}
              style={{ marginTop: 8 }}
            >
              {isRegister ? 'Register & Begin Onboarding' : 'Sign In'}
            </Button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
              {isRegister ? 'Already have an account?' : 'Need to create an account?'}{' '}
            </span>
            <button
              type="button"
              onClick={() => onModeChange(isRegister ? 'login' : 'register')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--md-sys-color-primary)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                padding: '4px 6px',
              }}
            >
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
