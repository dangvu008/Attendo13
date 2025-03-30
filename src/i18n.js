import * as Localization from "expo-localization";
import i18n from "i18n-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translations from "./translations";

i18n.translations = translations;
i18n.fallbacks = true;
i18n.defaultLocale = "en";

// Initially set the locale to the device locale
i18n.locale = Localization.locale.split("-")[0]; // Use only the language code part

export const loadStoredLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem("userLanguage");
    if (storedLanguage) {
      i18n.locale = storedLanguage;
      return storedLanguage;
    }
  } catch (error) {
    console.error("Failed to load language from storage", error);
  }
  return i18n.locale;
};

// Add a safety method to ensure translations exist
export const ensureTranslation = (key, options = {}) => {
  try {
    return i18n.t(key, { ...options, defaultValue: key });
  } catch (error) {
    console.error(`Translation error for key ${key}:`, error);
    return key;
  }
};

export default i18n;
