import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as NotificationService from "./NotificationService";

// Tạo kênh thông báo cho Android
export const createNotificationChannel = async () => {
  if (Platform.OS === "android") {
    const channelId = await Notifications.setNotificationChannelAsync(
      "shift-reminders",
      {
        name: "Nhắc nhở ca làm việc",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4285F4",
        sound: true,
      }
    );

    return channelId;
  }

  return null;
};

// Lên lịch thông báo nền
export const scheduleBackgroundNotification = async (
  title,
  body,
  timestamp,
  data = {}
) => {
  try {
    // Lấy cài đặt thông báo
    const settings = await NotificationService.getNotificationSettings();

    // Kiểm tra xem thông báo có được bật không
    if (!settings.enabled) {
      console.log("Thông báo bị tắt, không lên lịch");
      return null;
    }

    // Tạo nội dung thông báo
    const notificationContent = {
      title,
      body,
      data,
      sound: settings.soundEnabled ? "default" : null,
      vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : null,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };

    // Tạo trigger dựa trên timestamp
    const trigger = {
      date: new Date(timestamp),
    };

    // Kiểm tra nếu đang chạy trên nền tảng web
    if (Platform.OS === "web") {
      console.log("Thông báo không được hỗ trợ trên nền tảng web");
      // Trả về một identifier giả cho nền tảng web
      return `web-mock-notification-${Date.now()}`;
    }

    // Lên lịch thông báo
    const identifier = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
    });

    return identifier;
  } catch (error) {
    console.error("Error scheduling background notification:", error);
    return null;
  }
};

// Xử lý khi người dùng tương tác với thông báo
export const onNotificationInteraction = async (notification) => {
  const { data } = notification;

  if (data && data.type) {
    console.log(`Người dùng tương tác với thông báo: ${data.type}`);

    // Xử lý dựa vào loại thông báo
    switch (data.type) {
      case "departure_reminder":
        // Xử lý khi người dùng bấm vào thông báo xuất phát
        break;

      case "check_in_reminder":
        // Xử lý khi người dùng bấm vào thông báo chấm công vào
        break;

      case "check_out_reminder":
        // Xử lý khi người dùng bấm vào thông báo chấm công ra
        break;

      case "shift_end_reminder":
        // Xử lý khi người dùng bấm vào thông báo kết thúc ca
        break;
    }
  }
};

// Hủy thông báo
export const cancelBackgroundNotification = async (notificationId) => {
  try {
    await notifee.cancelNotification(notificationId);
    return true;
  } catch (error) {
    console.error("Error canceling background notification:", error);
    return false;
  }
};

// Hủy tất cả thông báo
export const cancelAllBackgroundNotifications = async () => {
  try {
    await notifee.cancelAllNotifications();
    return true;
  } catch (error) {
    console.error("Error canceling all background notifications:", error);
    return false;
  }
};

// Lên lịch nhắc nhở xuất phát
export const scheduleDepartureReminder = async (departureTime, shiftInfo) => {
  // Tính toán thời gian nhắc nhở
  const departureDate = new Date();
  const [hours, minutes] = departureTime
    .split(":")
    .map((num) => parseInt(num, 10));
  departureDate.setHours(hours, minutes, 0, 0);

  // Kiểm tra nếu thời gian đã qua
  if (departureDate < new Date()) {
    console.log("Thời gian xuất phát đã qua, không lên lịch thông báo");
    return null;
  }

  // Lên lịch thông báo
  return await scheduleBackgroundNotification(
    "Nhắc nhở xuất phát",
    `Đã đến giờ xuất phát cho ca làm việc ${shiftInfo ? shiftInfo.name : ""}`,
    departureDate,
    {
      type: "departure_reminder",
      shiftId: shiftInfo?.id,
      action: "go_work",
    }
  );
};

// Lên lịch nhắc nhở chấm công vào
export const scheduleCheckInReminder = async (
  startTime,
  shiftInfo,
  reminderBefore = 10
) => {
  // Tính toán thời gian nhắc nhở
  const startDate = new Date();
  const [hours, minutes] = startTime.split(":").map((num) => parseInt(num, 10));
  startDate.setHours(hours, minutes, 0, 0);

  // Nhắc trước thời gian quy định (mặc định 10 phút)
  const reminderDate = new Date(startDate);
  reminderDate.setMinutes(reminderDate.getMinutes() - reminderBefore);

  // Kiểm tra nếu thời gian đã qua
  if (reminderDate < new Date()) {
    console.log(
      "Thời gian nhắc nhở chấm công vào đã qua, không lên lịch thông báo"
    );
    return null;
  }

  // Lên lịch thông báo
  return await scheduleBackgroundNotification(
    "Nhắc nhở chấm công vào",
    `Còn ${reminderBefore} phút nữa đến giờ chấm công vào cho ca ${
      shiftInfo ? shiftInfo.name : ""
    }`,
    reminderDate,
    {
      type: "check_in_reminder",
      shiftId: shiftInfo?.id,
      action: "check_in",
    }
  );
};

// Lên lịch nhắc nhở chấm công ra
export const scheduleCheckOutReminder = async (endTime, shiftInfo) => {
  // Tính toán thời gian nhắc nhở
  const endDate = new Date();
  const [hours, minutes] = endTime.split(":").map((num) => parseInt(num, 10));
  endDate.setHours(hours, minutes, 0, 0);

  // Kiểm tra nếu thời gian đã qua
  if (endDate < new Date()) {
    console.log("Thời gian chấm công ra đã qua, không lên lịch thông báo");
    return null;
  }

  // Lên lịch thông báo
  return await scheduleBackgroundNotification(
    "Nhắc nhở chấm công ra",
    `Đã đến giờ kết thúc ca làm việc ${
      shiftInfo ? shiftInfo.name : ""
    }, hãy chấm công ra`,
    endDate,
    {
      type: "check_out_reminder",
      shiftId: shiftInfo?.id,
      action: "check_out",
    }
  );
};

// Lên lịch nhắc nhở kết thúc ca
export const scheduleShiftEndReminder = async (
  endTime,
  shiftInfo,
  reminderAfter = 10
) => {
  // Tính toán thời gian nhắc nhở
  const endDate = new Date();
  const [hours, minutes] = endTime.split(":").map((num) => parseInt(num, 10));
  endDate.setHours(hours, minutes, 0, 0);

  // Nhắc sau thời gian quy định (mặc định 10 phút)
  const reminderDate = new Date(endDate);
  reminderDate.setMinutes(reminderDate.getMinutes() + reminderAfter);

  // Kiểm tra nếu thời gian đã qua
  if (reminderDate < new Date()) {
    console.log(
      "Thời gian nhắc nhở kết thúc ca đã qua, không lên lịch thông báo"
    );
    return null;
  }

  // Lên lịch thông báo
  return await scheduleBackgroundNotification(
    "Nhắc nhở hoàn tất ca làm việc",
    `Đã quá giờ kết thúc ca làm việc ${
      shiftInfo ? shiftInfo.name : ""
    }, hãy hoàn tất ca`,
    reminderDate,
    {
      type: "shift_end_reminder",
      shiftId: shiftInfo?.id,
      action: "complete",
    }
  );
};

export default {
  createNotificationChannel,
  scheduleBackgroundNotification,
  onNotificationInteraction,
  cancelBackgroundNotification,
  cancelAllBackgroundNotifications,
  scheduleDepartureReminder,
  scheduleCheckInReminder,
  scheduleCheckOutReminder,
  scheduleShiftEndReminder,
};
