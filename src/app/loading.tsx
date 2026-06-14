'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="w-16 h-16 rounded-2xl gradient-mixed flex items-center justify-center">
          <Zap className="w-8 h-8 text-white" />
        </div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground mt-4 text-sm"
      >
        Loading...
      </motion.p>
    </div>
  );
}
