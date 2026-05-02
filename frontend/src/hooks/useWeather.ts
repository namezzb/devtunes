import { useState, useEffect, useCallback, useRef } from 'react';

export interface WeatherData {
  temperature: number;
  condition: WeatherCondition;
  location: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  feelsLike: number;
}

export type WeatherCondition =
  | 'clear'
  | 'clouds'
  | 'rain'
  | 'drizzle'
  | 'thunderstorm'
  | 'snow'
  | 'mist'
  | 'fog'
  | 'haze';

const MOCK_WEATHER: WeatherData = {
  temperature: 22,
  condition: 'clear',
  location: 'San Francisco',
  humidity: 65,
  windSpeed: 12,
  icon: '☀️',
  feelsLike: 21,
};

const WEATHER_ICONS: Record<WeatherCondition, string> = {
  clear: '☀️',
  clouds: '☁️',
  rain: '🌧️',
  drizzle: '🌦️',
  thunderstorm: '⛈️',
  snow: '❄️',
  mist: '🌫️',
  fog: '🌫️',
  haze: '🌫️',
};

const WEATHER_DESCRIPTIONS: Record<WeatherCondition, string> = {
  clear: 'Clear Sky',
  clouds: 'Cloudy',
  rain: 'Rainy',
  drizzle: 'Drizzle',
  thunderstorm: 'Thunderstorm',
  snow: 'Snowy',
  mist: 'Misty',
  fog: 'Foggy',
  haze: 'Hazy',
};

interface UseWeatherOptions {
  apiKey?: string;
  latitude?: number;
  longitude?: number;
  useMock?: boolean;
}

interface UseWeatherReturn {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  getDescription: () => string;
}

export function useWeather(options: UseWeatherOptions = {}): UseWeatherReturn {
  const { apiKey, latitude, longitude, useMock = true } = options;
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchWeather = useCallback(async () => {
    if (useMock || !apiKey) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (isMountedRef.current) {
        setWeather(MOCK_WEATHER);
        setLoading(false);
      }
      return;
    }

    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      const lat = latitude ?? 37.7749;
      const lon = longitude ?? -122.4194;

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      const condition = mapWeatherCondition(data.weather[0]?.main?.toLowerCase() ?? 'clear');

      if (isMountedRef.current) {
        setWeather({
          temperature: Math.round(data.main.temp),
          condition,
          location: data.name,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6),
          icon: WEATHER_ICONS[condition],
          feelsLike: Math.round(data.main.feels_like),
        });
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setWeather(MOCK_WEATHER);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiKey, latitude, longitude, useMock]);

  useEffect(() => {
    isMountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWeather();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchWeather]);

  const getDescription = () => {
    if (!weather) return '';
    return WEATHER_DESCRIPTIONS[weather.condition];
  };

  return { weather, loading, error, refresh: fetchWeather, getDescription };
}

function mapWeatherCondition(condition: string): WeatherCondition {
  const conditionMap: Record<string, WeatherCondition> = {
    clear: 'clear',
    clouds: 'clouds',
    rain: 'rain',
    drizzle: 'drizzle',
    thunderstorm: 'thunderstorm',
    snow: 'snow',
    mist: 'mist',
    fog: 'fog',
    haze: 'haze',
  };

  return conditionMap[condition] ?? 'clear';
}
