import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'relative overflow-hidden rounded-2xl font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 border-b-4 border-r-4 border-t border-l';
    
    const variants = {
      primary: 'bg-gradient-to-b from-[#00FF9C] to-[#00CC7A] text-black border-b-[#00995C] border-r-[#00995C] border-t-[#80ffce] border-l-[#80ffce] shadow-[4px_4px_10px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[6px_6px_15px_rgba(0,0,0,0.6),inset_2px_2px_4px_rgba(255,255,255,0.6)] active:border-b-0 active:border-r-0 active:translate-y-1 active:translate-x-1 active:shadow-[0_0_0_rgba(0,0,0,0),inset_2px_2px_4px_rgba(255,255,255,0.5)]',
      secondary: 'bg-gradient-to-b from-[#FFC107] to-[#E0A800] text-black border-b-[#B38600] border-r-[#B38600] border-t-[#ffe082] border-l-[#ffe082] shadow-[4px_4px_10px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[6px_6px_15px_rgba(0,0,0,0.6),inset_2px_2px_4px_rgba(255,255,255,0.6)] active:border-b-0 active:border-r-0 active:translate-y-1 active:translate-x-1 active:shadow-[0_0_0_rgba(0,0,0,0),inset_2px_2px_4px_rgba(255,255,255,0.5)]',
      danger: 'bg-gradient-to-b from-[#FF4C4C] to-[#CC0000] text-white border-b-[#990000] border-r-[#990000] border-t-[#ff9999] border-l-[#ff9999] shadow-[4px_4px_10px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[6px_6px_15px_rgba(0,0,0,0.6),inset_2px_2px_4px_rgba(255,255,255,0.4)] active:border-b-0 active:border-r-0 active:translate-y-1 active:translate-x-1 active:shadow-[0_0_0_rgba(0,0,0,0),inset_2px_2px_4px_rgba(255,255,255,0.3)]',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg w-full',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...(props as any)}
      >
        {/* Inner glass reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none rounded-t-2xl h-1/2" />
        {children}
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
