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
  handleNotification: async () => {
    const settings = await getNotificationSettings();
    return {
      shouldShowAlert: true,
      shouldPlaySound: settings.soundEnabled,
      shouldSetBadge: true,
      shouldVibrate: settings.vibrationEnabled,
    };
  },
});

// Key for storing notification settings
const NOTIFICATION_SETTINGS_KEY = "notification_settings";
const SCHEDULED_NOTIFICATIONS_KEY = "scheduled_notifications";

// Initialize notification permissions
export const initializeNotifications = async () => {
  // Check if running on web platform
  if (Platform.OS === 'web') {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      console.log(`Web notification permission: ${permission}`);
    }
    return false; // Return false on web as permissions can't be requested
  }
  
  try {
    // Cấu hình cho thiết bị di động
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Yêu cầu quyền thông báo
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    console.log(`Notification permission status: ${finalStatus}`);

    if (Platform.OS === "android") {
      await createNotificationChannel();
    }
    
    return finalStatus === "granted";
  } catch (error) {
    console.error("Error initializing notifications:", error);
    return false;
  }
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
export const getNotificationSettings = async () => {
  try {
    const settingsStr = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (settingsStr) {
      return JSON.parse(settingsStr);
    }
    // Giá trị mặc định
    return {
      soundEnabled: true,
      vibrationEnabled: true,
      // Giữ lại các cài đặt khác
      enabled: true,
      reminderType: "default",
    };
  } catch (error) {
    console.error("Error getting notification settings:", error);
    return {
      soundEnabled: true,
      vibrationEnabled: true,
      enabled: true,
      reminderType: "default",
    };
  }
};

// Schedule a notification
export const scheduleNotification = async (options) => {
  try {
    const settings = await getNotificationSettings();

    if (Platform.OS === "web") {
      console.log("Thông báo web:", options.title, options.body);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(options.title, { body: options.body });
      }
      return `web-mock-notification-${Date.now()}`;
    }

    // Lên lịch thông báo trên thiết bị di động
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        data: options.data || {},
        sound: settings.soundEnabled,
        vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : null,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: options.trigger || null,
    });

    return id;
  } catch (error) {
    console.error("Error scheduling notification:", error);
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
    // Check if running on web platform
    if (Platform.OS === "web") {
      console.log("Canceling notifications is not supported on web platform");
      return true; // Return success on web as there's nothing to cancel
    }

    await Notifications.cancelScheduledNotificationAsync(notificationId);
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

    // Check if running on web platform
    if (Platform.OS !== "web") {
      // Cancel each notification (only on native platforms)
      for (const id of notificationsToCancel) {
        await Notifications.cancelScheduledNotificationAsync(id);
        delete storedNotifications[id];
      }
    } else {
      // On web, just clear the stored notifications without calling native API
      console.log("Canceling notifications is not supported on web platform");
      notificationsToCancel.forEach((id) => delete storedNotifications[id]);
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
    const settings = await getNotificationSettings();
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
      title: "Nhắc nhở xuất phát",
      body: `Đã đến giờ xuất phát cho ca làm việc ${
        shiftInfo ? shiftInfo.name : ""
      }`,
      data: {
        type: "departure_reminder",
        action: "go_work",
        shiftInfo,
      },
      trigger: departureDate,
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
    const settings = await getNotificationSettings();
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
      title: "Nhắc nhở chấm công vào",
      body: `Còn 10 phút nữa đến giờ chấm công vào cho ca ${
        shiftInfo ? shiftInfo.name : ""
      }`,
      data: {
        type: "check_in_reminder",
        action: "check_in",
        shiftInfo,
      },
      trigger: reminderDate,
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
    const settings = await getNotificationSettings();
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
      title: "Nhắc nhở kết thúc giờ hành chính",
      body: `Đã đến giờ kết thúc làm việc hành chính, hãy chấm công ra`,
      data: {
        type: "office_end_reminder",
        action: "check_out",
        shiftInfo,
      },
      trigger: officeEndDate,
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
    const settings = await getNotificationSettings();
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
      title: "Nhắc nhở hoàn tất ca làm việc",
      body: `Đã quá giờ kết thúc ca làm việc ${
        shiftInfo ? shiftInfo.name : ""
      }, hãy hoàn tất ca`,
      data: {
        type: "shift_end_reminder",
        action: "complete",
        shiftInfo,
      },
      trigger: reminderDate,
    });
  } catch (error) {
    console.error("Error scheduling end shift reminder:", error);
    return null;
  }
};

// Schedule all reminders for today's shift
export const scheduleShiftReminders = async (shiftInfo, reminderType) => {
  if (!shiftInfo) {
    console.log("No shift info provided, not scheduling reminders");
    return;
  }

  // Cancel any existing reminders first
  await cancelAllShiftNotifications();

  const settings = await getNotificationSettings();
  if (!settings.enabled) {
    console.log("Notifications are disabled, not scheduling");
    return;
  }

  // Kiểm tra chế độ nút đa năng
  const AppSettingsStorage = require("../storage/AppSettingsStorage");
  const multiPurposeMode = await AppSettingsStorage.getMultiPurposeMode();

  // Nếu chế độ nút đa năng được bật, không lên lịch nhắc nhở
  if (multiPurposeMode) {
    console.log(
      "Multi-purpose mode is enabled, no reminders will be scheduled"
    );
    return;
  }

  // Nếu reminderType là 'none', không lên lịch nhắc nhở
  if (reminderType === "none") {
    console.log("Reminder type is set to 'none', not scheduling reminders");
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

// Load reminder type from settings
export const loadReminderType = async () => {
  try {
    const settings = await getNotificationSettings();
    return settings.reminderType || "default";
  } catch (error) {
    console.error("Error loading reminder type:", error);
    return "default";
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

          // Also make sure it's canceled in the system (only on native platforms)
          if (Platform.OS !== 'web') {
            await Notifications.cancelScheduledNotificationAsync(id).catch(
              () => {}
            ); // Ignore errors if already canceled
          }
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
  const data = response?.notification?.request?.content?.data;
  console.log("Notification response data:", data);

  // Xử lý logic dựa vào dữ liệu thông báo
};

// Tạo kênh thông báo cho Android
export const createNotificationChannel = async () => {
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
      console.log("Đã tạo kênh thông báo Android");
    } catch (error) {
      console.error("Error creating notification channel:", error);
    }
  }
};

// Xử lý tương tác thông báo
export const onNotificationInteraction = (notification) => {
  console.log("Interaction with notification:", notification);

  // Xử lý tương tác với thông báo
};

export default {
  initializeNotifications,
  saveNotificationSettings,
  getNotificationSettings,
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
  loadReminderType,
  createNotificationChannel,
  onNotificationInteraction,
};
