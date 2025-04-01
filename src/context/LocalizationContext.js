import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18n } from "i18n-js";
import { I18nManager } from "react-native";
import translations from "../translations";

console.log("==== DEBUG TRANSLATIONS ====");
console.log("translations type:", typeof translations);
console.log("translations keys:", Object.keys(translations));
if (translations.en)
  console.log("en keys:", Object.keys(translations.en).slice(0, 5));
if (translations.vi)
  console.log("vi keys:", Object.keys(translations.vi).slice(0, 5));
console.log("============================");

export const LocalizationContext = createContext({
  locale: "vi",
  setLocale: () => {},
  t: (key) => key,
});

export const useLocalization = () => useContext(LocalizationContext);

export const LocalizationProvider = ({ children }) => {
  const [locale, setLocale] = useState("vi");
  const [isReady, setIsReady] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const [i18n] = useState(() => new I18n(translations));

  useEffect(() => {
    // Kiểm tra cấu trúc translations
    if (!translations || typeof translations !== "object") {
      console.error("Invalid translations object:", translations);
      return;
    }

    // Kiểm tra các ngôn ngữ có tồn tại không
    if (!translations.vi || !translations.en) {
      console.error(
        "Missing language objects in translations:",
        Object.keys(translations)
      );

      // Tạo đối tượng rỗng nếu không tồn tại
      if (!translations.vi) translations.vi = {};
      if (!translations.en) translations.en = {};
    }

    // Cấu hình i18n
    i18n.translations = translations;
    i18n.locale = locale;
    i18n.fallbacks = true;
    i18n.defaultLocale = "vi";

    console.log(
      "i18n configured with translations:",
      Object.keys(translations)
    );

    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("userLanguage");
        if (savedLanguage) {
          setLocale(savedLanguage);
          i18n.locale = savedLanguage;
          console.log(`Đã tải ngôn ngữ: ${savedLanguage}`);
        }
      } catch (error) {
        console.error("Error loading language preference:", error);
      }
      setIsReady(true);
    };

    loadSavedLanguage();
  }, []);

  const setAppLanguage = async (languageCode) => {
    try {
      if (!translations[languageCode]) {
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

  const changeLocale = useCallback(async (newLocale) => {
    try {
      if (!translations[newLocale]) {
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
      if (!key) return "";

      // Xử lý khi key có tiền tố như "vi.goToWork"
      let cleanKey = key;
      if (key.includes(".")) {
        const parts = key.split(".");
        // Nếu phần đầu là mã ngôn ngữ (vi, en) thì lấy phần sau
        if (parts.length > 1 && (parts[0] === "vi" || parts[0] === "en")) {
          cleanKey = parts[1];
        }
      }

      // Thử lấy bản dịch từ i18n
      const translated = i18n.translate(cleanKey, {
        ...options,
        defaultValue: cleanKey,
      });

      // Kiểm tra kết quả trả về
      if (
        translated === cleanKey &&
        translations[locale] &&
        translations[locale][cleanKey]
      ) {
        return translations[locale][cleanKey];
      }

      return translated || cleanKey;
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);

      // Fallback: Tìm trực tiếp trong đối tượng translations
      try {
        if (translations[locale] && translations[locale][key]) {
          return translations[locale][key];
        }
      } catch (e) {
        // Không làm gì
      }

      return key;
    }
  };

  const getDirectTranslation = (key) => {
    if (!key) return "";

    try {
      if (translations[locale] && translations[locale][key]) {
        return translations[locale][key];
      }

      // Fallback to English
      if (translations.en && translations.en[key]) {
        return translations.en[key];
      }
    } catch (error) {
      console.warn(`Direct translation error for key "${key}":`, error);
    }

    return key;
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
        getDirectTranslation,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};
