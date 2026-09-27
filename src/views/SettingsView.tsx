import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  Eye,
  Github,
  Globe,
  Lock,
  LogOut,
  RefreshCw,
  RotateCcw,
  Shield,
  User,
} from 'lucide-react';
import { Button, Card } from '../components/m3';
import { PrivacySettings } from '../types/api';

interface SettingsViewProps {
  settings: PrivacySettings;
  onUpdateSettings: (updates: Partial<PrivacySettings>) => Promise<void>;
  onSignOut: () => void;
  onToast: (msg: string) => void;
  busy?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onSignOut,
  onToast,
  busy = false,
}) => {
  const [localSettings, setLocalSettings] = useState<PrivacySettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const toggle = async (key: keyof PrivacySettings) => {
    const nextVal = !localSettings[key];
    const updated = { ...localSettings, [key]: nextVal };
    setLocalSettings(updated);
    await onUpdateSettings({ [key]: nextVal });
    onToast('Settings updated.');
  };

  const handleVisibilityChange = async (visibility: PrivacySettings['profileVisibility']) => {
    setLocalSettings({ ...localSettings, profileVisibility: visibility });
    await onUpdateSettings({ profileVisibility: visibility });
    onToast(`Profile visibility set to ${visibility.toLowerCase().replace('_', ' ')}.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 840, margin: '0 auto' }}>
      <div>
        <h1 style={{ margin: '0 0 4px 0', fontSize: 24, fontWeight: 750, color: 'var(--md-sys-color-on-surface)' }}>
          Profile &amp; Privacy Settings
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--md-sys-color-on-surface-variant)' }}>
          Control your profile discoverability, contact confidentiality, and evidence synchronization.
        </p>
      </div>

      {/* Profile Visibility */}
      <Card variant="outlined" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Globe size={20} color="var(--md-sys-color-primary)" />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Profile Discoverability &amp; Reach</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            {
              id: 'CAMPUS',
              title: 'Entire Campus',
              desc: 'Visible to all verified students and faculty on the university network.',
            },
            {
              id: 'CONNECTIONS_ONLY',
              title: 'Connections Only',
              desc: 'Only peers who have successfully matched with you can view full details.',
            },
            {
              id: 'PRIVATE',
              title: 'Private & Hidden',
              desc: 'Pause discovery; your card will not appear in the collaborator feed.',
            },
          ].map((opt) => {
            const isSelected = localSettings.profileVisibility === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => handleVisibilityChange(opt.id as any)}
                style={{
                  padding: 16,
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  border: `2px solid ${
                    isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'
                  }`,
                  backgroundColor: isSelected
                    ? 'var(--md-sys-color-primary-container)'
                    : 'var(--md-sys-color-surface-container-low)',
                  color: isSelected
                    ? 'var(--md-sys-color-on-primary-container)'
                    : 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong style={{ fontSize: 14 }}>{opt.title}</strong>
                  {isSelected && <Check size={16} />}
                </div>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>{opt.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Privacy Toggles */}
      <Card variant="outlined" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={20} color="var(--md-sys-color-primary)" />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Privacy &amp; Contact Shielding</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email Shield */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: 14, display: 'block' }}>Shield College Email</strong>
              <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
                {localSettings.showEmail
                  ? 'Your university email is visible on your profile.'
                  : 'Your email is hidden. Students must initiate a MESH collaboration request first.'}
              </span>
            </div>
            <Button
              variant={!localSettings.showEmail ? 'filled' : 'outlined'}
              size="sm"
              onClick={() => toggle('showEmail')}
            >
              {!localSettings.showEmail ? 'Shielded' : 'Public'}
            </Button>
          </div>

          {/* Algorithmic Discovery */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: 14, display: 'block' }}>Algorithmic Peer Suggestions</strong>
              <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Allow MESH to analyze your skill complementarities and recommend you to team leads.
              </span>
            </div>
            <Button
              variant={localSettings.allowDiscovery ? 'filled' : 'outlined'}
              size="sm"
              onClick={() => toggle('allowDiscovery')}
            >
              {localSettings.allowDiscovery ? 'Enabled' : 'Paused'}
            </Button>
          </div>

          {/* GitHub Sync */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: 14, display: 'block' }}>Automatic GitHub Evidence Sync</strong>
              <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Periodically synchronize repository commits, languages, and stars to your profile.
              </span>
            </div>
            <Button
              variant={localSettings.githubSyncEnabled ? 'filled' : 'outlined'}
              size="sm"
              onClick={() => toggle('githubSyncEnabled')}
            >
              {localSettings.githubSyncEnabled ? 'Active' : 'Disabled'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card variant="outlined" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={20} color="var(--md-sys-color-primary)" />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Notifications &amp; Alerts</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: 14, display: 'block' }}>Match &amp; Collaboration Requests</strong>
              <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Get notified whenever a peer sends you an interest request or accepts your handshake.
              </span>
            </div>
            <Button
              variant={localSettings.notifyOnMatch ? 'tonal' : 'outlined'}
              size="sm"
              onClick={() => toggle('notifyOnMatch')}
            >
              {localSettings.notifyOnMatch ? 'On' : 'Muted'}
            </Button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: 14, display: 'block' }}>Project Chat &amp; Channel Messages</strong>
              <span style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Receive notifications for new messages inside active project channels.
              </span>
            </div>
            <Button
              variant={localSettings.notifyOnMessage ? 'tonal' : 'outlined'}
              size="sm"
              onClick={() => toggle('notifyOnMessage')}
            >
              {localSettings.notifyOnMessage ? 'On' : 'Muted'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Session */}
      <Card
        variant="filled"
        style={{
          padding: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <strong style={{ fontSize: 15, display: 'block' }}>Account Session</strong>
          <span style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Manage your authenticated session or sign out securely.
          </span>
        </div>
        <Button
          variant="tonal"
          icon={<LogOut size={15} />}
          onClick={onSignOut}
        >
          Sign Out
        </Button>
      </Card>
    </div>
  );
};
