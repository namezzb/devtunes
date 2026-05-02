import { motion } from 'framer-motion';
import { ClockWidget } from './ClockWidget';
import { WeatherWidget } from './WeatherWidget';
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
  weatherApiKey,
  latitude,
  longitude,
  useMockWeather = true,
  showForecast = true,
  className = '',
}: ClockWeatherPanelProps) {
  return (
    <motion.div
      className={`flex flex-col gap-4 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ClockWidget
          format={clockFormat}
          showSeconds={showSeconds}
          showDate={showDate}
        />
        <WeatherWidget
          apiKey={weatherApiKey}
          latitude={latitude}
          longitude={longitude}
          useMock={useMockWeather}
        />
      </div>
      {showForecast && <WeatherForecast />}
    </motion.div>
  );
}
