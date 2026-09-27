import React from 'react';
import './m3.css';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
  onRemove?: () => void;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  selected = false,
  icon,
  onRemove,
  className = '',
  ...rest
}) => {
  return (
    <button
      type="button"
      className={`m3-chip ${selected ? 'm3-chip-selected' : ''} ${className}`}
      {...rest}
    >
      {selected && !icon && (
        <span aria-hidden="true" style={{ fontSize: 14, fontWeight: 'bold' }}>
          ✓
        </span>
      )}
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              onRemove();
            }
          }}
          style={{ marginLeft: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
        >
          ✕
        </span>
      )}
    </button>
  );
};
