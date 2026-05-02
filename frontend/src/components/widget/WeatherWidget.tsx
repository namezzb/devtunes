import { motion } from 'framer-motion';
import { useWeather, type WeatherData } from '../../hooks/useWeather';

interface WeatherWidgetProps {
  apiKey?: string;
  latitude?: number;
  longitude?: number;
  useMock?: boolean;
}

export function WeatherWidget({
  apiKey,
  latitude,
  longitude,
  useMock = true,
}: WeatherWidgetProps) {
  const { weather, loading, error, refresh, getDescription } = useWeather({
    apiKey,
    latitude,
    longitude,
    useMock,
  });

  if (loading) {
    return <WeatherLoading />;
  }

  if (error && !weather) {
    return <WeatherError message={error} onRetry={refresh} />;
  }

  if (!weather) {
    return null;
  }

  return <WeatherContent weather={weather} description={getDescription()} onRefresh={refresh} />;
}

function WeatherContent({
  weather,
  description,
  onRefresh,
}: {
  weather: WeatherData;
  description: string;
  onRefresh: () => void;
}) {
  return (
    <motion.div
      className="glass-card p-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <motion.span
            className="text-5xl"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            {weather.icon}
          </motion.span>
          <div>
            <motion.p
              className="text-4xl font-bold"
              style={{
                background: 'linear-gradient(135deg, var(--aurora-start), var(--aurora-mid))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {weather.temperature}°C
            </motion.p>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              {description}
            </p>
          </div>
        </div>

        <motion.button
          onClick={onRefresh}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-2"
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
          aria-label="Refresh weather"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
        </motion.button>
      </div>

      <motion.div
        className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v8l4 4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          <span>Feels like {weather.feelsLike}°C</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
          <span>{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
          </svg>
          <span>{weather.windSpeed} km/h</span>
        </div>
      </motion.div>

      <motion.p
        className="mt-3 text-xs text-[var(--text-muted)] text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {weather.location}
      </motion.p>

      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--aurora-start)]/5 to-[var(--aurora-mid)]/5 pointer-events-none" />
    </motion.div>
  );
}

function WeatherLoading() {
  return (
    <div className="glass-card p-6 flex items-center justify-center h-[180px]">
      <motion.div
        className="w-8 h-8 border-2 border-[var(--aurora-mid)] border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

function WeatherError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center h-[180px]">
      <p className="text-[var(--error)] text-sm mb-3">{message}</p>
      <button
        onClick={onRetry}
        className="text-xs text-[var(--aurora-mid)] hover:text-[var(--aurora-start)] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
