import React from 'react';

export interface MaterialSymbolProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  fill?: boolean;
  weight?: number;
  grade?: number;
  size?: number;
  color?: string;
}

export const MaterialSymbol: React.FC<MaterialSymbolProps> = ({
  name,
  fill = false,
  weight = 400,
  grade = 0,
  size = 24,
  color,
  style,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`material-symbols-rounded ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${size}`,
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        lineHeight: 1,
        color: color || 'currentColor',
        userSelect: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  );
};
