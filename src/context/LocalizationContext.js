import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { vi, en } from '../localization/translations';

const LocalizationContext = createContext();

export const useLocalization = () => useContext(LocalizationContext);

export const LocalizationProvider = ({ children }) => {
  const [locale, setLocale] = useState('vi');
  const [isReady, setIsReady] = useState(false);

  // Initialize i18n
  const i18n = new I18n({
    vi,
    en
  });

  // Load locale preference from storage
  useEffect(() => {
    const loadLocalePreference = async () => {
      try {
        const storedLocale = await AsyncStorage.getItem('locale');
        if (storedLocale !== null) {
          setLocale(storedLocale);
        } else {
          // Use device locale or default to Vietnamese if not available
          const deviceLocale = Localization.locale.split('-')[0];
          setLocale(deviceLocale === 'en' ? 'en' : 'vi');
        }
      } catch (error) {
        console.error('Error loading locale preference:', error);
        setLocale('vi'); // Default to Vietnamese if error
      } finally {
        setIsReady(true);
      }
    };

    loadLocalePreference();
  }, []);

  // Save locale preference to storage when it changes
  useEffect(() => {
    if (isReady) {
      AsyncStorage.setItem('locale', locale);
    }
  }, [locale, isReady]);

  // Set i18n locale
  i18n.locale = locale;
  i18n.enableFallback = true;

  // Change locale function
  const changeLocale = (newLocale) => {
    setLocale(newLocale);
  };

  // Translate function
  const t = (key, options = {}) => {
    return i18n.t(key, options);
  };

  return (
    <LocalizationContext.Provider value={{ locale, changeLocale, t, isReady }}>
      {children}
    </LocalizationContext.Provider>
  );
};
