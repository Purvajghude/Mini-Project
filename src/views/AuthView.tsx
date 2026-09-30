import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, Sparkles, User, UserCheck, KeyRound, RotateCcw } from 'lucide-react';
import { Button, Card, TextField } from '../components/m3';
import { LoginRequest, RegisterRequest } from '../types/api';
import { resetMockDatabase } from '../api/index';

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

  // Pre-fill guaranteed working test credentials
  const [displayName, setDisplayName] = useState('Purvaj Ghude');
  const [username, setUsername] = useState('purvaj.builds');
  const [email, setEmail] = useState('purvaj@university.edu');
  const [password, setPassword] = useState('password123');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleInstantSignIn = async () => {
    setEmail('purvaj@university.edu');
    setPassword('password123');
    await onSubmit({ email: 'purvaj@university.edu', password: 'password123' }, false);
  };

  const handleResetAndSignIn = async () => {
    try {
      sessionStorage.clear();
      resetMockDatabase();
    } catch {
      // ignore
    }
    await handleInstantSignIn();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const safeEmail = email.trim() || 'purvaj@university.edu';
    const safePassword = password || 'password123';
    const safeDisplayName = displayName.trim() || 'Purvaj Ghude';
    const safeUsername = username.trim() || 'purvaj.builds';

    if (isRegister) {
      await onSubmit(
        {
          displayName: safeDisplayName,
          username: safeUsername,
          email: safeEmail,
          password: safePassword,
        },
        true
      );
    } else {
      await onSubmit({ email: safeEmail, password: safePassword }, false);
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
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Header / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              background: 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, var(--md-sys-color-tertiary) 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--md-ref-typeface-brand)',
              fontWeight: 800,
              fontSize: 26,
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
          {/* Guaranteed Working Credentials Card */}
          <div
            style={{
              marginBottom: 20,
              padding: '16px',
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              border: '1px solid color-mix(in srgb, var(--md-sys-color-primary) 25%, transparent)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 750, fontSize: 13 }}>
                <KeyRound size={16} />
                <span>Guaranteed Test Account</span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Ready
              </span>
            </div>

            <div style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 12, opacity: 0.9 }}>
              <div><strong>Email:</strong> <code style={{ backgroundColor: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 4 }}>purvaj@university.edu</code></div>
              <div><strong>Password:</strong> <code style={{ backgroundColor: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 4 }}>password123</code></div>
            </div>

            <Button
              type="button"
              variant="filled"
              size="sm"
              loading={busy}
              fullWidth
              onClick={handleInstantSignIn}
              icon={<Sparkles size={16} />}
              style={{ fontWeight: 700 }}
            >
              1-Click Sign In (Guaranteed Access)
            </Button>
          </div>

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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '16px 0',
              color: 'var(--md-sys-color-outline)',
              fontSize: 12,
            }}
          >
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
            <span>or sign in manually</span>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isRegister && (
              <>
                <TextField
                  label="Full Name"
                  placeholder="e.g. Purvaj Ghude"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  leadingIcon={<User size={18} />}
                  error={fieldErrors.displayName}
                  required
                />
                <TextField
                  label="Username"
                  placeholder="e.g. purvaj.builds"
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

          <div style={{ marginTop: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
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

            <button
              type="button"
              onClick={handleResetAndSignIn}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--md-sys-color-outline)',
                fontSize: 11,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
              title="Clear stored mock data and sign in fresh"
            >
              <RotateCcw size={12} />
              Reset Stored Mock Data & Sign In
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
