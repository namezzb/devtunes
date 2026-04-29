import React from 'react';
import { motion } from 'framer-motion';

interface BlackHoleProps {
  isPlaying: boolean;
}

export function BlackHole({ isPlaying }: BlackHoleProps) {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <motion.div
        animate={{
          scale: isPlaying ? [1, 1.05, 1] : 1,
          opacity: isPlaying ? [0.6, 0.8, 0.6] : 0.4,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--aurora-start)] via-[var(--aurora-mid)] to-[var(--aurora-end)] blur-2xl opacity-50"
      />
      
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: isPlaying ? 10 : 30,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute inset-2 rounded-full border border-white/10 border-t-[var(--aurora-start)] border-r-[var(--aurora-mid)] opacity-60"
      />
      
      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          duration: isPlaying ? 15 : 40,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute inset-6 rounded-full border border-white/5 border-b-[var(--aurora-end)] border-l-[var(--aurora-mid)] opacity-40"
      />
      
      <div className="relative w-24 h-24 rounded-full bg-black shadow-[inset_0_0_20px_rgba(0,0,0,1)] z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]" />
      </div>
    </div>
  );
}
