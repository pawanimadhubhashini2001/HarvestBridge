import type { ButtonHTMLAttributes } from 'react';

const variants = {
  primary: 'bg-harvest-600 text-white hover:bg-harvest-700 focus-visible:ring-harvest-500',
  secondary: 'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:ring-harvest-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-harvest-500',
};

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}>
      {children}
    </button>
  );
}
