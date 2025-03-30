import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18n-js";
import { I18nManager } from "react-native";
import translations from "../translations";

const LocalizationContext = createContext();

export const useLocalization = () => useContext(LocalizationContext);

export const LocalizationProvider = ({ children }) => {
  const [locale, setLocale] = useState(Localization.locale);
  const [isReady, setIsReady] = useState(false);
  const [forceRender, setForceRender] = useState(0);

  useEffect(() => {
    if (translations) {
      i18n.translations = translations;
      console.log("Loaded translations for:", Object.keys(translations));

      if (!translations.vi) {
        console.warn("Missing Vietnamese translations! Adding empty object.");
        i18n.translations.vi = i18n.translations.vi || {};
      }

      i18n.locale = locale;
      i18n.fallbacks = true;
      i18n.defaultLocale = "en";
      setIsReady(true);
    } else {
      console.error("Translations object is undefined or invalid");
    }
  }, []);

  const setAppLanguage = async (languageCode) => {
    try {
      if (!i18n.translations[languageCode]) {
        console.warn(
          `Missing translations for ${languageCode}, using default language`
        );
        languageCode = "en";
      }

      await AsyncStorage.setItem("userLanguage", languageCode);
      setLocale(languageCode);
      i18n.locale = languageCode;
      console.log(`Đã đặt ngôn ngữ ứng dụng thành: ${languageCode}`);
      setForceRender((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi khi cài đặt ngôn ngữ:", error);
    }
  };

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem("userLanguage");
      if (savedLanguage) {
        if (i18n.translations[savedLanguage]) {
          setLocale(savedLanguage);
          i18n.locale = savedLanguage;
          console.log(`Đã tải ngôn ngữ: ${savedLanguage}`);
        } else {
          console.warn(
            `Saved language ${savedLanguage} not found in translations, using default`
          );
          setLocale("en");
          i18n.locale = "en";
        }
      }
      setIsReady(true);
    } catch (error) {
      console.error("Error loading locale preference:", error);
      setIsReady(true);
    }
  };

  useEffect(() => {
    if (i18n.translations) {
      loadSavedLanguage();
    }
  }, []);

  const changeLocale = useCallback(async (newLocale) => {
    try {
      if (!i18n.translations[newLocale]) {
        console.warn(
          `Missing translations for ${newLocale}, using default language`
        );
        newLocale = "en";
      }

      await AsyncStorage.setItem("appLanguage", newLocale);
      i18n.locale = newLocale;
      setLocale(newLocale);
      setForceRender((prev) => prev + 1);
    } catch (error) {
      console.error("Error changing locale:", error);
    }
  }, []);

  const t = (key, options = {}) => {
    try {
      const translation = i18n.t(key, { ...options, defaultValue: key });
      return translation || key;
    } catch (error) {
      console.error(`Translation error for key ${key}:`, error);
      return key;
    }
  };

  return (
    <LocalizationContext.Provider
      value={{
        locale,
        setLocale,
        t,
        isReady,
        setAppLanguage,
        changeLocale,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};
