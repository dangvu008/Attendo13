import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { loadStoredLanguage } from "../i18n";
import { I18nManager } from "react-native";
import translations from "../translations";

const LocalizationContext = createContext();

export const useLocalization = () => useContext(LocalizationContext);

export const LocalizationProvider = ({ children }) => {
  const [locale, setLocale] = useState(Localization.locale);
  const [isReady, setIsReady] = useState(false);
  const [forceRender, setForceRender] = useState(0);

  i18n.translations = translations;
  i18n.locale = locale;
  i18n.fallbacks = true;

  // Thêm hàm setAppLanguage
  const setAppLanguage = async (languageCode) => {
    try {
      await AsyncStorage.setItem("userLanguage", languageCode);
      setLocale(languageCode);
      i18n.locale = languageCode;
      console.log(`Đã đặt ngôn ngữ ứng dụng thành: ${languageCode}`);
    } catch (error) {
      console.error("Lỗi khi cài đặt ngôn ngữ:", error);
    }
  };

  // Hàm để lấy ngôn ngữ đã lưu
  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem("userLanguage");
      if (savedLanguage) {
        setLocale(savedLanguage);
        i18n.locale = savedLanguage;
        console.log(`Đã tải ngôn ngữ: ${savedLanguage}`);
      }
    } catch (error) {
      console.error("Error loading locale preference:", error);
    }
  };

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const changeLocale = useCallback(async (newLocale) => {
    try {
      await AsyncStorage.setItem("appLanguage", newLocale);
      i18n.locale = newLocale;
      setLocale(newLocale);
      setForceRender((prev) => prev + 1); // Force re-render of all components
    } catch (error) {
      console.error("Error changing locale:", error);
    }
  }, []);

  // Save locale preference to storage when it changes
  useEffect(() => {
    if (isReady && locale) {
      i18n.locale = locale;
      setForceRender((prev) => prev + 1);
    }
  }, [locale, isReady]);

  // Translate function using the i18n.js
  const t = (key, options = {}) => {
    return i18n.t(key, options);
  };

  return (
    <LocalizationContext.Provider
      value={{
        locale,
        setLocale,
        t,
        isReady,
        setAppLanguage,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};
