import React, { useEffect } from 'react';
import './m3.css';

export interface SnackbarProps {
  message: string | null;
  actionText?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  message,
  actionText,
  onAction,
  onDismiss,
  duration = 4000,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div className="m3-snackbar" role="status" aria-live="polite">
      <span>{message}</span>
      {actionText && onAction && (
        <button className="m3-snackbar-action" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};
