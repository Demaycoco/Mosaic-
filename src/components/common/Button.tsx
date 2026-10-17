import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  pill?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  pill = false,
  fullWidth = false,
  icon,
  children,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) => {
  // Base styling: consistent height, alignment, typography, and focus ring
  const baseClasses =
    'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06070a] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none shrink-0';

  // Size specifications matching design tokens
  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-[34px] px-3 text-xs gap-1.5',
    md: 'h-[40px] px-4 text-xs sm:text-sm gap-2',
    lg: 'h-[44px] px-5 text-sm gap-2.5',
  };

  // Radius: disciplined rounded-xl or rounded-lg by default; avoid forcing every button into a pill
  const radiusClass = pill
    ? 'rounded-full'
    : size === 'sm'
    ? 'rounded-lg'
    : 'rounded-xl';

  // Variant specifications
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-slate-950 font-bold hover:opacity-95 shadow-md shadow-purple-950/40 active:scale-[0.98]',
    secondary:
      'bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-200 hover:text-white border border-white/10 hover:border-white/20 active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-white/5 active:bg-white/10 text-slate-400 hover:text-white border border-transparent active:scale-[0.98]',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:border-rose-500/50 active:scale-[0.98]',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${radiusClass} ${variantClasses[variant]} ${widthClass} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
