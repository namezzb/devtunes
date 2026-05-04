import { useState, useEffect } from 'react';

interface ClockState {
  hours: string;
  minutes: string;
  seconds: string;
  date: string;
  dayOfWeek: string;
  period: 'AM' | 'PM';
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function useClock(format: '12h' | '24h' = '24h'): ClockState {
  const [time, setTime] = useState<ClockState>(() => {
    const now = new Date();
    return formatTime(now, format);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(formatTime(now, format));
    }, 1000);

    return () => clearInterval(interval);
  }, [format]);

  return time;
}

function formatTime(date: Date, format: '12h' | '24h'): ClockState {
  let hours = date.getHours();
  const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';

  if (format === '12h') {
    hours = hours % 12 || 12;
  }

  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: date.getMinutes().toString().padStart(2, '0'),
    seconds: date.getSeconds().toString().padStart(2, '0'),
    date: `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
    dayOfWeek: DAYS_OF_WEEK[date.getDay()],
    period,
  };
}
