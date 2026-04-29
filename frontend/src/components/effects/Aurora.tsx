import React from 'react';
import { motion } from 'framer-motion';

interface AuroraProps {
  isPlaying: boolean;
}

export function Aurora({ isPlaying }: AuroraProps) {
  return (
    <div className="absolute top-0 left-0 right-0 h-[150px] overflow-hidden pointer-events-none z-0">
      <motion.div
        animate={{
          opacity: isPlaying ? 0.8 : 0.4,
        }}
        transition={{ duration: 1 }}
        className="absolute inset-0"
      >
        <div 
          className="absolute inset-0 opacity-60 blur-[60px] mix-blend-screen"
          style={{
            background: `
              radial-gradient(circle at 20% 50%, var(--aurora-start) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, var(--aurora-mid) 0%, transparent 50%),
              radial-gradient(circle at 80% 50%, var(--aurora-end) 0%, transparent 50%)
            `
          }}
        />
        
        <motion.div
          animate={{
            x: ['-10%', '10%', '-10%'],
            y: ['-5%', '5%', '-5%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -inset-[50%] opacity-40 blur-[80px] mix-blend-screen"
          style={{
            background: `
              radial-gradient(ellipse at 40% 40%, var(--aurora-mid) 0%, transparent 40%),
              radial-gradient(ellipse at 60% 60%, var(--aurora-start) 0%, transparent 40%)
            `
          }}
        />
      </motion.div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-deep)]" />
    </div>
  );
}
