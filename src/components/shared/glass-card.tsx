'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'purple' | 'cyan' | 'none';
  delay?: number;
}

export default function GlassCard({ children, className, hover = false, glow = 'none', delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        'glass-card p-6',
        hover && 'cursor-pointer transition-all duration-300 hover:border-xeno-purple/30 hover:shadow-[0_8px_32px_rgba(139,92,246,0.1)]',
        glow === 'purple' && 'glow-purple',
        glow === 'cyan' && 'glow-cyan',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
