import React from 'react';
import './m3.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'filled' | 'outlined';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  interactive = false,
  className = '',
  ...rest
}) => {
  return (
    <div
      className={`m3-card m3-card-${variant} ${interactive ? 'm3-card-interactive' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
