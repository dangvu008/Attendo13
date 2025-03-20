import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { loadStoredLanguage } from '../i18n';

const LocalizationContext = createContext();

export const useLocalization = () => useContext(LocalizationContext);

export const LocalizationProvider = ({ children }) => {
  const [locale, setLocale] = useState('vi');
  const [isReady, setIsReady] = useState(false);

  // Load locale preference from storage
  useEffect(() => {
    const loadLocalePreference = async () => {
      try {
        const storedLocale = await AsyncStorage.getItem('userLanguage');
        if (storedLocale !== null) {
          setLocale(storedLocale);
          i18n.locale = storedLocale;
        } else {
          // Use device locale or default to Vietnamese if not available
          const deviceLocale = Localization.locale.split('-')[0];
          const newLocale = deviceLocale === 'en' ? 'en' : 'vi';
          setLocale(newLocale);
          i18n.locale = newLocale;
        }
      } catch (error) {
        console.error('Error loading locale preference:', error);
        setLocale('vi'); // Default to Vietnamese if error
        i18n.locale = 'vi';
      } finally {
        setIsReady(true);
      }
    };

    loadLocalePreference();
  }, []);

  // Save locale preference to storage when it changes
  useEffect(() => {
    if (isReady) {
      AsyncStorage.setItem('userLanguage', locale);
      i18n.locale = locale;
    }
  }, [locale, isReady]);

  // Change locale function
  const changeLocale = (newLocale) => {
    setLocale(newLocale);
  };

  // Translate function using the i18n.js
  const t = (key, options = {}) => {
    return i18n.t(key, options);
  };

  return (
    <LocalizationContext.Provider value={{ locale, changeLocale, t, isReady }}>
      {children}
    </LocalizationContext.Provider>
  );
};
