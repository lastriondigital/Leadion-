import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-[9px] gap-1.5 h-8',
    md: 'text-sm px-4 py-2 rounded-[11px] gap-2 h-10',
    lg: 'text-base px-5 py-2.5 rounded-[12px] gap-2.5 h-12',
  };

  const variantClasses = {
    primary: 'bg-[#635BFF] hover:bg-[#5046E5] text-white shadow-sm active:translate-y-px',
    secondary: 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 active:translate-y-px',
    outline: 'border border-[#E6E8EC] dark:border-zinc-700 bg-white hover:bg-zinc-50 text-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 dark:text-zinc-200 shadow-sm active:translate-y-px',
    ghost: 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm active:translate-y-px',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:translate-y-px',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};
