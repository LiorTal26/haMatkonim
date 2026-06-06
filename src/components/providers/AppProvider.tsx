'use client';

// ============================================
// Recipe Book — i18n & Theme Context
// ============================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, Translations } from '@/types';
import { translations } from '@/lib/i18n';

interface AppContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  dir: 'rtl' | 'ltr';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('he');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Load preferences from localStorage
    const savedLocale = localStorage.getItem('recipe-book-locale') as Locale;
    const savedTheme = localStorage.getItem('recipe-book-theme') as 'dark' | 'light';
    if (savedLocale) setLocale(savedLocale);
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('recipe-book-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('dir', locale === 'he' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', locale);
    localStorage.setItem('recipe-book-locale', locale);
  }, [locale]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value: AppContextType = {
    locale,
    setLocale,
    t: translations[locale],
    theme,
    setTheme,
    toggleTheme,
    dir: locale === 'he' ? 'rtl' : 'ltr',
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
