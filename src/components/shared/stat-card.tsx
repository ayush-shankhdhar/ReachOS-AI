'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import AnimatedCounter from './animated-counter';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change?: number;
  icon: LucideIcon;
  color?: 'purple' | 'cyan' | 'green' | 'amber' | 'pink';
  delay?: number;
}

const colorMap = {
  purple: { bg: 'bg-xeno-purple/10', text: 'text-xeno-purple', border: 'border-xeno-purple/20' },
  cyan: { bg: 'bg-xeno-cyan/10', text: 'text-xeno-cyan', border: 'border-xeno-cyan/20' },
  green: { bg: 'bg-xeno-green/10', text: 'text-xeno-green', border: 'border-xeno-green/20' },
  amber: { bg: 'bg-xeno-amber/10', text: 'text-xeno-amber', border: 'border-xeno-amber/20' },
  pink: { bg: 'bg-xeno-pink/10', text: 'text-xeno-pink', border: 'border-xeno-pink/20' },
};

export default function StatCard({ title, value, prefix = '', suffix = '', change, icon: Icon, color = 'purple', delay = 0 }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'glass-card p-5 group cursor-default',
        'hover:border-xeno-purple/30 hover:shadow-[0_8px_32px_rgba(139,92,246,0.1)] transition-all duration-300'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2.5 rounded-xl', colors.bg, colors.border, 'border')}>
          <Icon className={cn('w-5 h-5', colors.text)} />
        </div>
        {change !== undefined && (
          <span className={cn(
            'text-xs font-semibold px-2 py-1 rounded-full',
            change >= 0 ? 'text-xeno-green bg-xeno-green/10' : 'text-xeno-red bg-xeno-red/10'
          )}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <div className="text-2xl font-bold text-foreground">
        {prefix}<AnimatedCounter value={value} />{suffix}
      </div>
    </motion.div>
  );
}
