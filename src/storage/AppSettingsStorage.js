import AsyncStorage from "@react-native-async-storage/async-storage";

const APP_SETTINGS_KEY = "app_settings";

// Cấu trúc mặc định cho cài đặt ứng dụng
const DEFAULT_APP_SETTINGS = {
  language: "vi",
  notification_sound: true,
  vibration: true,
  dark_mode: false,
  multi_purpose_mode: true, // Mặc định bật chế độ nút đa năng
};

// Tải cài đặt ứng dụng từ AsyncStorage
export const loadAppSettings = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem(APP_SETTINGS_KEY);
    if (settingsJson === null) {
      // Nếu chưa có cài đặt, trả về giá trị mặc định
      return DEFAULT_APP_SETTINGS;
    }
    return JSON.parse(settingsJson);
  } catch (error) {
    console.error("Lỗi khi tải cài đặt ứng dụng:", error);
    return DEFAULT_APP_SETTINGS; // Trả về mặc định nếu có lỗi
  }
};

// Lưu cài đặt ứng dụng vào AsyncStorage
export const saveAppSettings = async (settings) => {
  try {
    // Đảm bảo cài đặt mới có đầy đủ các trường
    const updatedSettings = {
      ...DEFAULT_APP_SETTINGS,
      ...settings,
    };

    await AsyncStorage.setItem(
      APP_SETTINGS_KEY,
      JSON.stringify(updatedSettings)
    );
    return true;
  } catch (error) {
    console.error("Lỗi khi lưu cài đặt ứng dụng:", error);
    return false;
  }
};

// Cập nhật một trường cụ thể trong cài đặt ứng dụng
export const updateAppSetting = async (key, value) => {
  try {
    const currentSettings = await loadAppSettings();
    const updatedSettings = {
      ...currentSettings,
      [key]: value,
    };

    return await saveAppSettings(updatedSettings);
  } catch (error) {
    console.error(`Lỗi khi cập nhật cài đặt ${key}:`, error);
    return false;
  }
};

// Lấy giá trị của một cài đặt cụ thể
export const getAppSetting = async (key) => {
  try {
    const settings = await loadAppSettings();
    return settings[key];
  } catch (error) {
    console.error(`Lỗi khi lấy cài đặt ${key}:`, error);
    return DEFAULT_APP_SETTINGS[key]; // Trả về giá trị mặc định nếu có lỗi
  }
};

// Lấy trạng thái chế độ nút đa năng
export const getMultiPurposeMode = async () => {
  return await getAppSetting("multi_purpose_mode");
};

// Cập nhật trạng thái chế độ nút đa năng
export const setMultiPurposeMode = async (enabled) => {
  return await updateAppSetting("multi_purpose_mode", enabled);
};
