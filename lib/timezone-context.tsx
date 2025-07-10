'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface TimezoneContextType {
  timezone: string;
  setTimezone: (timezone: string) => void;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

export const TimezoneProvider = ({ children }: { children: ReactNode }) => {
  const [timezone, setTimezone] = useState<string>('');

  useEffect(() => {
    // Load timezone from localStorage or default to browser timezone
    const savedTimezone = localStorage.getItem('appTimezone');
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(savedTimezone || browserTimezone);
  }, []);

  useEffect(() => {
    // Save timezone to localStorage whenever it changes
    if (timezone) {
      localStorage.setItem('appTimezone', timezone);
    }
  }, [timezone]);

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};
