import React from 'react';
import './m3.css';

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  tone?: string | null;
  online?: boolean;
}

function getInitials(name: string): string {
  if (!name) return 'M';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  tone = 'sapphire',
  online,
  className = '',
  ...rest
}) => {
  const safeTone = tone || 'sapphire';
  const initials = getInitials(name);

  return (
    <span
      className={`m3-avatar m3-avatar-${size} m3-avatar-${safeTone} ${className}`}
      aria-label={name}
      {...rest}
    >
      {initials}
      {online && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size === 'xs' || size === 'sm' ? 8 : 12,
            height: size === 'xs' || size === 'sm' ? 8 : 12,
            borderRadius: '50%',
            backgroundColor: 'var(--md-custom-color-synergy)',
            border: '2px solid var(--md-sys-color-surface-container)',
          }}
        />
      )}
    </span>
  );
};
