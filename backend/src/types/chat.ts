export interface ChatRequestContext {
  weather: {
    temperature: number;
    condition: string;
    feelsLike: number;
    humidity: number;
    location: string;
  } | null;
  clock: {
    hours: string;
    minutes: string;
    dayOfWeek: string;
    date: string;
    period: 'AM' | 'PM';
  };
  timeCategory: string;
}
