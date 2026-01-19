import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className="flex justify-center items-center py-4">
            <Loader2 className={`${sizes[size]} animate-spin text-primary ${className}`} />
        </div>
    );
};
