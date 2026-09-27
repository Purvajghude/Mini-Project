import React, { useEffect } from 'react';
import './m3.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  headline: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  headline,
  children,
  actions,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="m3-dialog-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="m3-dialog-headline"
    >
      <div
        className="m3-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="m3-dialog-headline" className="m3-dialog-headline">
          {headline}
        </h2>
        <div className="m3-dialog-body">{children}</div>
        {actions && <div className="m3-dialog-actions">{actions}</div>}
      </div>
    </div>
  );
};
