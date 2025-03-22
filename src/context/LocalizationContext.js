import React, { createContext, useState, useContext, useEffect } from "react";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { loadStoredLanguage } from "../i18n";

const LocalizationContext = createContext();

export const useLocalization = () => useContext(LocalizationContext);

export const LocalizationProvider = ({ children }) => {
  const [locale, setLocale] = useState(i18n.locale || "vi");
  const [isReady, setIsReady] = useState(false);

  // Load locale preference from storage
  useEffect(() => {
    const loadLocalePreference = async () => {
      try {
        const storedLocale = await AsyncStorage.getItem("appLanguage");
        if (storedLocale !== null) {
          setLocale(storedLocale);
          await setAppLanguage(storedLocale);
        } else {
          // Use device locale or default to Vietnamese if not available
          const deviceLocale = Localization.locale.split("-")[0];
          const newLocale = deviceLocale === "en" ? "en" : "vi";
          setLocale(newLocale);
          await setAppLanguage(newLocale);
        }
      } catch (error) {
        console.error("Error loading locale preference:", error);
        setLocale("vi"); // Default to Vietnamese if error
        await setAppLanguage("vi");
      } finally {
        setIsReady(true);
      }
    };

    loadLocalePreference();
  }, []);

  // Save locale preference to storage when it changes
  useEffect(() => {
    const updateLocale = async () => {
      if (isReady) {
        await AsyncStorage.setItem("appLanguage", locale);
        await setAppLanguage(locale);
      }
    };
    updateLocale();
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
