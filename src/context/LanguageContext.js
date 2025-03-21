import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import { EventRegister } from 'react-native-event-listeners';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(i18n.locale || 'en');

  // Function to set language
  const setLanguage = async (languageCode) => {
    try {
      // Update state
      setLanguageState(languageCode);
      
      // Update i18n locale
      i18n.locale = languageCode;
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('userLanguage', languageCode);
      
      // Emit event for other components
      EventRegister.emit('languageChanged', languageCode);
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  // Load language from storage on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem('userLanguage');
        if (storedLanguage) {
          setLanguageState(storedLanguage);
          i18n.locale = storedLanguage;
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };

    loadLanguage();

    // Listen for language changes from other components
    const listener = EventRegister.addEventListener('languageChanged', (languageCode) => {
      setLanguageState(languageCode);
      i18n.locale = languageCode;
    });

    return () => {
      EventRegister.removeEventListener(listener);
    };
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);