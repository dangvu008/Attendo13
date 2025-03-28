// TestAlarmData.js
// File này chứa dữ liệu mẫu để kiểm tra chức năng nhắc nhở dạng báo thức

import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, addMinutes, addHours } from "date-fns";

// Các key lưu trữ trong AsyncStorage
const SHIFTS_KEY = "shifts";
const CURRENT_SHIFT_KEY = "currentShift";
const NOTIFICATION_SETTINGS_KEY = "notification_settings";

// Tạo thời gian cho các ca làm việc mẫu
const createTimeForToday = (timeString) => {
  const [hours, minutes] = timeString.split(":").map(num => parseInt(num, 10));
  const today = new Date();
  today.setHours(hours, minutes, 0, 0);
  return today;
};

// Tạo thời gian trong tương lai gần để kiểm tra thông báo
const createTestTime = (minutesFromNow) => {
  const now = new Date();
  const testTime = addMinutes(now, minutesFromNow);
  return format(testTime, "HH:mm");
};

// Dữ liệu mẫu cho ca làm việc
const testShifts = [
  {
    id: "test1",
    name: "Ca Test 1 (5 phút)",
    startWorkTime: createTestTime(5),  // 5 phút từ bây giờ
    endWorkTime: createTestTime(15),   // 15 phút từ bây giờ
    departureTime: createTestTime(2),  // 2 phút từ bây giờ
    officeEndTime: createTestTime(10), // 10 phút từ bây giờ
    remindBeforeWork: 1,               // Nhắc trước 1 phút
    remindAfterWork: 1,                // Nhắc sau 1 phút
    showSignButton: true,
    isActive: true,
    appliedDays: [1, 2, 3, 4, 5, 6, 7], // Áp dụng mọi ngày trong tuần
  },
  {
    id: "test2",
    name: "Ca Test 2 (10 phút)",
    startWorkTime: createTestTime(10), // 10 phút từ bây giờ
    endWorkTime: createTestTime(30),   // 30 phút từ bây giờ
    departureTime: createTestTime(7),  // 7 phút từ bây giờ
    officeEndTime: createTestTime(25), // 25 phút từ bây giờ
    remindBeforeWork: 2,               // Nhắc trước 2 phút
    remindAfterWork: 2,                // Nhắc sau 2 phút
    showSignButton: true,
    isActive: true,
    appliedDays: [1, 2, 3, 4, 5, 6, 7], // Áp dụng mọi ngày trong tuần
  },
  {
    id: "test3",
    name: "Ca Test 3 (15 phút)",
    startWorkTime: createTestTime(15), // 15 phút từ bây giờ
    endWorkTime: createTestTime(45),   // 45 phút từ bây giờ
    departureTime: createTestTime(12), // 12 phút từ bây giờ
    officeEndTime: createTestTime(40), // 40 phút từ bây giờ
    remindBeforeWork: 3,               // Nhắc trước 3 phút
    remindAfterWork: 3,                // Nhắc sau 3 phút
    showSignButton: true,
    isActive: true,
    appliedDays: [1, 2, 3, 4, 5, 6, 7], // Áp dụng mọi ngày trong tuần
  }
];

// Cài đặt thông báo mẫu
const testNotificationSettings = {
  enabled: true,
  sound: true,
  vibration: true,
  reminderType: "before_5_min", // Các giá trị có thể: none, before_5_min, before_15_min, before_30_min
};

// Lưu dữ liệu mẫu vào AsyncStorage
export const saveTestData = async () => {
  try {
    // Lưu danh sách ca làm việc mẫu
    await AsyncStorage.setItem(SHIFTS_KEY, JSON.stringify(testShifts));
    
    // Lưu ca làm việc hiện tại (chọn ca test đầu tiên)
    await AsyncStorage.setItem(CURRENT_SHIFT_KEY, JSON.stringify(testShifts[0]));
    
    // Lưu cài đặt thông báo
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(testNotificationSettings));
    
    console.log("Đã lưu dữ liệu mẫu thành công!");
    return true;
  } catch (error) {
    console.error("Lỗi khi lưu dữ liệu mẫu:", error);
    return false;
  }
};

// Xóa dữ liệu mẫu khỏi AsyncStorage
export const clearTestData = async () => {
  try {
    // Không xóa dữ liệu thật, chỉ đặt lại về mặc định
    const originalShiftsData = await AsyncStorage.getItem("original_shifts");
    const originalCurrentShiftData = await AsyncStorage.getItem("original_currentShift");
    const originalNotificationSettingsData = await AsyncStorage.getItem("original_notification_settings");
    
    if (originalShiftsData) {
      await AsyncStorage.setItem(SHIFTS_KEY, originalShiftsData);
    }
    
    if (originalCurrentShiftData) {
      await AsyncStorage.setItem(CURRENT_SHIFT_KEY, originalCurrentShiftData);
    }
    
    if (originalNotificationSettingsData) {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, originalNotificationSettingsData);
    }
    
    console.log("Đã xóa dữ liệu mẫu thành công!");
    return true;
  } catch (error) {
    console.error("Lỗi khi xóa dữ liệu mẫu:", error);
    return false;
  }
};

// Sao lưu dữ liệu hiện tại trước khi thay thế bằng dữ liệu mẫu
export const backupCurrentData = async () => {
  try {
    const shiftsData = await AsyncStorage.getItem(SHIFTS_KEY);
    const currentShiftData = await AsyncStorage.getItem(CURRENT_SHIFT_KEY);
    const notificationSettingsData = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    
    if (shiftsData) {
      await AsyncStorage.setItem("original_shifts", shiftsData);
    }
    
    if (currentShiftData) {
      await AsyncStorage.setItem("original_currentShift", currentShiftData);
    }
    
    if (notificationSettingsData) {
      await AsyncStorage.setItem("original_notification_settings", notificationSettingsData);
    }
    
    console.log("Đã sao lưu dữ liệu hiện tại thành công!");
    return true;
  } catch (error) {
    console.error("Lỗi khi sao lưu dữ liệu hiện tại:", error);
    return false;
  }
};

// Hàm chính để thiết lập dữ liệu mẫu
export const setupTestAlarmData = async () => {
  try {
    // Sao lưu dữ liệu hiện tại
    await backupCurrentData();
    
    // Lưu dữ liệu mẫu
    await saveTestData();
    
    console.log("Đã thiết lập dữ liệu mẫu thành công!");
    return true;
  } catch (error) {
    console.error("Lỗi khi thiết lập dữ liệu mẫu:", error);
    return false;
  }
};

export default {
  setupTestAlarmData,
  saveTestData,
  clearTestData,
  backupCurrentData,
  testShifts,
  testNotificationSettings
};