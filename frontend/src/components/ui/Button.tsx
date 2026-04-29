import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-[var(--accent-violet)] text-white hover:bg-[var(--accent-violet)]/80 shadow-[0_0_15px_rgba(139,92,246,0.3)]",
    secondary: "bg-[var(--bg-card)] text-[var(--text-primary)] border border-white/10 hover:bg-white/5",
    ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5",
    gradient: "bg-gradient-to-r from-[var(--aurora-start)] via-[var(--aurora-mid)] to-[var(--aurora-end)] text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)]"
  };
  
  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3",
    icon: "p-2"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
