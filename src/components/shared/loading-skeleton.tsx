'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
              <div className="w-12 h-5 rounded-full bg-white/5 animate-pulse" />
            </div>
            <div className="w-24 h-4 rounded bg-white/5 animate-pulse mb-2" />
            <div className="w-32 h-7 rounded bg-white/5 animate-pulse" />
          </motion.div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="glass-card p-6">
        <div className="w-40 h-5 rounded bg-white/5 animate-pulse mb-6" />
        <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
