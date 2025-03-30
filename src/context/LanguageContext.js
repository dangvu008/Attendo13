import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import translations from "../translations";
import { EventRegister } from "react-native-event-listeners";

// Tạo instance mới của I18n
const i18n = new I18n(translations);

export const LanguageContext = createContext({
  locale: "en",
  setLocale: () => {},
  translations: {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(
    Localization.locale.split("-")[0] || "en"
  );

  useEffect(() => {
    // Cấu hình i18n
    i18n.locale = locale;
    i18n.fallbacks = true;
    i18n.defaultLocale = "en";

    // Tải ngôn ngữ đã lưu
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("userLanguage");
        if (savedLanguage) {
          setLocale(savedLanguage);
          i18n.locale = savedLanguage;
        }
      } catch (error) {
        console.error("Error loading language preference:", error);
      }
    };

    loadSavedLanguage();
  }, []);

  const t = (key, options = {}) => {
    try {
      return i18n.t(key, { ...options, defaultValue: key });
    } catch (error) {
      console.error(`Translation error for key ${key}:`, error);
      return key;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale: async (newLocale) => {
          try {
            await AsyncStorage.setItem("userLanguage", newLocale);
            i18n.locale = newLocale;
            setLocale(newLocale);
          } catch (error) {
            console.error("Error setting language:", error);
          }
        },
        translations,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
