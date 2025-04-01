import React, { useContext } from "react";
import { Text } from "react-native";
import { LocalizationContext } from "../context/LocalizationContext";

const TextWrapper = ({ textKey, fallback, style, ...props }) => {
  const { t, locale, getDirectTranslation } = useContext(LocalizationContext);

  const safeTranslate = (key, fallbackText) => {
    if (!key) return fallbackText || "";

    // Thử các phương pháp dịch khác nhau
    try {
      // 1. Kiểm tra trực tiếp từ đối tượng translations
      const directTranslation = getDirectTranslation(key);
      if (directTranslation !== key) {
        return directTranslation;
      }

      // 2. Sử dụng t()
      const translated = t(key);
      if (translated !== key) {
        return translated;
      }

      // 3. Thử với các biến thể khác của key
      if (key.includes("_")) {
        // Chuyển snake_case sang camelCase
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        const camelTranslation = getDirectTranslation(camelKey);
        if (camelTranslation !== camelKey) {
          return camelTranslation;
        }
      }
    } catch (error) {
      console.warn(`Translation error for ${key}:`, error);
    }

    return fallbackText || key;
  };

  return (
    <Text style={style} {...props}>
      {safeTranslate(textKey, fallback)}
    </Text>
  );
};

export default TextWrapper;
