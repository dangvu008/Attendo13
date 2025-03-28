import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  format,
  parseISO,
  addMinutes,
  setHours,
  setMinutes,
  parse,
  isBefore,
} from "date-fns";

// Configure notification behavior for the app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Key for storing notification settings
const NOTIFICATION_SETTINGS_KEY = "notification_settings";
const SCHEDULED_NOTIFICATIONS_KEY = "scheduled_notifications";

// Initialize notification permissions
export const initializeNotifications = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("shift-reminders", {
      name: "Nhắc nhở ca làm việc",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4285F4",
      sound: true,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
};

// Save notification settings
export const saveNotificationSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify(settings)
    );
    return true;
  } catch (error) {
    console.error("Error saving notification settings:", error);
    return false;
  }
};

// Load notification settings
export const loadNotificationSettings = async () => {
  try {
    const settingsJson = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return settingsJson
      ? JSON.parse(settingsJson)
      : {
          enabled: true,
          sound: true,
          vibration: true,
          reminderType: "none", // none, before_5_min, before_15_min, before_30_min
        };
  } catch (error) {
    console.error("Error loading notification settings:", error);
    return {
      enabled: true,
      sound: true,
      vibration: true,
      reminderType: "none",
    };
  }
};

// Schedule a notification
export const scheduleNotification = async ({
  id,
  title,
  message,
  date,
  sound = true,
  vibrate = true,
  data = {},
  repeat = false,
  repeatType = null,
  repeatInterval = null,
}) => {
  try {
    // Tạo trigger dựa vào thời gian và cài đặt lặp lại
    let trigger;
    if (repeat && repeatType && repeatInterval) {
      trigger = {
        seconds: repeatInterval,
        repeats: true,
      };
    } else {
      trigger = new Date(date);
      // Đảm bảo trigger trong tương lai
      if (trigger <= new Date()) {
        console.log("Notification date is in the past, not scheduling");
        return null;
      }
    }

    // Hủy thông báo cũ nếu có
    await cancelNotification(id);

    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        data: { ...data, id },
        sound,
        vibrationPattern: vibrate ? [0, 250, 250, 250] : null,
      },
      trigger,
      identifier: id,
    });

    // Lưu thông tin thông báo đã lên lịch
    await saveScheduledNotification(id, {
      id,
      title,
      message,
      date: date.toISOString(),
      scheduled: true,
    });

    return id;
  } catch (error) {
    console.error("Lỗi khi lên lịch thông báo:", error);
    return null;
  }
};

// Save a scheduled notification to AsyncStorage
export const saveScheduledNotification = async (id, notificationInfo) => {
  try {
    // Get current scheduled notifications
    const storedNotifications = await getScheduledNotifications();

    // Add the new notification
    storedNotifications[id] = notificationInfo;

    // Save back to AsyncStorage
    await AsyncStorage.setItem(
      SCHEDULED_NOTIFICATIONS_KEY,
      JSON.stringify(storedNotifications)
    );

    return true;
  } catch (error) {
    console.error("Error saving scheduled notification:", error);
    return false;
  }
};

// Get all scheduled notifications from AsyncStorage
export const getScheduledNotifications = async () => {
  try {
    const notificationsJson = await AsyncStorage.getItem(
      SCHEDULED_NOTIFICATIONS_KEY
    );
    return notificationsJson ? JSON.parse(notificationsJson) : {};
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    return {};
  }
};

// Cancel a specific notification
export const cancelNotification = async (notificationId) => {
  try {
    if (!notificationId) return false;

    // Cancel the notification with Expo
    await Notifications.cancelScheduledNotificationAsync(notificationId);

    // Remove from our stored notifications
    const storedNotifications = await getScheduledNotifications();
    if (storedNotifications[notificationId]) {
      delete storedNotifications[notificationId];

      // Save updated notifications back to AsyncStorage
      await AsyncStorage.setItem(
        SCHEDULED_NOTIFICATIONS_KEY,
        JSON.stringify(storedNotifications)
      );
    }

    return true;
  } catch (error) {
    console.error("Error canceling notification:", error);
    return false;
  }
};

// Cancel all shift-related notifications
export const cancelAllShiftNotifications = async (shiftId = null) => {
  try {
    // Get all scheduled notifications
    const storedNotifications = await getScheduledNotifications();
    let notificationsToCancel = [];

    // If a specific shift ID is provided, only cancel for that shift
    if (shiftId) {
      // Find notifications for this shift
      Object.entries(storedNotifications).forEach(([id, info]) => {
        if (info.shiftId === shiftId) {
          notificationsToCancel.push(id);
        }
      });
    } else {
      // Cancel all shift notifications
      notificationsToCancel = Object.keys(storedNotifications);
    }

    // Cancel each notification
    for (const id of notificationsToCancel) {
      await Notifications.cancelScheduledNotificationAsync(id);
      delete storedNotifications[id];
    }

    // Save updated notifications back to AsyncStorage
    await AsyncStorage.setItem(
      SCHEDULED_NOTIFICATIONS_KEY,
      JSON.stringify(storedNotifications)
    );

    return true;
  } catch (error) {
    console.error("Error canceling shift notifications:", error);
    return false;
  }
};

// Schedule departure reminder (before "go to work")
export const scheduleDepartureReminder = async (departureTime, shiftInfo) => {
  try {
    // Ensure departureTime is valid
    if (!departureTime) {
      console.log("Invalid departure time");
      return null;
    }

    // Get notification settings
    const settings = await loadNotificationSettings();
    if (!settings.enabled) {
      console.log("Notifications are disabled");
      return null;
    }

    // Parse the departure time (format: HH:MM)
    const [hours, minutes] = departureTime
      .split(":")
      .map((num) => parseInt(num, 10));

    // Create departure time for today
    const today = new Date();
    const departureDate = new Date(today);
    departureDate.setHours(hours, minutes, 0, 0);

    // Only schedule if the time is in the future
    if (departureDate <= new Date()) {
      console.log("Departure time is in the past, not scheduling");
      return null;
    }

    // Schedule the notification
    const notificationId = `departure-reminder-${
      today.toISOString().split("T")[0]
    }`;
    return await scheduleNotification({
      id: notificationId,
      title: "Nhắc nhở xuất phát",
      message: `Đã đến giờ xuất phát cho ca làm việc ${
        shiftInfo ? shiftInfo.name : ""
      }`,
      date: departureDate,
      sound: settings.sound,
      vibrate: settings.vibration,
      data: {
        type: "departure_reminder",
        action: "go_work",
        shiftInfo,
      },
    });
  } catch (error) {
    console.error("Error scheduling departure reminder:", error);
    return null;
  }
};

// Schedule start time reminder (for check-in)
export const scheduleStartTimeReminder = async (startTime, shiftInfo) => {
  try {
    // Ensure startTime is valid
    if (!startTime) {
      console.log("Invalid start time");
      return null;
    }

    // Get notification settings
    const settings = await loadNotificationSettings();
    if (!settings.enabled) {
      console.log("Notifications are disabled");
      return null;
    }

    // Parse the start time (format: HH:MM)
    const [hours, minutes] = startTime
      .split(":")
      .map((num) => parseInt(num, 10));

    // Create start time for today
    const today = new Date();
    const startDate = new Date(today);
    startDate.setHours(hours, minutes, 0, 0);

    // Calculate reminder time (10 minutes before start time)
    const reminderDate = new Date(startDate);
    reminderDate.setMinutes(reminderDate.getMinutes() - 10);

    // Only schedule if the time is in the future
    if (reminderDate <= new Date()) {
      console.log("Check-in reminder time is in the past, not scheduling");
      return null;
    }

    // Schedule the notification
    const notificationId = `checkin-reminder-${
      today.toISOString().split("T")[0]
    }`;
    return await scheduleNotification({
      id: notificationId,
      title: "Nhắc nhở chấm công vào",
      message: `Còn 10 phút nữa đến giờ chấm công vào cho ca ${
        shiftInfo ? shiftInfo.name : ""
      }`,
      date: reminderDate,
      sound: settings.sound,
      vibrate: settings.vibration,
      data: {
        type: "check_in_reminder",
        action: "check_in",
        shiftInfo,
      },
    });
  } catch (error) {
    console.error("Error scheduling start time reminder:", error);
    return null;
  }
};

// Schedule check-out reminder
export const scheduleOfficeEndReminder = async (officeEndTime, shiftInfo) => {
  try {
    // Ensure officeEndTime is valid
    if (!officeEndTime) {
      console.log("Invalid office end time");
      return null;
    }

    // Get notification settings
    const settings = await loadNotificationSettings();
    if (!settings.enabled) {
      console.log("Notifications are disabled");
      return null;
    }

    // Parse the office end time (format: HH:MM)
    const [hours, minutes] = officeEndTime
      .split(":")
      .map((num) => parseInt(num, 10));

    // Create office end time for today
    const today = new Date();
    const officeEndDate = new Date(today);
    officeEndDate.setHours(hours, minutes, 0, 0);

    // Only schedule if the time is in the future
    if (officeEndDate <= new Date()) {
      console.log("Office end time is in the past, not scheduling");
      return null;
    }

    // Schedule the notification
    const notificationId = `office-end-reminder-${
      today.toISOString().split("T")[0]
    }`;
    return await scheduleNotification({
      id: notificationId,
      title: "Nhắc nhở kết thúc giờ hành chính",
      message: `Đã đến giờ kết thúc làm việc hành chính, hãy chấm công ra`,
      date: officeEndDate,
      sound: settings.sound,
      vibrate: settings.vibration,
      data: {
        type: "office_end_reminder",
        action: "check_out",
        shiftInfo,
      },
    });
  } catch (error) {
    console.error("Error scheduling office end reminder:", error);
    return null;
  }
};

// Schedule end shift reminder (for complete)
export const scheduleEndShiftReminder = async (endTime, shiftInfo) => {
  try {
    // Ensure endTime is valid
    if (!endTime) {
      console.log("Invalid end time");
      return null;
    }

    // Get notification settings
    const settings = await loadNotificationSettings();
    if (!settings.enabled) {
      console.log("Notifications are disabled");
      return null;
    }

    // Parse the end time (format: HH:MM)
    const [hours, minutes] = endTime.split(":").map((num) => parseInt(num, 10));

    // Create end time for today
    const today = new Date();
    const endDate = new Date(today);
    endDate.setHours(hours, minutes, 0, 0);

    // Calculate reminder time (10 minutes after end time)
    const reminderDate = new Date(endDate);
    reminderDate.setMinutes(reminderDate.getMinutes() + 10);

    // Only schedule if the time is in the future
    if (reminderDate <= new Date()) {
      console.log("End shift reminder time is in the past, not scheduling");
      return null;
    }

    // Schedule the notification
    const notificationId = `shift-end-reminder-${
      today.toISOString().split("T")[0]
    }`;
    return await scheduleNotification({
      id: notificationId,
      title: "Nhắc nhở hoàn tất ca làm việc",
      message: `Đã quá giờ kết thúc ca làm việc ${
        shiftInfo ? shiftInfo.name : ""
      }, hãy hoàn tất ca`,
      date: reminderDate,
      sound: settings.sound,
      vibrate: settings.vibration,
      data: {
        type: "shift_end_reminder",
        action: "complete",
        shiftInfo,
      },
    });
  } catch (error) {
    console.error("Error scheduling end shift reminder:", error);
    return null;
  }
};

// Schedule all reminders for today's shift
export const scheduleShiftReminders = async (shiftInfo) => {
  if (!shiftInfo) {
    console.log("No shift info provided, not scheduling reminders");
    return;
  }

  // Cancel any existing reminders first
  await cancelAllShiftNotifications();

  const settings = await loadNotificationSettings();
  if (!settings.enabled) {
    console.log("Notifications are disabled, not scheduling");
    return;
  }

  // Schedule departure reminder
  if (shiftInfo.departureTime) {
    await scheduleDepartureReminder(shiftInfo.departureTime, shiftInfo);
  }

  // Schedule start time reminder (10 min before)
  if (shiftInfo.startTime) {
    await scheduleStartTimeReminder(shiftInfo.startTime, shiftInfo);
  }

  // Schedule office end reminder
  if (shiftInfo.officeEndTime) {
    await scheduleOfficeEndReminder(shiftInfo.officeEndTime, shiftInfo);
  }

  // Schedule shift end reminder
  if (shiftInfo.endTime) {
    await scheduleEndShiftReminder(shiftInfo.endTime, shiftInfo);
  }
};

// Cancel all reminders when a work action is completed
export const cancelRemindersByAction = async (action) => {
  const today = new Date().toISOString().split("T")[0];

  switch (action) {
    case "go_work":
      // Cancel departure reminder when "go to work" is pressed
      await cancelNotification(`departure-reminder-${today}`);
      break;
    case "check_in":
      // Cancel check-in reminder when "check in" is pressed
      await cancelNotification(`checkin-reminder-${today}`);
      break;
    case "check_out":
      // Cancel office-end reminder when "check out" is pressed
      await cancelNotification(`office-end-reminder-${today}`);
      break;
    case "complete":
      // Cancel shift-end reminder when "complete" is pressed
      await cancelNotification(`shift-end-reminder-${today}`);
      break;
  }
};

// Clean up expired notifications from storage
export const cleanupExpiredNotifications = async () => {
  try {
    const storedNotifications = await getScheduledNotifications();
    const now = new Date();
    let changed = false;

    // Check each notification
    for (const [id, info] of Object.entries(storedNotifications)) {
      if (info.reminderTime) {
        const reminderTime = new Date(info.reminderTime);

        // If the reminder time has passed
        if (isBefore(reminderTime, now)) {
          // Remove from stored notifications
          delete storedNotifications[id];
          changed = true;

          // Also make sure it's canceled in the system
          await Notifications.cancelScheduledNotificationAsync(id).catch(
            () => {}
          ); // Ignore errors if already canceled
        }
      }
    }

    // Save changes if any notifications were removed
    if (changed) {
      await AsyncStorage.setItem(
        SCHEDULED_NOTIFICATIONS_KEY,
        JSON.stringify(storedNotifications)
      );
    }

    return true;
  } catch (error) {
    console.error("Error cleaning up expired notifications:", error);
    return false;
  }
};

// Handle notification response
export const handleNotificationResponse = (response) => {
  const data = response.notification.request.content.data;

  if (data.type === "shift_reminder") {
    // Handle shift reminder notification interaction
    console.log("User interacted with shift reminder:", data.shiftName);
    // You could navigate to specific screen or show more details here
  }
};

export default {
  initializeNotifications,
  saveNotificationSettings,
  loadNotificationSettings,
  scheduleNotification,
  cancelNotification,
  cancelAllShiftNotifications,
  cleanupExpiredNotifications,
  handleNotificationResponse,
  scheduleDepartureReminder,
  scheduleStartTimeReminder,
  scheduleOfficeEndReminder,
  scheduleEndShiftReminder,
  scheduleShiftReminders,
  cancelRemindersByAction,
};
