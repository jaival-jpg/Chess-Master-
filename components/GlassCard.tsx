import React from 'react';
import { cn } from '@/lib/utils';

export const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn(
      "bg-[#2A1B10]/80 backdrop-blur-xl border-t border-l border-[#8B5A2B]/60 border-b-4 border-r-4 border-b-[#1a100a]/80 border-r-[#1a100a]/80 rounded-2xl shadow-[8px_8px_16px_rgba(0,0,0,0.6),-4px_-4px_8px_rgba(255,255,255,0.05)] overflow-hidden",
      "relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none",
      className
    )}>
      {children}
    </div>
  );
};
