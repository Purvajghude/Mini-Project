import React from 'react';
import './m3.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'elevated' | 'tonal' | 'outlined' | 'text';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'filled',
  size = 'md',
  icon,
  trailingIcon,
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...rest
}) => {
  const classes = [
    'm3-button',
    `m3-button-${variant}`,
    size === 'sm' ? 'm3-button-sm' : '',
    icon ? 'm3-button-has-icon-leading' : '',
    trailingIcon ? 'm3-button-has-icon-trailing' : '',
    fullWidth ? 'm3-button-full-width' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span className="m3-spinner" aria-hidden="true" style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
      ) : (
        icon && <span className="m3-button-icon-leading" aria-hidden="true">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && trailingIcon && <span className="m3-button-icon-trailing" aria-hidden="true">{trailingIcon}</span>}
    </button>
  );
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  className = '',
  ...rest
}) => {
  return (
    <button className={`m3-icon-button ${className}`} {...rest}>
      {icon}
    </button>
  );
};
