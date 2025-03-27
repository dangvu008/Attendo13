import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
export const configureNotifications = async () => {
  // Request permissions (required for iOS)
  if (Platform.OS === 'ios') {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission for notifications not granted');
      return false;
    }
  }

  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  return true;
};

// Schedule a reminder notification
export const scheduleReminder = async (reminder) => {
  try {
    const scheduledTime = new Date(reminder.scheduledTime);
    
    // Don't schedule if the time is in the past
    if (scheduledTime <= new Date()) {
      console.log(`Skipping reminder ${reminder.id} as it's in the past`);
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Nhắc nhở: ${reminder.type === 'departure' ? 'Xuất phát' : 
                reminder.type === 'checkIn' ? 'Check-in' : 'Check-out'}`,
        body: reminder.message,
        data: { ...reminder },
        sound: 'default',
      },
      trigger: {
        date: scheduledTime,
      },
    });

    console.log(`Reminder scheduled: ${reminder.id} with identifier ${identifier} for ${scheduledTime.toLocaleString()}`);
    return identifier;
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    return null;
  }
};

// Cancel all scheduled notifications
export const cancelAllReminders = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('All scheduled notifications cancelled');
};

// Schedule all upcoming reminders
export const scheduleAllReminders = async (reminders) => {
  const scheduledIdentifiers = [];
  
  // First cancel any existing notifications
  await cancelAllReminders();

  // Then schedule new ones
  for (const reminder of reminders) {
    const identifier = await scheduleReminder(reminder);
    if (identifier) {
      scheduledIdentifiers.push({
        reminderId: reminder.id,
        notificationId: identifier,
        scheduledTime: reminder.scheduledTime,
      });
    }
  }

  return scheduledIdentifiers;
};

// Handle received notifications (can be used to track when a user taps on a notification)
export const handleReceivedNotification = (notification) => {
  const data = notification.request?.content?.data;
  console.log('Notification received:', data);
  
  // Return data for further processing
  return data;
};
