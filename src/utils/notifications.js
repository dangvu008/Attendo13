import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Cấu hình mặc định cho thông báo
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Kiểm tra và yêu cầu quyền thông báo
export const checkNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return false;
  }
  return true;
};

// Lưu cài đặt thông báo vào AsyncStorage
export const saveNotificationSettings = async (
  soundEnabled,
  vibrationEnabled
) => {
  try {
    await AsyncStorage.setItem(
      "notification_sound",
      JSON.stringify(soundEnabled)
    );
    await AsyncStorage.setItem("vibration", JSON.stringify(vibrationEnabled));
    return true;
  } catch (error) {
    console.error("Error saving notification settings:", error);
    return false;
  }
};

// Lấy cài đặt thông báo từ AsyncStorage
export const getNotificationSettings = async () => {
  try {
    const soundEnabled = await AsyncStorage.getItem("notification_sound");
    const vibrationEnabled = await AsyncStorage.getItem("vibration");
    return {
      soundEnabled: soundEnabled ? JSON.parse(soundEnabled) : true,
      vibrationEnabled: vibrationEnabled ? JSON.parse(vibrationEnabled) : true,
    };
  } catch (error) {
    console.error("Error getting notification settings:", error);
    return { soundEnabled: true, vibrationEnabled: true };
  }
};

// Lên lịch thông báo với âm thanh và rung tùy chỉnh
export const scheduleNotification = async (title, body, trigger) => {
  const settings = await getNotificationSettings();

  const notificationContent = {
    title,
    body,
    sound: settings.soundEnabled,
    vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : null,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    data: { data: "goes here" },
  };

  try {
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
    });
    return true;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return false;
  }
};

// Hủy tất cả thông báo đã lên lịch
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    console.error("Error canceling notifications:", error);
    return false;
  }
};
