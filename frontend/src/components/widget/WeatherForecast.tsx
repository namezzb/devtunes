import { motion } from 'framer-motion';

interface ForecastDay {
  day: string;
  icon: string;
  high: number;
  low: number;
  precipitation: number;
}

interface WeatherForecastProps {
  days?: ForecastDay[];
}

const MOCK_FORECAST: ForecastDay[] = [
  { day: 'Mon', icon: '☀️', high: 24, low: 16, precipitation: 0 },
  { day: 'Tue', icon: '🌤️', high: 22, low: 14, precipitation: 10 },
  { day: 'Wed', icon: '☁️', high: 20, low: 15, precipitation: 30 },
  { day: 'Thu', icon: '🌧️', high: 18, low: 13, precipitation: 70 },
  { day: 'Fri', icon: '⛈️', high: 17, low: 12, precipitation: 90 },
];

export function WeatherForecast({ days = MOCK_FORECAST }: WeatherForecastProps) {
  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
    >
      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
        5-Day Forecast
      </h3>
      <div className="flex justify-between gap-2">
        {days.map((day, index) => (
          <ForecastItem key={day.day} day={day} index={index} />
        ))}
      </div>
    </motion.div>
  );
}

function ForecastItem({ day, index }: { day: ForecastDay; index: number }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1 flex-1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index + 0.3, duration: 0.4 }}
    >
      <span className="text-xs font-medium text-[var(--text-secondary)]">
        {day.day}
      </span>
      <motion.span
        className="text-2xl"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse',
          delay: index * 0.2,
        }}
      >
        {day.icon}
      </motion.span>
      <div className="flex flex-col items-center">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {day.high}°
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          {day.low}°
        </span>
      </div>
      {day.precipitation > 0 && (
        <div className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--aurora-start)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
          <span className="text-[10px] text-[var(--aurora-start)]">
            {day.precipitation}%
          </span>
        </div>
      )}
    </motion.div>
  );
}
