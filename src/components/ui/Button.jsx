import { Loader2 } from 'lucide-react';

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    disabled,
    type = 'button',
    onClick,
    ...props
}) => {
    const baseStyles = `
    inline-flex items-center justify-center font-medium 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed 
    transition-all duration-200
  `;

    const sizes = {
        sm: 'px-3 py-1.5 text-sm rounded-lg',
        md: 'px-4 py-2 text-sm rounded-xl',
        lg: 'px-6 py-3 text-base rounded-xl',
    };

    const variants = {
        primary: `
      bg-primary text-white 
      hover:opacity-90 hover:shadow-lg
      dark:text-black dark:font-semibold
      focus:ring-primary
    `,
        secondary: `
      bg-white dark:bg-[#1a1d22] 
      text-slate-700 dark:text-[#B0B3B8] 
      border border-slate-300 dark:border-[#2A2E35] 
      hover:bg-slate-50 dark:hover:bg-[#14171C] hover:border-slate-400 dark:hover:border-[#3A3E45]
      focus:ring-primary
    `,
        danger: `
      bg-red-500 text-white 
      hover:bg-red-600 
      focus:ring-red-500
    `,
        ghost: `
      text-slate-600 dark:text-[#6B6F76] 
      hover:bg-slate-100 dark:hover:bg-[#1a1d22] 
      hover:text-slate-900 dark:hover:text-white
      focus:ring-slate-500
    `,
    };

    return (
        <button
            type={type}
            className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {children}
        </button>
    );
};
