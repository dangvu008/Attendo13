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
  title,
  body,
  data,
  trigger,
  identifier,
  sound = true,
  vibrate = true,
}) => {
  try {
    // Create a unique identifier if none provided
    const notificationId = identifier || `reminder_${Date.now()}`;
    
    // Get current notification settings
    const settings = await loadNotificationSettings();
    
    // Configure the notification based on settings
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { ...data, id: notificationId },
        sound: settings.sound && sound ? true : false,
        vibrate: settings.vibration && vibrate ? [0, 250, 250, 250] : null,
      },
      trigger,
      identifier: notificationId,
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
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

// Schedule shift reminders based on shift details and reminder type
export const scheduleShiftReminders = async (shift, reminderType, note = null) => {
  try {
    if (!shift || !shift.id || reminderType === 'none') {
      return null;
    }
    
    // Get settings to check if notifications are enabled
    const settings = await loadNotificationSettings();
    if (!settings.enabled) {
      return null;
    }
    
    // Cancel any existing reminders for this shift
    await cancelAllShiftNotifications(shift.id);
    
    // Parse shift start time
    const shiftDate = parseISO(shift.date);
    const [startHours, startMinutes] = shift.startTime.split(':').map(Number);
    
    // Set the reminder time based on the reminder type
    let reminderMinutesBefore = 0;
    
    switch (reminderType) {
      case 'before_5_min':
        reminderMinutesBefore = 5;
        break;
      case 'before_15_min':
        reminderMinutesBefore = 15;
        break;
      case 'before_30_min':
        reminderMinutesBefore = 30;
        break;
      default:
        reminderMinutesBefore = 0;
    }
    
    // Calculate the reminder time
    let reminderTime = new Date(shiftDate);
    reminderTime.setHours(startHours, startMinutes, 0);
    reminderTime = addMinutes(reminderTime, -reminderMinutesBefore);
    
    // Only schedule if the reminder time is in the future
    if (isBefore(reminderTime, new Date())) {
      console.log('Reminder time is in the past, not scheduling');
      return null;
    }
    
    // Format strings for the notification
    const formattedTime = format(reminderTime, 'HH:mm');
    const shiftStartTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
    
    // Schedule the notification
    const notificationId = await scheduleNotification({
      title: `Nhắc nhở ca làm việc - ${shift.name}`,
      body: `Ca làm việc của bạn "${shift.name}" bắt đầu lúc ${shiftStartTime}${note ? `. ${note}` : ''}`,
      data: {
        type: 'shift_reminder',
        shiftId: shift.id,
        shiftName: shift.name,
        startTime: shift.startTime,
      },
      trigger: {
        date: reminderTime,
      },
      identifier: `shift_reminder_${shift.id}`,
    });
    
    if (notificationId) {
      // Save the scheduled notification details
      await saveScheduledNotification(notificationId, {
        shiftId: shift.id,
        shiftName: shift.name,
        reminderTime: reminderTime.toISOString(),
        startTime: shift.startTime,
        reminderType,
      });
      
      return notificationId;
    }
    
    return null;
  } catch (error) {
    console.error('Error scheduling shift reminders:', error);
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
  scheduleShiftReminders,
  cleanupExpiredNotifications,
  handleNotificationResponse
};
