import React, { useId } from 'react';
import './m3.css';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  supportingText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  supportingText,
  leadingIcon,
  trailingIcon,
  id: explicitId,
  className = '',
  disabled,
  ...inputProps
}) => {
  const generatedId = useId();
  const id = explicitId || generatedId;

  return (
    <div className={`m3-text-field-container ${error ? 'm3-text-field-error' : ''} ${className}`}>
      <div className="m3-text-field-box">
        {leadingIcon && <span className="m3-text-field-icon-leading">{leadingIcon}</span>}
        <div className="m3-text-field-input-wrapper">
          <label htmlFor={id} className="m3-text-field-label">
            {label}
          </label>
          <input
            id={id}
            className="m3-text-field-input"
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error || supportingText ? `${id}-desc` : undefined}
            {...inputProps}
          />
        </div>
        {trailingIcon && <span className="m3-text-field-icon-trailing">{trailingIcon}</span>}
      </div>
      {(error || supportingText) && (
        <div id={`${id}-desc`} className="m3-text-field-supporting-text">
          {error ? (
            <span className="m3-text-field-error-text" role="alert">
              {error}
            </span>
          ) : (
            <span>{supportingText}</span>
          )}
        </div>
      )}
    </div>
  );
};

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  supportingText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  supportingText,
  id: explicitId,
  className = '',
  disabled,
  rows = 3,
  ...textareaProps
}) => {
  const generatedId = useId();
  const id = explicitId || generatedId;

  return (
    <div className={`m3-text-field-container ${error ? 'm3-text-field-error' : ''} ${className}`}>
      <div className="m3-text-field-box" style={{ alignItems: 'flex-start', paddingTop: 8 }}>
        <div className="m3-text-field-input-wrapper">
          <label htmlFor={id} className="m3-text-field-label">
            {label}
          </label>
          <textarea
            id={id}
            rows={rows}
            className="m3-text-field-input m3-text-field-textarea"
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error || supportingText ? `${id}-desc` : undefined}
            {...textareaProps}
          />
        </div>
      </div>
      {(error || supportingText) && (
        <div id={`${id}-desc`} className="m3-text-field-supporting-text">
          {error ? (
            <span className="m3-text-field-error-text" role="alert">
              {error}
            </span>
          ) : (
            <span>{supportingText}</span>
          )}
        </div>
      )}
    </div>
  );
};
