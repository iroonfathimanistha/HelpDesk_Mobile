import React, { useState } from 'react';

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  loadingLabel?: string;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Reusable Action Button with tactile touch/click feedback, micro-interaction transitions,
 * loading spinner state, disabled handling, and accessible styling.
 * Matches React Native Pressable pressed-state physics (active:scale-[0.98], active:opacity-90).
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  loadingLabel = 'Processing...',
  isLoading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  icon,
  children,
  disabled,
  className = '',
  onClick,
  ...rest
}) => {
  const [isPressed, setIsPressed] = useState(false);

  // Variant color definitions
  const variantStyles = {
    primary:
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm hover:shadow active:shadow-none focus-visible:ring-blue-500 border border-blue-600',
    secondary:
      'bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white shadow-sm focus-visible:ring-slate-500 border border-slate-800',
    danger:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm focus-visible:ring-red-500 border border-red-600',
    outline:
      'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 focus-visible:ring-slate-400',
    success:
      'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm focus-visible:ring-emerald-500 border border-emerald-600',
  };

  // Size definitions
  const sizeStyles = {
    sm: 'py-2 px-3 text-xs rounded-xl min-h-[36px]',
    md: 'py-3 px-4 text-xs font-bold rounded-xl min-h-[44px]',
    lg: 'py-3.5 px-5 text-sm font-bold rounded-2xl min-h-[50px]',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      onMouseDown={() => !isDisabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => !isDisabled && setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      onClick={onClick}
      className={`
        relative select-none font-bold
        inline-flex items-center justify-center gap-2
        transition-all duration-150 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        ${fullWidth ? 'w-full' : ''}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${
          isDisabled
            ? 'opacity-60 cursor-not-allowed pointer-events-none shadow-none filter saturate-75'
            : isPressed
            ? 'scale-[0.98] opacity-90 brightness-95'
            : 'active:scale-[0.98] active:opacity-90 active:brightness-95 cursor-pointer'
        }
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin w-4 h-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="truncate">{loadingLabel}</span>
        </>
      ) : (
        <>
          {icon && <span className="inline-flex shrink-0">{icon}</span>}
          {label ? <span>{label}</span> : children}
        </>
      )}
    </button>
  );
};