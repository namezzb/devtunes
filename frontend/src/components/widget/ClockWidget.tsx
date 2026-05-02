import { motion } from 'framer-motion';
import { useClock } from '../../hooks/useClock';

interface ClockWidgetProps {
  format?: '12h' | '24h';
  showSeconds?: boolean;
  showDate?: boolean;
}

export function ClockWidget({
  format = '24h',
  showSeconds = true,
  showDate = true,
}: ClockWidgetProps) {
  const { hours, minutes, seconds, date, dayOfWeek, period } = useClock(format);

  return (
    <motion.div
      className="glass-card p-6 flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="flex items-baseline gap-1">
        <TimeSegment value={hours} label="Hours" />
        <span className="text-4xl font-light text-[var(--aurora-mid)] animate-pulse">:</span>
        <TimeSegment value={minutes} label="Minutes" />
        {showSeconds && (
          <>
            <span className="text-4xl font-light text-[var(--aurora-mid)] animate-pulse">:</span>
            <TimeSegment value={seconds} label="Seconds" />
          </>
        )}
        {format === '12h' && (
          <span className="ml-2 text-lg font-medium text-[var(--text-secondary)]">
            {period}
          </span>
        )}
      </div>

      {showDate && (
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-[var(--text-secondary)] text-sm font-medium">
            {dayOfWeek}
          </p>
          <p className="text-[var(--text-muted)] text-xs mt-1">
            {date}
          </p>
        </motion.div>
      )}

      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--aurora-start)] via-[var(--aurora-mid)] to-[var(--aurora-end)] opacity-0 hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
}

function TimeSegment({ value, label }: { value: string; label: string }) {
  return (
    <motion.span
      key={value}
      className="text-5xl font-bold tracking-tighter"
      style={{
        background: 'linear-gradient(135deg, var(--aurora-start), var(--aurora-mid), var(--aurora-end))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      aria-label={label}
    >
      {value}
    </motion.span>
  );
}
