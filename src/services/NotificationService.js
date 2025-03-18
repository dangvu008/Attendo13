import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO, addMinutes, setHours, setMinutes, parse, isBefore } from 'date-fns';

// Configure notification behavior for the app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Key for storing notification settings
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';
const SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_notifications';

// Initialize notification permissions
export const initializeNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('shift-reminders', {
      name: 'Nhắc nhở ca làm việc',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4285F4',
      sound: true,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
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
    console.error('Error saving notification settings:', error);
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
          reminderType: 'none', // none, before_5_min, before_15_min, before_30_min
        };
  } catch (error) {
    console.error('Error loading notification settings:', error);
    return {
      enabled: true,
      sound: true,
      vibration: true,
      reminderType: 'none',
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
  data = {}
}) => {
  try {
    // Tạo trigger dựa vào thời gian
    const trigger = new Date(date);
    
    // Đảm bảo trigger trong tương lai
    if (trigger <= new Date()) {
      console.log('Notification date is in the past, not scheduling');
      return null;
    }
    
    // Hủy thông báo cũ nếu có
    await cancelNotification(id);
    
    // Lên lịch thông báo mới
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
    console.error('Lỗi khi lên lịch thông báo:', error);
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
    console.error('Error saving scheduled notification:', error);
    return false;
  }
};

// Get all scheduled notifications from AsyncStorage
export const getScheduledNotifications = async () => {
  try {
    const notificationsJson = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
    return notificationsJson ? JSON.parse(notificationsJson) : {};
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
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
    console.error('Error canceling notification:', error);
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
    console.error('Error canceling shift notifications:', error);
    return false;
  }
};

// Schedule departure reminder (before "go to work")
export const scheduleDepartureReminder = async (departureTime) => {
  try {
    if (!departureTime) return null;
    
    const settings = await loadNotificationSettings();
    if (!settings.enabled) return null;
    
    // Parse departureTime từ format "HH:MM"
    const [hours, minutes] = departureTime.split(':').map(Number);
    
    // Tạo đối tượng Date cho hôm nay với thời gian xuất phát
    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setHours(hours, minutes, 0, 0);
    
    // Lên lịch trước thời gian xuất phát 15 phút
    reminderDate.setMinutes(reminderDate.getMinutes() - 15);
    
    // Nếu đã qua thời gian thông báo thì không lên lịch
    if (reminderDate <= new Date()) {
      return null;
    }
    
    // Lên lịch thông báo
    return await scheduleNotification({
      id: 'departure-reminder',
      title: 'Nhắc nhở chuẩn bị đi làm',
      message: 'Sắp đến giờ chuẩn bị đi làm, hãy đảm bảo bạn sẵn sàng!',
      date: reminderDate,
      sound: settings.sound,
      vibrate: settings.vibration,
      data: { type: 'departure' }
    });
  } catch (error) {
    console.error('Lỗi khi lên lịch nhắc nhở xuất phát:', error);
    return null;
  }
};

// Schedule start time reminder (for check-in)
export const scheduleStartTimeReminder = async (startTime) => {
  try {
    if (!startTime) return null;
    
    const settings = await loadNotificationSettings();
    if (!settings.enabled) return null;
    
    // Parse startTime từ format "HH:MM"
    const [hours, minutes] = startTime.split(':').map(Number);
    
    // Tạo đối tượng Date cho hôm nay với thời gian bắt đầu
    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setHours(hours, minutes, 0, 0);
    
    // Nếu đã qua thời gian thông báo thì không lên lịch
    if (reminderDate <= new Date()) {
      return null;
    }
    
    // Lên lịch thông báo
    return await scheduleNotification({
      id: 'check-in-reminder',
      title: 'Nhắc nhở chấm công vào',
      message: 'Đã đến giờ làm việc, hãy nhớ chấm công vào!',
      date: reminderDate,
      sound: settings.sound,
      vibrate: settings.vibration,
      data: { type: 'check-in' }
    });
  } catch (error) {
    console.error('Lỗi khi lên lịch nhắc nhở chấm công vào:', error);
    return null;
  }
};

// Schedule check-out reminder
export const scheduleCheckOutReminder = async (officeEndTime) => {
  try {
    if (!officeEndTime) return null;
    
    const settings = await loadNotificationSettings();
    if (!settings.enabled) return null;
    
    // Parse officeEndTime từ format "HH:MM"
    const [hours, minutes] = officeEndTime.split(':').map(Number);
    
    // Tạo đối tượng Date cho hôm nay với thời gian kết thúc
    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setHours(hours, minutes, 0, 0);
    
    // Nếu đã qua thời gian thông báo thì không lên lịch
    if (reminderDate <= new Date()) {
      return null;
    }
    
    // Lên lịch thông báo
    return await scheduleNotification({
      id: 'office-end-reminder',
      title: 'Nhắc nhở chấm công ra',
      message: 'Đã hết giờ làm việc, hãy nhớ chấm công ra!',
      date: reminderDate,
      sound: settings.sound,
      vibrate: settings.vibration,
      data: { type: 'check-out' }
    });
  } catch (error) {
    console.error('Lỗi khi lên lịch nhắc nhở chấm công ra:', error);
    return null;
  }
};

// Schedule end shift reminder (for complete)
export const scheduleEndShiftReminder = async (endTime) => {
  try {
    if (!endTime) return null;
    
    const settings = await loadNotificationSettings();
    if (!settings.enabled) return null;
    
    // Parse endTime từ format "HH:MM"
    const [hours, minutes] = endTime.split(':').map(Number);
    
    // Tạo đối tượng Date cho hôm nay với thời gian kết thúc ca làm
    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setHours(hours, minutes, 0, 0);
    
    // Thêm 10 phút (nhắc nhở sau giờ kết thúc)
    reminderDate.setMinutes(reminderDate.getMinutes() + 10);
    
    // Nếu đã qua thời gian thông báo thì không lên lịch
    if (reminderDate <= new Date()) {
      return null;
    }
    
    // Lên lịch thông báo
    return await scheduleNotification({
      id: 'shift-end-reminder',
      title: 'Nhắc nhở hoàn thành ca làm',
      message: 'Ca làm việc đã kết thúc, hãy nhớ xác nhận hoàn thành!',
      date: reminderDate,
      sound: settings.sound,
      vibrate: settings.vibration,
      data: { type: 'complete' }
    });
  } catch (error) {
    console.error('Lỗi khi lên lịch nhắc nhở hoàn thành ca làm:', error);
    return null;
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
          await Notifications.cancelScheduledNotificationAsync(id)
            .catch(() => {}); // Ignore errors if already canceled
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
    console.error('Error cleaning up expired notifications:', error);
    return false;
  }
};

// Handle notification response
export const handleNotificationResponse = (response) => {
  const data = response.notification.request.content.data;
  
  if (data.type === 'shift_reminder') {
    // Handle shift reminder notification interaction
    console.log('User interacted with shift reminder:', data.shiftName);
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
  scheduleCheckOutReminder,
  scheduleEndShiftReminder
};
