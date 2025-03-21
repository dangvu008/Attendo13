import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";
import { vi, en } from "./localization/translations";

// Create a new i18n instance
const i18n = new I18n();

// Set translations
i18n.translations = {
  vi,
  en,
};

// Set the default locale
i18n.locale = Localization.locale;

// When a value is missing from a language it'll fall back to another language with the key present
i18n.enableFallback = true;

// Load and set stored language
export const loadStoredLanguage = async () => {
  const language = await getStoredLanguage();
  i18n.locale = language;
  return language;
};

// Get stored language
export const getStoredLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem("userLanguage");
    if (storedLanguage) {
      i18n.locale = storedLanguage;
      return storedLanguage;
    }
    return i18n.locale;
  } catch (error) {
    console.error("Error loading stored language:", error);
    return i18n.locale;
  }
};

// Set app language and store it
export const setAppLanguage = async (language) => {
  try {
    await AsyncStorage.setItem("userLanguage", language);
    i18n.locale = language;
    return true;
  } catch (error) {
    console.error("Error setting app language:", error);
    return false;
  }
};

export default i18n;
