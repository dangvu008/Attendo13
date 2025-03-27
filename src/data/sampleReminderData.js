/**
 * Sample data for testing reminder functionality in the app
 * Contains work shifts with various reminder settings
 */

export const sampleShiftsWithReminders = [
  {
    id: "shift-001",
    name: "Ca Sáng (Nhắc 5 phút)",
    startTime: "08:00",
    endTime: "12:00",
    days: [1, 2, 3, 4, 5], // Monday to Friday
    color: "#4287f5",
    reminders: {
      beforeDeparture: 5, // 5 minutes before departure time
      beforeCheckIn: 5,   // 5 minutes before check-in time
      afterCheckOut: 5    // 5 minutes after check-out time
    },
    isActive: true
  },
  {
    id: "shift-002",
    name: "Ca Chiều (Nhắc 15 phút)",
    startTime: "13:30",
    endTime: "17:30",
    days: [1, 2, 3, 4, 5], // Monday to Friday
    color: "#f54242",
    reminders: {
      beforeDeparture: 15, // 15 minutes before departure time
      beforeCheckIn: 15,   // 15 minutes before check-in time
      afterCheckOut: 5     // 5 minutes after check-out time
    },
    isActive: false
  },
  {
    id: "shift-003",
    name: "Ca Tối (Nhắc 30 phút)",
    startTime: "18:00",
    endTime: "22:00",
    days: [1, 3, 5], // Monday, Wednesday, Friday
    color: "#42f5aa",
    reminders: {
      beforeDeparture: 30, // 30 minutes before departure time
      beforeCheckIn: 10,   // 10 minutes before check-in time
      afterCheckOut: 5     // 5 minutes after check-out time
    },
    isActive: false
  },
  {
    id: "shift-004",
    name: "Ca Cuối Tuần (Nhiều nhắc nhở)",
    startTime: "10:00",
    endTime: "16:00",
    days: [0, 6], // Sunday, Saturday
    color: "#f5d442",
    reminders: {
      beforeDeparture: 45, // 45 minutes before departure time
      beforeCheckIn: 15,   // 15 minutes before check-in time
      afterCheckOut: 10    // 10 minutes after check-out time
    },
    isActive: false
  },
  {
    id: "shift-005",
    name: "Ca Không Nhắc Nhở",
    startTime: "09:00",
    endTime: "17:00",
    days: [2, 4], // Tuesday, Thursday
    color: "#b342f5",
    reminders: {
      beforeDeparture: 0, // No reminder
      beforeCheckIn: 0,   // No reminder
      afterCheckOut: 0    // No reminder
    },
    isActive: false
  }
];

// Sample user reminder preferences
export const sampleReminderPreferences = {
  enableNotifications: true,
  enableSound: true,
  enableVibration: true,
  defaultReminderTimes: {
    beforeDeparture: 15, // Default 15 minutes before departure time
    beforeCheckIn: 5,    // Default 5 minutes before check-in time
    afterCheckOut: 5     // Default 5 minutes after check-out time
  }
};

// Function to save sample reminder data to AsyncStorage
export const saveSampleReminderDataToStorage = async (AsyncStorage) => {
  try {
    await AsyncStorage.setItem('shifts', JSON.stringify(sampleShiftsWithReminders));
    await AsyncStorage.setItem('reminderPreferences', JSON.stringify(sampleReminderPreferences));
    console.log('Sample reminder data saved to AsyncStorage');
    return true;
  } catch (error) {
    console.error('Error saving sample reminder data:', error);
    return false;
  }
};

// Function to generate upcoming reminder events for the next 7 days
export const generateUpcomingReminders = () => {
  const reminders = [];
  const now = new Date();
  
  // Loop through the next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDate = new Date();
    currentDate.setDate(now.getDate() + dayOffset);
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Find shifts that are scheduled for this day
    sampleShiftsWithReminders.forEach(shift => {
      if (shift.days.includes(dayOfWeek)) {
        // Parse shift times
        const [startHour, startMinute] = shift.startTime.split(':').map(Number);
        const [endHour, endMinute] = shift.endTime.split(':').map(Number);
        
        // Create date objects for the reminders
        const shiftDate = new Date(currentDate);
        
        // Departure reminder (assuming 30 min travel time)
        const departureTime = new Date(shiftDate);
        departureTime.setHours(startHour, startMinute - 30, 0, 0);
        
        // Only add future reminders (not past ones)
        if (departureTime > now && shift.reminders.beforeDeparture > 0) {
          const reminderTime = new Date(departureTime);
          reminderTime.setMinutes(reminderTime.getMinutes() - shift.reminders.beforeDeparture);
          
          reminders.push({
            id: `dep-${shift.id}-${departureTime.toISOString()}`,
            type: 'departure',
            shiftId: shift.id,
            shiftName: shift.name,
            scheduledTime: reminderTime.toISOString(),
            message: `${shift.reminders.beforeDeparture} phút nữa đến giờ xuất phát cho ca ${shift.name}`,
            departureTime: departureTime.toISOString(),
            shiftStartTime: shiftDate.setHours(startHour, startMinute, 0, 0)
          });
        }
        
        // Check-in reminder
        const checkInTime = new Date(shiftDate);
        checkInTime.setHours(startHour, startMinute, 0, 0);
        
        if (checkInTime > now && shift.reminders.beforeCheckIn > 0) {
          const reminderTime = new Date(checkInTime);
          reminderTime.setMinutes(reminderTime.getMinutes() - shift.reminders.beforeCheckIn);
          
          reminders.push({
            id: `checkin-${shift.id}-${checkInTime.toISOString()}`,
            type: 'checkIn',
            shiftId: shift.id,
            shiftName: shift.name,
            scheduledTime: reminderTime.toISOString(),
            message: `${shift.reminders.beforeCheckIn} phút nữa đến giờ check-in ca ${shift.name}`,
            checkInTime: checkInTime.toISOString()
          });
        }
        
        // Check-out reminder
        const checkOutTime = new Date(shiftDate);
        checkOutTime.setHours(endHour, endMinute, 0, 0);
        
        if (checkOutTime > now && shift.reminders.afterCheckOut > 0) {
          const reminderTime = new Date(checkOutTime);
          reminderTime.setMinutes(reminderTime.getMinutes() - shift.reminders.afterCheckOut);
          
          reminders.push({
            id: `checkout-${shift.id}-${checkOutTime.toISOString()}`,
            type: 'checkOut',
            shiftId: shift.id,
            shiftName: shift.name,
            scheduledTime: reminderTime.toISOString(),
            message: `${shift.reminders.afterCheckOut} phút nữa đến giờ check-out ca ${shift.name}`,
            checkOutTime: checkOutTime.toISOString()
          });
        }
      }
    });
  }
  
  // Sort reminders by scheduled time
  return reminders.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
};

// Helper function to add upcoming reminders to AsyncStorage
export const saveUpcomingRemindersToStorage = async (AsyncStorage) => {
  try {
    const upcomingReminders = generateUpcomingReminders();
    await AsyncStorage.setItem('upcomingReminders', JSON.stringify(upcomingReminders));
    console.log(`${upcomingReminders.length} upcoming reminders saved to AsyncStorage`);
    return upcomingReminders;
  } catch (error) {
    console.error('Error saving upcoming reminders:', error);
    return [];
  }
};
