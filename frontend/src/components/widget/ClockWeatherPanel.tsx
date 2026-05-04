import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompactClockWeather } from './CompactClockWeather';
import { WeatherForecast } from './WeatherForecast';

interface ClockWeatherPanelProps {
  clockFormat?: '12h' | '24h';
  showSeconds?: boolean;
  showDate?: boolean;
  weatherApiKey?: string;
  latitude?: number;
  longitude?: number;
  useMockWeather?: boolean;
  showForecast?: boolean;
  className?: string;
}

export function ClockWeatherPanel({
  clockFormat = '24h',
  showSeconds = true,
  showDate = true,
  weatherApiKey: _weatherApiKey,
  latitude: _latitude,
  longitude: _longitude,
  useMockWeather = true,
  showForecast = true,
  className = '',
}: ClockWeatherPanelProps) {
  const [forecastOpen, setForecastOpen] = useState(false);

  return (
    <motion.div
      className={`flex flex-col gap-4 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <CompactClockWeather
        format={clockFormat}
        showSeconds={showSeconds}
        showDate={showDate}
        useMock={useMockWeather}
      />

      {showForecast && (
        <div className="flex flex-col">
          <div className="flex justify-end">
            <button
              onClick={() => setForecastOpen((prev) => !prev)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors flex items-center gap-1 px-2 py-1"
            >
              {forecastOpen ? 'Hide Forecast' : '5-Day Forecast'}
              <motion.span
                animate={{ rotate: forecastOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="inline-block"
              >
                ▼
              </motion.span>
            </button>
          </div>
          <AnimatePresence>
            {forecastOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-2">
                  <WeatherForecast />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
