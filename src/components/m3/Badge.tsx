import React from 'react';
import './m3.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'standard' | 'synergy' | 'warning';
  count?: number;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'standard',
  count,
  className = '',
  ...rest
}) => {
  const display = count !== undefined ? (count > 99 ? '99+' : count) : children;

  return (
    <span className={`m3-badge m3-badge-${variant} ${className}`} {...rest}>
      {display}
    </span>
  );
};
