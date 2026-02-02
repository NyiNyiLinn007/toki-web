import { cn } from '../utils/cn';

export default function Input({ className, ...props }) {
    return (
        <input
            className={cn(
                "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200",
                className
            )}
            {...props}
        />
    );
}
