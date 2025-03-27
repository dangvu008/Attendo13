import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  saveSampleReminderDataToStorage, 
  saveUpcomingRemindersToStorage 
} from '../data/sampleReminderData';
import { 
  configureNotifications,
  scheduleAllReminders 
} from '../utils/reminderHelper';

// Example component showing how to use the sample data and reminder utilities
export const ReminderSetupExample = () => {
  useEffect(() => {
    const setupReminders = async () => {
      try {
        // Step 1: Configure notifications
        const permissionGranted = await configureNotifications();
        if (!permissionGranted) {
          console.log('Cannot set up reminders without notification permissions');
          return;
        }

        // Step 2: Save sample data to AsyncStorage
        await saveSampleReminderDataToStorage(AsyncStorage);

        // Step 3: Generate and save upcoming reminders
        const upcomingReminders = await saveUpcomingRemindersToStorage(AsyncStorage);
        
        // Step 4: Schedule all reminders
        const scheduledIdentifiers = await scheduleAllReminders(upcomingReminders);
        
        console.log(`Successfully scheduled ${scheduledIdentifiers.length} reminders`);
        
        // Step 5: Save the mapping of reminderId to notificationId for later management
        await AsyncStorage.setItem('scheduledReminders', JSON.stringify(scheduledIdentifiers));
      } catch (error) {
        console.error('Error setting up reminders:', error);
      }
    };

    setupReminders();
  }, []);

  return null; // This is just a utility component with no UI
};

// How to check what reminders have been scheduled
export const checkScheduledReminders = async () => {
  try {
    // Get all scheduled notifications
    const scheduledNotifications = await AsyncStorage.getItem('scheduledReminders');
    const parsedNotifications = scheduledNotifications ? JSON.parse(scheduledNotifications) : [];
    
    console.log(`Found ${parsedNotifications.length} scheduled reminders:`);
    parsedNotifications.forEach(reminder => {
      console.log(`- ${reminder.reminderId} scheduled for ${new Date(reminder.scheduledTime).toLocaleString()}`);
    });
    
    return parsedNotifications;
  } catch (error) {
    console.error('Error checking scheduled reminders:', error);
    return [];
  }
};
