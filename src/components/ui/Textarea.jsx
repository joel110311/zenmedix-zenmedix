import { forwardRef } from 'react';

export const Textarea = forwardRef(({ label, error, className = '', rows = 3, ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                rows={rows}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm
          ${error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-slate-300'}
          ${className}
        `}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-danger">{error.message}</p>}
        </div>
    );
});

Textarea.displayName = 'Textarea';
