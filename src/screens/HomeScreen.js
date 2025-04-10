import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  FlatList,
  Image,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import {
  format as formatDateFn,
  differenceInMinutes,
  differenceInHours,
  isToday,
  parseISO,
  addDays,
  startOfWeek,
  isBefore,
  differenceInMilliseconds,
  parse,
  addMinutes,
} from "date-fns";
import { vi } from "../utils/viLocale";
import enUS from "date-fns/locale/enUS";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import PushNotification from "react-native-push-notification";
import Toast from "react-native-toast-message";
import TextWrapper from "../components/TextWrapper";

// Contexts & Services
import { useTheme } from "../context/ThemeContext";
import { useLocalization } from "../context/LocalizationContext";
import i18n from "../i18n";
import * as NotificationService from "../services/NotificationService";
import * as AppSettingsStorage from "../storage/AppSettingsStorage";
import MultiActionButton from "../components/MultiActionButton";
import WeeklyStatusGrid from "../components/WeeklyStatusGrid";
import AddNoteModal from "../components/AddNoteModal";
import NoteItem from "../components/NoteItem";

// Kiểm tra xem cấu trúc của date-fns có đúng không
// console.log("date-fns available:", typeof formatDateFn === "function");

// Kiểm tra xem locale có sẵn không
// try {
//   // Cố gắng import và sử dụng không có .js
//   const enUS = require("date-fns/locale/enUS");
//   console.log("Locale en-US available:", enUS);
//
//   // Dùng thử nếu tìm thấy
//   const testDate = new Date();
//   const formattedDate = formatDateFn(testDate, "PPP", { locale: enUS });
//   console.log("Formatted date with locale:", formattedDate);
// } catch (error) {
//   console.error("Error importing locale:", error);
// }

// Hàm định dạng ngày tháng sử dụng Intl API
const formatDateWithIntl = (date, locale = "vi-VN") => {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  } catch (error) {
    console.error("Error formatting date with Intl:", error);
    // Fallback đơn giản
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
};

// Hàm định dạng thời gian sử dụng Intl API
const formatTimeWithIntl = (date, locale = "vi-VN") => {
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(date));
  } catch (error) {
    console.error("Error formatting time with Intl:", error);
    // Fallback đơn giản
    const d = new Date(date);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
};

const HomeScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const { t, locale, changeLocale, setLocale, getDirectTranslation } =
    useLocalization();
  const navigation = useNavigation();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAddNoteModalVisible, setIsAddNoteModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [actionButtonDisabled, setActionButtonDisabled] = useState(false);
  const [confirmResetVisible, setConfirmResetVisible] = useState(false);
  const [confirmActionVisible, setConfirmActionVisible] = useState(false);
  const [nextAction, setNextAction] = useState(null);
  const [currentReminders, setCurrentReminders] = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [workStatus, setWorkStatus] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState("normal"); // 'normal', 'late'
  const [checkOutStatus, setCheckOutStatus] = useState("normal"); // 'normal', 'early'
  const [workDayStatus, setWorkDayStatus] = useState("full"); // 'full', 'rv', 'absent'
  const [shiftInfo, setShiftInfo] = useState(null);
  const [weeklyStatus, setWeeklyStatus] = useState({});
  const [statusDetails, setStatusDetails] = useState({});
  const [notes, setNotes] = useState([]);
  const [actionHistory, setActionHistory] = useState([]);
  const [actionLogs, setActionLogs] = useState([]);
  const [multiActionButtonEnabled, setMultiActionButtonEnabled] =
    useState(true);
  const [showResetButton, setShowResetButton] = useState(false);

  // Lấy thông tin nhắc nhở hiện tại
  // Load multi-action button state
  useEffect(() => {
    const loadMultiActionState = async () => {
      try {
        // Ưu tiên lấy từ AppSettingsStorage để đảm bảo tính nhất quán
        const multiPurposeMode = await AppSettingsStorage.getMultiPurposeMode();
        setMultiActionButtonEnabled(multiPurposeMode);
      } catch (error) {
        console.error("Error loading multi-purpose mode state:", error);
        setMultiActionButtonEnabled(true); // Default to true on error
      }
    };
    loadMultiActionState();
  }, []);

  // Theo dõi sự thay đổi của chế độ nút đa năng khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      const checkMultiPurposeMode = async () => {
        try {
          const multiPurposeMode =
            await AppSettingsStorage.getMultiPurposeMode();
          setMultiActionButtonEnabled(multiPurposeMode);
        } catch (error) {
          console.error("Error checking multi-purpose mode state:", error);
        }
      };

      checkMultiPurposeMode();
    }, [])
  );

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const reminders = await NotificationService.getScheduledNotifications();
        if (reminders) {
          const remindersList = Object.values(reminders);
          setCurrentReminders(remindersList);
        }
      } catch (error) {
        console.error("Error loading reminders:", error);
      }
    };

    loadReminders();

    // Cập nhật mỗi 1 phút
    const intervalId = setInterval(loadReminders, 60000);
    return () => clearInterval(intervalId);
  }, [loadActionLogs]);

  // Cập nhật đồng hồ mỗi giây
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [getActionButton]);

  // Thêm một mục mới vào trạng thái làm việc
  const addWorkEntry = async (status) => {
    try {
      const entry = {
        id: Date.now().toString(),
        status,
        timestamp: new Date().toISOString(),
      };

      // Lấy danh sách hiện tại
      const entriesJson = await AsyncStorage.getItem("workEntries");
      const entries = entriesJson ? JSON.parse(entriesJson) : [];

      // Thêm mục mới
      entries.push(entry);

      // Lưu lại
      await AsyncStorage.setItem("workEntries", JSON.stringify(entries));

      return entry;
    } catch (error) {
      console.error("Lỗi khi thêm mục vào trạng thái làm việc:", error);
      return null;
    }
  };

  // Lấy danh sách mục của ngày hôm nay
  const getTodayEntries = async () => {
    try {
      const entriesJson = await AsyncStorage.getItem("workEntries");
      const entries = entriesJson ? JSON.parse(entriesJson) : [];

      // Lọc chỉ lấy các mục của ngày hôm nay
      return entries.filter((entry) => isToday(parseISO(entry.timestamp)));
    } catch (error) {
      console.error("Lỗi khi lấy danh sách mục của ngày hôm nay:", error);
      return [];
    }
  };

  // Reset trạng thái làm việc của ngày hôm nay
  const resetDayStatus = async () => {
    try {
      const entriesJson = await AsyncStorage.getItem("workEntries");
      let entries = entriesJson ? JSON.parse(entriesJson) : [];

      // Lọc bỏ các mục của ngày hôm nay
      entries = entries.filter((entry) => !isToday(parseISO(entry.timestamp)));

      // Lưu lại
      await AsyncStorage.setItem("workEntries", JSON.stringify(entries));

      return true;
    } catch (error) {
      console.error("Lỗi khi reset trạng thái của ngày hôm nay:", error);
      return false;
    }
  };

  // Update work status and schedule notifications
  const updateInfo = useCallback(async () => {
    // Load shift info
    const currentShift = await AsyncStorage.getItem("currentShift");
    const shiftData = currentShift ? JSON.parse(currentShift) : null;

    if (shiftData) {
      // Schedule notifications for the shift
      const now = new Date();
      const startTime = parse(shiftData.startWorkTime, "HH:mm", now);
      const endTime = parse(shiftData.endWorkTime, "HH:mm", now);
      const departureTime = shiftData.departureTime
        ? parse(shiftData.departureTime, "HH:mm", now)
        : null;

      // Schedule departure reminder
      if (departureTime && shiftData.remindBeforeWork > 0) {
        await NotificationService.scheduleNotification({
          id: `departure_${shiftData.id}`,
          title: t("departure_reminder"),
          message: t("departure_reminder_message", {
            time: shiftData.departureTime,
          }),
          date: addMinutes(departureTime, -shiftData.remindBeforeWork),
          data: { type: "departure", shiftId: shiftData.id },
        });
      }

      // Schedule check-in reminder
      if (shiftData.remindBeforeWork > 0) {
        await NotificationService.scheduleNotification({
          id: `checkin_${shiftData.id}`,
          title: t("checkin_reminder"),
          message: t("checkin_reminder_message", {
            time: shiftData.startWorkTime,
          }),
          date: addMinutes(startTime, -shiftData.remindBeforeWork),
          data: { type: "checkin", shiftId: shiftData.id },
        });
      }

      // Schedule check-out reminder
      if (shiftData.remindAfterWork > 0) {
        await NotificationService.scheduleNotification({
          id: `checkout_${shiftData.id}`,
          title: t("checkout_reminder"),
          message: t("checkout_reminder_message", {
            time: shiftData.endWorkTime,
          }),
          date: addMinutes(endTime, -shiftData.remindAfterWork),
          data: { type: "checkout", shiftId: shiftData.id },
        });
      }
    }

    // Cập nhật lịch sử trạng thái
    const today = await getTodayEntries();
    setTodayEntries(today);

    // Cập nhật trạng thái làm việc
    if (today.length > 0) {
      setWorkStatus(today[today.length - 1].status);
    } else {
      setWorkStatus(null);
    }

    // Cập nhật Button action
    const actionBtn = getActionButton();

    // Debug info
    console.log("Đã cập nhật thông tin:", {
      workStatus,
      todayEntries: today.length,
    });
  }, [workStatus]);

  // Khởi tạo các state mà không hiện popup reset ngay lập tức
  useEffect(() => {
    // Cập nhật UI khi workStatus thay đổi
    updateInfo();

    // Đảm bảo nút luôn có thể nhấn được
    setActionButtonDisabled(false);
  }, [workStatus, updateInfo]);

  // Tải thông tin ca làm việc
  const loadShiftInfo = useCallback(async () => {
    try {
      // Lấy thông tin ca làm việc từ AsyncStorage
      const shiftInfoJson = await AsyncStorage.getItem("currentShift");
      if (shiftInfoJson) {
        const shift = JSON.parse(shiftInfoJson);
        setShiftInfo(shift);
        console.log("Đã tải thông tin ca làm việc:", shift);
      } else {
        setShiftInfo(null);
        console.log("Không có thông tin ca làm việc");
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin ca làm việc:", error);
      setShiftInfo(null);
    }
  }, [getActionButton]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load weekly status from database
        const weeklyStatusData = await DatabaseService.getWeeklyStatus();
        setWeeklyStatus(weeklyStatusData);

        // Load status details from database
        const statusDetailsData = await DatabaseService.getStatusDetails();
        setStatusDetails(statusDetailsData);

        // Load current shift
        const shift = await DatabaseService.getCurrentShift();
        if (shift) {
          setShiftInfo(shift);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadCurrentShift();
    const unsubscribe = navigation.addListener("focus", loadCurrentShift);
    return unsubscribe;
  }, [navigation]);

  // Lấy thông tin ca làm việc và trạng thái khi component được tạo
  useEffect(() => {
    // Khởi tạo thông tin ca làm việc
    loadShiftInfo();

    // Khởi tạo lần đầu
    updateInfo();

    // Tải ghi chú
    loadNotes();
    loadActionLogs();
  }, [loadShiftInfo, updateInfo]);

  // Format date using the current locale
  const formatDate = (date, formatStr = "dd/MM/yyyy") => {
    try {
      return formatDateFn(date, formatStr, {
        locale: locale === "vi" ? vi : enUS,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      // Fallback không sử dụng locale
      return formatDateFn(date, formatStr);
    }
  };

  // Format time
  const formatTime = (date) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      return `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes()
      ).padStart(2, "0")}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  };

  // Format shift time
  const formatShiftTime = (timeString) => {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  // Find latest entry by status
  const findLatestEntryByStatus = (status) => {
    const filteredEntries = todayEntries.filter(
      (entry) => entry.status === status
    );
    if (filteredEntries.length === 0) return null;

    return filteredEntries.reduce((latest, current) => {
      return new Date(current.timestamp) > new Date(latest.timestamp)
        ? current
        : latest;
    }, filteredEntries[0]);
  };

  // Get today's history entries
  const getTodayStatus = async () => {
    // Lọc các mục của ngày hôm nay
    const todayEntries = await getTodayEntries();
    const filteredEntries = todayEntries.filter((entry) =>
      isToday(parseISO(entry.timestamp))
    );
    const sortedEntries = filteredEntries.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Tạo map để lưu trữ mục mới nhất cho mỗi loại trạng thái
    const uniqueStatusMap = new Map();

    // Duyệt qua để lấy mục mới nhất cho mỗi trạng thái
    sortedEntries.forEach((entry) => {
      if (
        !uniqueStatusMap.has(entry.status) ||
        new Date(entry.timestamp) >
          new Date(uniqueStatusMap.get(entry.status).timestamp)
      ) {
        uniqueStatusMap.set(entry.status, entry);
      }
    });

    // Chuyển đổi map thành mảng và sắp xếp theo thứ tự thời gian
    const uniqueEntries = Array.from(uniqueStatusMap.values()).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    return uniqueEntries;
  };

  const goWorkEntry = findLatestEntryByStatus("go_work");
  const checkInEntry = findLatestEntryByStatus("check_in");
  const checkOutEntry = findLatestEntryByStatus("check_out");
  const completeEntry = findLatestEntryByStatus("complete");

  // Kiểm tra xem hành động có cần xác nhận không dựa trên thời gian
  const shouldShowConfirmation = (action) => {
    let needsConfirmation = false;

    if (action === "check_in" && goWorkEntry) {
      // Kiểm tra thời gian giữa go_work và check_in (ít nhất 5 phút)
      const goWorkTime = parseISO(goWorkEntry.timestamp);
      const timeDiffMinutes = differenceInMinutes(new Date(), goWorkTime);

      if (timeDiffMinutes < 5) {
        setConfirmMessage(i18n.t("time_validation_check_in"));
        console.log(
          `Thời gian giữa đi làm và chấm công vào: ${timeDiffMinutes} phút, cần tối thiểu 5 phút`
        );
        needsConfirmation = true;
      }
    } else if (action === "check_out" && checkInEntry) {
      // Kiểm tra thời gian giữa check_in và check_out (ít nhất 2 giờ)
      const checkInTime = parseISO(checkInEntry.timestamp);
      const hoursDiff = differenceInHours(new Date(), checkInTime);

      if (hoursDiff < 2) {
        setConfirmMessage(i18n.t("time_validation_check_out"));
        console.log(
          `Thời gian làm việc: ${hoursDiff} giờ, cần tối thiểu 2 giờ`
        );
        needsConfirmation = true;
      }
    }

    return needsConfirmation;
  };

  // Thực hiện hành động sau khi đã xác nhận hoặc không cần xác nhận
  const performAction = async (action) => {
    try {
      let success = false;
      switch (action) {
        case "go_work":
          success = await handleGoWork();
          break;
        case "check_in":
          success = await handleCheckIn();
          break;
        case "check_out":
          success = await handleCheckOut();
          break;
        case "complete":
          success = await handleComplete();
          break;
        default:
          console.log("Unknown action:", action);
      }

      if (success) {
        // Cập nhật UI ngay lập tức
        updateInfo();

        // Đặt lại nút để có thể sử dụng lại
        setTimeout(() => {
          setActionButtonDisabled(false);
        }, 500);
      } else {
        setActionButtonDisabled(false);
      }
    } catch (error) {
      console.error("Error performing action:", error);
      setActionButtonDisabled(false);
    }
  };

  // Xác nhận hành động từ popup
  const confirmAction = async () => {
    try {
      // Đóng popup xác nhận
      setConfirmActionVisible(false);

      if (nextAction) {
        // Thực hiện hành động đã được xác nhận
        await executeAction(nextAction);

        // Đặt lại nextAction để tránh xung đột
        setNextAction(null);
      }
    } catch (error) {
      console.error("Lỗi khi xác nhận công việc:", error);
      Alert.alert(i18n.t("error"), i18n.t("action_execution_error"), [
        { text: i18n.t("ok") },
      ]);
      setNextAction(null);
    }
  };

  // Xử lý khi bấm "Đi làm"
  const handleGoWork = async () => {
    try {
      // Cập nhật trạng thái "Đi làm"
      const newEntry = await addWorkEntry("go_work");

      if (newEntry) {
        console.log('Đã thêm mục "Đi làm":', newEntry);

        // Cập nhật danh sách
        const updatedEntries = await getTodayEntries();
        setTodayEntries(updatedEntries);

        // Cập nhật trạng thái làm việc
        setWorkStatus("go_work");

        // Hiển thị nút reset khi bấm "Đi làm"
        setShowResetButton(true);

        // Vô hiệu hóa nút đa năng nếu chế độ "chỉ bấm đi làm" đang bật
        if (!multiActionButtonEnabled) {
          setActionButtonDisabled(true);
        }

        // Hủy thông báo nhắc nhở xuất phát vì đã thực hiện
        await NotificationService.cancelRemindersByAction("go_work");

        // Kiểm tra thời gian và thêm thông báo trạng thái
        const currentShift = await getCurrentShift();
        if (currentShift && currentShift.startTime) {
          const now = new Date();
          const [startHour, startMinute] = currentShift.startTime
            .split(":")
            .map(Number);
          const startTime = new Date(now);
          startTime.setHours(startHour, startMinute, 0, 0);

          // Nếu đi làm sớm, không cần hiển thị thông báo
          if (now < startTime) {
            Toast.show({
              type: "success",
              text1: t("early_departure_success"),
              position: "bottom",
            });
          }
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Lỗi khi thêm mục "Đi làm":', error);
      return false;
    }
  };

  // Xử lý khi bấm "Chấm công vào"
  const handleCheckIn = async () => {
    try {
      // Kiểm tra xem đã đi làm chưa
      if (!goWorkEntry) {
        Alert.alert(i18n.t("error"), i18n.t("must_go_work_first_message"), [
          { text: i18n.t("ok") },
        ]);
        return false;
      }

      // Cập nhật trạng thái "Chấm công vào"
      const newEntry = await addWorkEntry("check_in");

      if (newEntry) {
        console.log('Đã thêm mục "Chấm công vào":', newEntry);

        // Cập nhật danh sách
        const updatedEntries = await getTodayEntries();
        setTodayEntries(updatedEntries);

        // Cập nhật trạng thái làm việc
        setWorkStatus("check_in");

        // Hủy thông báo nhắc nhở chấm công vào vì đã thực hiện
        await NotificationService.cancelRemindersByAction("check_in");

        // Kiểm tra thời gian và thêm thông báo trạng thái
        const currentShift = await getCurrentShift();
        if (currentShift && currentShift.startTime) {
          const now = new Date();
          const [startHour, startMinute] = currentShift.startTime
            .split(":")
            .map(Number);
          const startTime = new Date(now);
          startTime.setHours(startHour, startMinute, 0, 0);

          // Nếu chấm công vào muộn, hiển thị cảnh báo
          if (now > startTime) {
            const minutesLate = differenceInMinutes(now, startTime);
            if (minutesLate > 5) {
              Toast.show({
                type: "warning",
                text1: t("late_check_in_warning"),
                position: "bottom",
              });

              // Cập nhật trạng thái là "RV" (vào muộn)
              await updateWorkStatus("rv");
            }
          }
        }

        // Lên lịch thông báo nhắc nhở giờ hành chính kết thúc
        scheduleOfficeEndReminder();

        return true;
      }
      return false;
    } catch (error) {
      console.error('Lỗi khi thêm mục "Chấm công vào":', error);
      return false;
    }
  };

  // Xử lý khi bấm "Chấm công ra"
  const handleCheckOut = async () => {
    try {
      // Kiểm tra xem đã chấm công vào chưa
      if (!checkInEntry) {
        Alert.alert(i18n.t("error"), i18n.t("must_check_in_first_message"), [
          { text: i18n.t("ok") },
        ]);
        return false;
      }

      // Cập nhật trạng thái "Chấm công ra"
      const newEntry = await addWorkEntry("check_out");

      if (newEntry) {
        console.log('Đã thêm mục "Chấm công ra":', newEntry);

        // Cập nhật danh sách
        const updatedEntries = await getTodayEntries();
        setTodayEntries(updatedEntries);

        // Cập nhật trạng thái làm việc
        setWorkStatus("check_out");

        // Hủy thông báo nhắc nhở chấm công ra vì đã thực hiện
        await NotificationService.cancelRemindersByAction("check_out");

        // Kiểm tra thời gian và thêm thông báo trạng thái
        const currentShift = await getCurrentShift();
        if (currentShift && currentShift.officeEndTime) {
          const now = new Date();
          const [endHour, endMinute] = currentShift.officeEndTime
            .split(":")
            .map(Number);
          const endTime = new Date(now);
          endTime.setHours(endHour, endMinute, 0, 0);

          // Nếu chấm công ra sớm, hiển thị cảnh báo
          if (now < endTime) {
            const minutesEarly = differenceInMinutes(endTime, now);
            if (minutesEarly > 5) {
              Toast.show({
                type: "warning",
                text1: t("early_check_out_warning"),
                position: "bottom",
              });

              // Cập nhật trạng thái là "RV" (ra sớm)
              await updateWorkStatus("rv");
            }
          }
        }

        // Lên lịch thông báo nhắc nhở kết thúc ca
        scheduleShiftEndReminder();

        return true;
      }
      return false;
    } catch (error) {
      console.error('Lỗi khi thêm mục "Chấm công ra":', error);
      return false;
    }
  };

  // Xử lý khi bấm "Hoàn tất"
  const handleComplete = async () => {
    try {
      // Kiểm tra xem đã chấm công ra chưa
      if (!checkOutEntry) {
        Alert.alert(i18n.t("error"), i18n.t("must_check_out_first_message"), [
          { text: i18n.t("ok") },
        ]);
        return false;
      }

      // Cập nhật trạng thái "Hoàn tất"
      const newEntry = await addWorkEntry("complete");

      if (newEntry) {
        console.log('Đã thêm mục "Hoàn tất":', newEntry);

        // Cập nhật danh sách
        const updatedEntries = await getTodayEntries();
        setTodayEntries(updatedEntries);

        // Cập nhật trạng thái làm việc thành "completed" để vô hiệu hóa nút
        setWorkStatus("completed");

        // Hủy thông báo nhắc nhở hoàn tất vì đã thực hiện
        await NotificationService.cancelRemindersByAction("complete");

        // Lưu lịch sử làm việc (work_log)
        await saveWorkLog();

        // Tính toán giờ công
        await calculateAndSaveWorkHours();

        // Cập nhật trạng thái tuần
        await updateWeeklyStatus();

        // Hiển thị nút reset nhỏ ở góc của nút đa năng
        setShowResetButton(true);

        // Hiển thị thông báo
        Toast.show({
          type: "success",
          text1: t("work_completed_success"),
          position: "bottom",
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error('Lỗi khi thêm mục "Hoàn tất":', error);
      return false;
    }
  };

  // Lên lịch thông báo nhắc nhở giờ hành chính kết thúc
  const scheduleOfficeEndReminder = async () => {
    try {
      const currentShift = await getCurrentShift();
      if (!currentShift || !currentShift.officeEndTime) {
        console.log(
          "Không có thông tin ca làm việc hoặc giờ kết thúc hành chính"
        );
        return;
      }

      // Hủy thông báo cũ nếu có
      await NotificationService.cancelNotification("office-end-reminder");

      // Lên lịch thông báo mới
      await NotificationService.scheduleOfficeEndReminder(
        currentShift.officeEndTime,
        currentShift
      );

      console.log("Đã lên lịch thông báo nhắc nhở giờ hành chính kết thúc");
    } catch (error) {
      console.error(
        "Lỗi khi lên lịch thông báo nhắc nhở giờ hành chính kết thúc:",
        error
      );
    }
  };

  // Lên lịch thông báo nhắc nhở kết thúc ca
  const scheduleShiftEndReminder = async () => {
    try {
      const currentShift = await getCurrentShift();
      if (!currentShift) return;

      // Đảm bảo có ngày/thời gian hợp lệ
      const now = new Date();
      const endTimeParts = currentShift.endWorkTime.split(":");
      const endTime = new Date();
      endTime.setHours(parseInt(endTimeParts[0], 10));
      endTime.setMinutes(parseInt(endTimeParts[1], 10));

      // Nếu thời gian kết thúc đã qua, không cần lên lịch
      if (endTime <= now) return;

      // Tính toán thời gian để thông báo (15 phút trước khi kết thúc)
      const reminderTime = new Date(endTime);
      reminderTime.setMinutes(
        reminderTime.getMinutes() - (currentShift.remindAfterWork || 15)
      );

      // Sử dụng service thông báo tương thích đa nền tảng
      await NotificationService.scheduleNotification({
        title: t("shift_end_reminder_title"),
        body: t("shift_end_reminder_body", { time: currentShift.endWorkTime }),
        data: { type: "shift_end", shiftId: currentShift.id },
        trigger: Platform.OS !== "web" ? { date: reminderTime } : null,
      });

      console.log(
        `Đã lên lịch nhắc nhở kết thúc ca làm: ${reminderTime.toLocaleString()}`
      );
    } catch (error) {
      console.error("Lỗi khi lên lịch nhắc nhở kết thúc ca làm:", error);
    }
  };

  // Cập nhật trạng thái công
  const updateWorkStatus = async (status) => {
    try {
      const today = formatDateFn(new Date(), "yyyy-MM-dd");
      await AsyncStorage.setItem(`workStatus_${today}`, status);

      // Cập nhật trạng thái tuần
      const weeklyStatusCopy = { ...weeklyStatus };
      weeklyStatusCopy[today] = status;
      setWeeklyStatus(weeklyStatusCopy);
      await AsyncStorage.setItem(
        "weeklyStatus",
        JSON.stringify(weeklyStatusCopy)
      );

      console.log(`Đã cập nhật trạng thái công cho ngày ${today}: ${status}`);
      return true;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái công:", error);
      return false;
    }
  };

  // Lấy thông tin ca làm việc hiện tại
  const getCurrentShift = async () => {
    try {
      const shiftData = await AsyncStorage.getItem("currentShift");
      if (shiftData) {
        return JSON.parse(shiftData);
      }

      // Trả về ca mặc định nếu không có dữ liệu
      return {
        name: "Ca Sáng",
        departureTime: "07:10",
        startTime: "08:00",
        officeEndTime: "17:00",
        endTime: "20:00",
      };
    } catch (error) {
      console.error("Lỗi khi lấy thông tin ca làm việc hiện tại:", error);
      return null;
    }
  };

  // Hàm để xử lý thêm ghi chú
  const handleAddNote = () => {
    setSelectedNote(null);
    setIsAddNoteModalVisible(true);
  };

  // Hàm để xử lý chỉnh sửa ghi chú
  const handleEditNote = (note) => {
    setSelectedNote(note);
    setIsAddNoteModalVisible(true);
  };

  // Hàm để xử lý xóa ghi chú
  const handleDeleteNote = async (noteId) => {
    try {
      const notesJson = await AsyncStorage.getItem("notes");
      if (notesJson) {
        const notesData = JSON.parse(notesJson);
        const updatedNotes = notesData.filter((note) => note.id !== noteId);
        await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
        setNotes(updatedNotes);
      }
    } catch (error) {
      console.error("Lỗi khi xóa ghi chú:", error);
    }
  };

  // Hàm để xử lý lưu ghi chú
  const handleSaveNote = async (noteData) => {
    try {
      let notesJson = await AsyncStorage.getItem("notes");
      let notesData = notesJson ? JSON.parse(notesJson) : [];

      if (selectedNote) {
        // Cập nhật ghi chú hiện có
        notesData = notesData.map((note) =>
          note.id === selectedNote.id
            ? { ...noteData, id: selectedNote.id }
            : note
        );
      } else {
        // Thêm ghi chú mới
        notesData.push({ ...noteData, id: Date.now().toString() });
      }

      await AsyncStorage.setItem("notes", JSON.stringify(notesData));
      setNotes(notesData);
      setIsAddNoteModalVisible(false);
    } catch (error) {
      console.error("Lỗi khi lưu ghi chú:", error);
    }
  };

  // Lấy thông tin ghi chú
  const loadNotes = async () => {
    try {
      const notesJson = await AsyncStorage.getItem("notes");
      if (notesJson) {
        const notesData = JSON.parse(notesJson);
        setNotes(notesData);
      }
    } catch (error) {
      console.error("Lỗi khi tải ghi chú:", error);
      setNotes([]); // Đặt mặc định là mảng rỗng nếu có lỗi
    }
  };

  // Load lịch sử bấm nút
  const loadActionLogs = async () => {
    try {
      // Lấy lịch sử từ AsyncStorage
      const logs = await getTodayActionLogs();
      setActionLogs(logs);
    } catch (error) {
      console.error("Lỗi khi tải lịch sử bấm nút:", error);
    }
  };

  // Lấy lịch sử bấm nút trong ngày
  const getTodayActionLogs = async () => {
    try {
      const today = formatDateFn(new Date(), "yyyy-MM-dd");
      const logsKey = `actionLogs_${today}`;
      const logsJson = await AsyncStorage.getItem(logsKey);

      if (logsJson) {
        const logs = JSON.parse(logsJson);
        return logs.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
      }

      return [];
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử bấm nút:", error);
      return [];
    }
  };

  // Lưu lịch sử bấm nút
  const saveActionLog = async (action) => {
    try {
      const newLog = {
        action,
        timestamp: new Date().toISOString(),
      };

      // Lưu vào danh sách hiện tại
      const newLogs = [newLog, ...actionLogs].slice(0, 10); // Chỉ giữ 10 mục gần nhất
      setActionLogs(newLogs);

      // Lưu xuống storage
      await AsyncStorage.setItem("actionLogs", JSON.stringify(newLogs));

      console.log("Đã lưu lịch sử bấm nút:", newLog);
      return true;
    } catch (error) {
      console.error("Lỗi khi lưu lịch sử bấm nút:", error);
      return false;
    }
  };

  // Xử lý hành động từ nút đa năng
  const handleActionButtonPress = () => {
    console.log("Action pressed:", actionButton.status);

    // Vô hiệu hóa nút để tránh nhấn nhiều lần
    setActionButtonDisabled(true);

    // Lấy hành động từ trạng thái nút
    const action = actionButton.status;

    // Kiểm tra nếu hành động đã hoàn thành
    if (action === "completed") {
      setActionButtonDisabled(false);
      return;
    }

    // Đặt nextAction
    setNextAction(action);

    // Kiểm tra nếu cần xác nhận (kiểm tra thời gian)
    const needsConfirmation = shouldShowConfirmation(action);
    if (needsConfirmation) {
      setConfirmActionVisible(true);
    } else {
      // Nếu không cần xác nhận, thực hiện hành động ngay lập tức
      performAction(action);
    }
  };

  // Xử lý khi bấm nút đơn trong chế độ multi_purpose_mode = false
  const handleSingleButtonPress = async () => {
    try {
      console.log("Single button pressed in simplified mode");

      // Xử lý nút đơn
      const timestamp = new Date().toISOString();
      await addWorkEntry("go_work");

      // Lưu lịch sử
      await saveActionLog("go_work");

      // Hủy các thông báo hiện tại
      await NotificationService.cancelAllNotifications();

      // Hiển thị thông báo người dùng
      showToast("success", t("action_saved"));

      // Cập nhật danh sách
      const updatedEntries = await getTodayEntries();
      setTodayEntries(updatedEntries);

      // Cập nhật trạng thái làm việc
      setWorkStatus("go_work");

      // Hiển thị nút reset
      setShowResetButton(true);

      // Lưu lịch sử vào thống kê
      await saveWorkActionHistory("go_work");

      // Hiển thị thông báo thành công
      Toast.show({
        type: "success",
        text1: t("work_started"),
        position: "bottom",
      });

      // Cập nhật UI
      await updateInfo();
    } catch (error) {
      console.error("Lỗi khi xử lý nút đơn:", error);
      showToast("error", t("action_error"));
    }
  };

  // Thực hiện hành động
  const executeAction = async (action) => {
    let success = false;

    try {
      console.log(`Đang thực hiện hành động: ${action}`);

      // Lưu lịch sử bấm nút ngay khi bắt đầu thực hiện hành động
      await saveActionLog(action);

      // Xử lý theo loại hành động
      if (action === "go_work") {
        success = await handleGoWork();
      } else if (action === "check_in") {
        success = await handleCheckIn();
      } else if (action === "check_out") {
        success = await handleCheckOut();
      } else if (action === "complete") {
        success = await handleComplete();
      }

      if (success) {
        // Cập nhật giao diện người dùng
        await updateInfo();

        // Đặt lại nút để có thể sử dụng lại
        setTimeout(() => {
          setActionButtonDisabled(false);
        }, 500);

        // Hủy thông báo nhắc nhở tương ứng
        await NotificationService.cancelRemindersByAction(action);

        // Lưu lịch sử vào thống kê
        await saveWorkActionHistory(action);

        // Nếu là hành động hoàn tất, vô hiệu hóa nút
        if (action === "complete") {
          setActionButtonDisabled(true);
          setShowResetButton(true);
        }
      } else {
        setActionButtonDisabled(false);
      }
    } catch (error) {
      console.error("Lỗi khi thực hiện hành động:", error);
      Alert.alert(i18n.t("error"), i18n.t("action_execution_error"), [
        { text: i18n.t("ok") },
      ]);
      setActionButtonDisabled(false);
    } finally {
      // Đóng dialog xác nhận nếu đang mở
      setConfirmActionVisible(false);
    }
  };

  // Lưu lịch sử hành động vào thống kê
  const saveWorkActionHistory = async (action) => {
    try {
      // Lấy thời gian hiện tại
      const now = new Date();
      const today = formatDateFn(now, "yyyy-MM-dd");

      // Tạo đối tượng lịch sử hành động
      const actionHistory = {
        action,
        timestamp: now.toISOString(),
        weekNumber: getWeekNumber(now),
        month: formatDateFn(now, "MM-yyyy"),
      };

      // Lấy lịch sử hành động hiện có
      const historyJson = await AsyncStorage.getItem("workActionHistory");
      let history = historyJson ? JSON.parse(historyJson) : [];

      // Thêm hành động mới vào lịch sử
      history.push(actionHistory);

      // Lưu lịch sử cập nhật
      await AsyncStorage.setItem("workActionHistory", JSON.stringify(history));
      console.log(`Đã lưu lịch sử hành động: ${action}`);

      // Cập nhật thống kê tuần/tháng
      await updateWorkStatistics(action, now);

      return true;
    } catch (error) {
      console.error("Lỗi khi lưu lịch sử hành động:", error);
      return false;
    }
  };

  // Cập nhật thống kê thời gian làm việc
  const updateWorkStatistics = async (action, timestamp) => {
    try {
      // Nếu hành động là hoàn tất (đã kết thúc ca làm việc)
      if (action === "complete" && checkInEntry && checkOutEntry) {
        const checkInTime = parseISO(checkInEntry.timestamp);
        const checkOutTime = parseISO(checkOutEntry.timestamp);

        // Tính toán thời gian làm việc thực tế (phút)
        const workTimeMinutes = differenceInMinutes(checkOutTime, checkInTime);

        // Lấy thông tin ca làm việc để tính giờ chuẩn
        const currentShift = await getCurrentShift();
        let standardWorkMinutes = 480; // 8 giờ mặc định

        if (
          currentShift &&
          currentShift.startTime &&
          currentShift.officeEndTime
        ) {
          const [startHour, startMinute] = currentShift.startTime
            .split(":")
            .map(Number);
          const [endHour, endMinute] = currentShift.officeEndTime
            .split(":")
            .map(Number);

          // Tính số phút chuẩn từ giờ bắt đầu đến kết thúc
          const shiftStartMinutes = startHour * 60 + startMinute;
          const shiftEndMinutes = endHour * 60 + endMinute;
          standardWorkMinutes = shiftEndMinutes - shiftStartMinutes;
        }

        // Tính giờ làm việc thực tế và giờ tăng ca
        const regularHours =
          Math.min(workTimeMinutes, standardWorkMinutes) / 60;
        const overtimeHours = Math.max(
          0,
          (workTimeMinutes - standardWorkMinutes) / 60
        );

        // Tạo đối tượng dữ liệu thống kê
        const workDate = formatDateFn(timestamp, "yyyy-MM-dd");
        const weekNumber = getWeekNumber(timestamp);
        const monthYear = formatDateFn(timestamp, "MM-yyyy");

        const workStats = {
          date: workDate,
          week: weekNumber,
          month: monthYear,
          regularHours: Number(regularHours.toFixed(2)),
          overtimeHours: Number(overtimeHours.toFixed(2)),
          totalHours: Number((regularHours + overtimeHours).toFixed(2)),
          status: workDayStatus || "full", // Trạng thái ngày làm việc (full, rv, absent)
          timestamp: timestamp.toISOString(),
        };

        // Lưu thống kê cho ngày hiện tại
        await AsyncStorage.setItem(
          `workStats_${workDate}`,
          JSON.stringify(workStats)
        );

        // Cập nhật thống kê tuần
        await updateWeeklyStatistics(weekNumber, workStats);

        // Cập nhật thống kê tháng
        await updateMonthlyStatistics(monthYear, workStats);

        console.log("Đã cập nhật thống kê thời gian làm việc:", workStats);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thống kê thời gian làm việc:", error);
    }
  };

  // Cập nhật thống kê tuần
  const updateWeeklyStatistics = async (weekNumber, dailyStats) => {
    try {
      // Lấy thống kê tuần hiện tại
      const weekStatsKey = `weekStats_${weekNumber}`;
      const weekStatsJson = await AsyncStorage.getItem(weekStatsKey);
      let weekStats = weekStatsJson
        ? JSON.parse(weekStatsJson)
        : {
            weekNumber,
            year: new Date().getFullYear(),
            days: {},
            totalRegularHours: 0,
            totalOvertimeHours: 0,
            totalHours: 0,
          };

      // Cập nhật thông tin ngày
      weekStats.days[dailyStats.date] = {
        date: dailyStats.date,
        regularHours: dailyStats.regularHours,
        overtimeHours: dailyStats.overtimeHours,
        totalHours: dailyStats.totalHours,
        status: dailyStats.status,
      };

      // Tính lại tổng giờ cho tuần
      let totalRegular = 0;
      let totalOvertime = 0;
      let totalHours = 0;

      Object.values(weekStats.days).forEach((day) => {
        totalRegular += day.regularHours || 0;
        totalOvertime += day.overtimeHours || 0;
        totalHours += day.totalHours || 0;
      });

      weekStats.totalRegularHours = Number(totalRegular.toFixed(2));
      weekStats.totalOvertimeHours = Number(totalOvertime.toFixed(2));
      weekStats.totalHours = Number(totalHours.toFixed(2));

      // Lưu thống kê tuần cập nhật
      await AsyncStorage.setItem(weekStatsKey, JSON.stringify(weekStats));
      console.log(`Đã cập nhật thống kê tuần ${weekNumber}:`, weekStats);
    } catch (error) {
      console.error("Lỗi khi cập nhật thống kê tuần:", error);
    }
  };

  // Cập nhật thống kê tháng
  const updateMonthlyStatistics = async (monthYear, dailyStats) => {
    try {
      // Lấy thống kê tháng hiện tại
      const monthStatsKey = `monthStats_${monthYear}`;
      const monthStatsJson = await AsyncStorage.getItem(monthStatsKey);
      let monthStats = monthStatsJson
        ? JSON.parse(monthStatsJson)
        : {
            month: monthYear,
            days: {},
            totalRegularHours: 0,
            totalOvertimeHours: 0,
            totalHours: 0,
            daysWorked: 0,
            daysFullWork: 0,
            daysRV: 0,
          };

      // Cập nhật thông tin ngày
      const isNewDay = !monthStats.days[dailyStats.date];
      monthStats.days[dailyStats.date] = {
        date: dailyStats.date,
        regularHours: dailyStats.regularHours,
        overtimeHours: dailyStats.overtimeHours,
        totalHours: dailyStats.totalHours,
        status: dailyStats.status,
      };

      // Cập nhật thống kê số ngày
      if (isNewDay) {
        monthStats.daysWorked++;

        if (dailyStats.status === "full") {
          monthStats.daysFullWork++;
        } else if (dailyStats.status === "rv") {
          monthStats.daysRV++;
        }
      } else {
        // Nếu đã có ngày này nhưng trạng thái thay đổi
        const oldStatus = monthStats.days[dailyStats.date].status;
        if (oldStatus !== dailyStats.status) {
          if (oldStatus === "full") monthStats.daysFullWork--;
          if (oldStatus === "rv") monthStats.daysRV--;

          if (dailyStats.status === "full") monthStats.daysFullWork++;
          if (dailyStats.status === "rv") monthStats.daysRV++;
        }
      }

      // Tính lại tổng giờ cho tháng
      let totalRegular = 0;
      let totalOvertime = 0;
      let totalHours = 0;

      Object.values(monthStats.days).forEach((day) => {
        totalRegular += day.regularHours || 0;
        totalOvertime += day.overtimeHours || 0;
        totalHours += day.totalHours || 0;
      });

      monthStats.totalRegularHours = Number(totalRegular.toFixed(2));
      monthStats.totalOvertimeHours = Number(totalOvertime.toFixed(2));
      monthStats.totalHours = Number(totalHours.toFixed(2));

      // Lưu thống kê tháng cập nhật
      await AsyncStorage.setItem(monthStatsKey, JSON.stringify(monthStats));
      console.log(`Đã cập nhật thống kê tháng ${monthYear}:`, monthStats);
    } catch (error) {
      console.error("Lỗi khi cập nhật thống kê tháng:", error);
    }
  };

  // Hàm lấy số tuần trong năm
  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-${weekNumber}`;
  };

  // Hàm xác định nút hành động dựa vào trạng thái hiện tại
  const getActionButton = () => {
    try {
      // Logic hiện tại của bạn
      // ...

      // Đảm bảo luôn trả về JSX hợp lệ
      return (
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => handleActionButtonPress()}
        >
          <Text style={styles.actionButtonText}>{t("action")}</Text>
        </TouchableOpacity>
      );
    } catch (error) {
      console.error("Lỗi trong getActionButton:", error);
      // Trả về JSX mặc định khi có lỗi
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          onPress={() => console.log("Fallback button pressed")}
        >
          <Text style={styles.actionButtonText}>Error</Text>
        </TouchableOpacity>
      );
    }
  };

  // Hiển thị thông tin thời gian dựa trên trạng thái
  const renderStatusTime = () => {
    if (!goWorkEntry) {
      return i18n.t("not_started_yet");
    }

    switch (workStatus) {
      case "go_work":
        return (
          formatDateFn(new Date(goWorkEntry.timestamp), "HH:mm") +
          " - " +
          i18n.t("work_started")
        );
      case "check_in":
        return (
          formatDateFn(new Date(checkInEntry.timestamp), "HH:mm") +
          " - " +
          i18n.t("checked_in")
        );
      case "check_out":
        return (
          formatDateFn(new Date(checkOutEntry.timestamp), "HH:mm") +
          " - " +
          i18n.t("checked_out")
        );
      case "complete":
      case "completed":
        return (
          formatDateFn(
            new Date(completeEntry?.timestamp || new Date()),
            "HH:mm"
          ) +
          " - " +
          i18n.t("work_completed")
        );
      default:
        return i18n.t("not_started_yet");
    }
  };

  const renderActionButton = () => {
    try {
      if (workStatus === "completed") {
        return (
          <View style={styles.actionButtonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.disabledButton]}
              disabled={true}
            >
              <Text style={styles.actionButtonText}>
                {safeT("completed", "Hoàn Tất")}
              </Text>
            </TouchableOpacity>
            {/* Nút Reset */}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPress}
            >
              <Icon name="refresh" size={20} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>
        );
      }

      // Nút đa năng - sửa để sử dụng khóa dịch đúng
      if (multiActionButtonEnabled) {
        return (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleSingleButtonPress}
          >
            <Text style={styles.actionButtonText}>
              {safeT("goToWork", "Đi Làm")}
            </Text>
          </TouchableOpacity>
        );
      }

      // Các trường hợp khác
      return getActionButton();
    } catch (error) {
      console.error("Lỗi trong renderActionButton:", error);
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          onPress={() => console.log("Nút dự phòng được nhấn")}
        >
          <Text style={styles.actionButtonText}>Đi Làm</Text>
        </TouchableOpacity>
      );
    }
  };

  const actionButton = getActionButton();

  // Nút reset hiển thị sau khi bấm "Đi Làm" và sau khi hoàn thành
  // Đã chuyển thành state để có thể điều khiển hiển thị

  // Xử lý reset work status
  const handleResetPress = () => {
    // Hiển thị modal xác nhận
    setConfirmResetVisible(true);
  };

  // Xử lý xác nhận reset
  const handleResetConfirm = async () => {
    try {
      // Reset trạng thái làm việc của ngày hôm nay
      const success = await resetDayStatus();

      if (success) {
        // Sử dụng hàm showToast thay vì gọi trực tiếp
        showToast("success", t("reset_success"));

        // Cập nhật trạng thái và UI
        setWorkStatus(null);
        setTodayEntries([]);

        // Đặt lại trạng thái của nút đa năng và nút reset
        setActionButtonDisabled(false);
        setShowResetButton(false);

        // Nếu multi_purpose_mode = true, cần kích hoạt lại các nhắc nhở
        if (multiActionButtonEnabled) {
          // Lấy thông tin ca làm việc hiện tại
          const shiftData = await getCurrentShift();
          if (shiftData) {
            // Lên lịch lại tất cả các thông báo nhắc nhở
            await NotificationService.scheduleShiftReminders(
              shiftData,
              await NotificationService.loadReminderType()
            );
            console.log("Đã khởi động lại các thông báo nhắc nhở");
          }
        }
      } else {
        // Hiển thị thông báo lỗi
        Toast.show({
          type: "error",
          text1: t("reset_error"),
          position: "bottom",
        });
      }
    } catch (error) {
      console.error("Lỗi khi reset trạng thái:", error);
      showToast("error", t("reset_error"));
    } finally {
      // Đóng modal xác nhận
      setConfirmResetVisible(false);
    }
  };

  // Hiển thị lịch sử bấm nút - chỉ hiển thị 3 dòng gần nhất
  const renderActionHistory = () => {
    if (todayEntries.length === 0) {
      return (
        <Text
          style={[styles.emptyListText, { color: theme.colors.textSecondary }]}
        >
          {i18n.t("no_history_today")}
        </Text>
      );
    }

    // Sắp xếp các mục theo thời gian mới nhất
    const sortedEntries = [...todayEntries].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Lọc các mục dựa vào chế độ nút đa năng
    let filteredEntries;
    if (!multiActionButtonEnabled) {
      // Chỉ hiển thị thời gian bấm "Đi làm" và "Hoàn thành" (nếu có)
      filteredEntries = sortedEntries.filter(
        (entry) => entry.status === "go_work" || entry.status === "complete"
      );
    } else {
      // Hiển thị tất cả các mục
      filteredEntries = sortedEntries;
    }

    // Lấy 3 mục gần nhất
    const recentEntries = filteredEntries.slice(0, 3);

    return (
      <View style={styles.actionHistoryContainer}>
        {recentEntries.map((entry, index) => (
          <View key={index} style={styles.actionHistoryItem}>
            <Ionicons
              name={getIconForStatus(entry.status)}
              size={16}
              color={getColorForStatus(entry.status, theme)}
            />
            <Text
              style={[styles.actionHistoryText, { color: theme.colors.text }]}
            >
              {getActionName(entry.status)}:{" "}
              {formatDateFn(parseISO(entry.timestamp), "HH:mm")}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Hàm lấy tên hành động theo loại
  const getActionName = (action) => {
    switch (action) {
      case "go_work":
        return i18n.t("goToWork");
      case "check_in":
        return i18n.t("checkIn");
      case "check_out":
        return i18n.t("checkOut");
      case "complete":
        return i18n.t("complete");
      default:
        return "";
    }
  };

  // Hàm lấy icon tương ứng với trạng thái
  const getIconForStatus = (status) => {
    switch (status) {
      case "go_work":
        return "briefcase-outline";
      case "check_in":
        return "log-in-outline";
      case "check_out":
        return "log-out-outline";
      case "complete":
        return "checkmark-done-outline";
      default:
        return "time-outline";
    }
  };

  // Hàm lấy màu tương ứng với trạng thái
  const getColorForStatus = (status, theme) => {
    switch (status) {
      case "go_work":
        return theme.colors.goWorkButton;
      case "check_in":
        return theme.colors.checkInButton;
      case "check_out":
        return theme.colors.checkOutButton;
      case "complete":
        return theme.colors.completeButton;
      default:
        return theme.colors.textSecondary;
    }
  };

  // State cho trạng thái tuần và chi tiết

  // Tải dữ liệu trạng thái tuần khi màn hình được hiển thị
  useFocusEffect(
    useCallback(() => {
      loadWeeklyStatus();
      loadStatusDetails();
    }, [])
  );

  // Hàm tải dữ liệu trạng thái tuần
  const loadWeeklyStatus = async () => {
    try {
      const weeklyStatusJson = await AsyncStorage.getItem("weeklyStatus");
      if (weeklyStatusJson) {
        setWeeklyStatus(JSON.parse(weeklyStatusJson));
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu trạng thái tuần:", error);
    }
  };

  // Hàm tải chi tiết trạng thái các ngày
  const loadStatusDetails = async () => {
    try {
      const detailsJson = await AsyncStorage.getItem("statusDetails");
      if (detailsJson) {
        setStatusDetails(JSON.parse(detailsJson));
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết trạng thái:", error);
    }
  };

  // Hàm cập nhật trạng thái tuần
  const updateWeeklyStatus = async () => {
    try {
      // Lấy trạng thái công của ngày hiện tại
      const today = formatDateFn(new Date(), "yyyy-MM-dd");
      let currentStatus = "?"; // Mặc định là không xác định

      // Xác định trạng thái dựa trên các hành động đã thực hiện
      if (workStatus === "complete") {
        currentStatus = "✓"; // Đủ công
      } else if (workStatus === "check_out") {
        const checkInTime = checkInEntry
          ? new Date(checkInEntry.timestamp)
          : null;
        const checkOutTime = checkOutEntry
          ? new Date(checkOutEntry.timestamp)
          : null;

        if (checkInTime && checkOutTime) {
          // Kiểm tra giờ vào muộn hoặc ra sớm
          const currentShift = await getCurrentShift();
          const startTime = parseShiftTime(currentShift.startTime);
          const endTime = parseShiftTime(currentShift.officeEndTime);

          const isLate = checkInTime > startTime;
          const isEarly = checkOutTime < endTime;

          if (isLate || isEarly) {
            currentStatus = "RV"; // Vào muộn hoặc ra sớm
          } else {
            currentStatus = "✓"; // Đủ công
          }
        } else {
          currentStatus = "!"; // Thiếu check-in hoặc check-out
        }
      } else if (workStatus === "check_in") {
        currentStatus = "!"; // Đang làm việc nhưng chưa check-out
      } else if (workStatus === "go_work") {
        currentStatus = "!"; // Đã đi làm nhưng chưa check-in
      }

      // Cập nhật statusDetails cho ngày hiện tại
      const currentDetails = {
        checkInTime: checkInEntry ? checkInEntry.timestamp : null,
        checkOutTime: checkOutEntry ? checkOutEntry.timestamp : null,
        totalHours: calculateWorkHours(),
        status: currentStatus,
      };

      const updatedDetails = { ...statusDetails };
      updatedDetails[today] = currentDetails;
      setStatusDetails(updatedDetails);
      await AsyncStorage.setItem(
        "statusDetails",
        JSON.stringify(updatedDetails)
      );

      // Cập nhật weeklyStatus
      const updatedStatus = { ...weeklyStatus };
      updatedStatus[today] = currentStatus;
      setWeeklyStatus(updatedStatus);
      await AsyncStorage.setItem("weeklyStatus", JSON.stringify(updatedStatus));

      console.log(
        `Đã cập nhật trạng thái công cho ngày ${today}: ${currentStatus}`
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái tuần:", error);
    }
  };

  // Hàm tính số giờ làm việc
  const calculateWorkHours = () => {
    if (!checkInEntry || !checkOutEntry) return null;

    const checkInTime = new Date(checkInEntry.timestamp);
    const checkOutTime = new Date(checkOutEntry.timestamp);
    const diffMinutes = differenceInMinutes(checkOutTime, checkInTime);

    return (diffMinutes / 60).toFixed(2);
  };

  // Lưu lịch sử làm việc vào work_log
  const saveWorkLog = async () => {
    try {
      if (!checkInEntry || !checkOutEntry) {
        console.error(
          "Không thể lưu lịch sử làm việc: thiếu thông tin check-in hoặc check-out"
        );
        return false;
      }

      const today = formatDateFn(new Date(), "yyyy-MM-dd");
      const checkInTime = new Date(checkInEntry.timestamp);
      const checkOutTime = new Date(checkOutEntry.timestamp);

      // Tạo bản ghi lịch sử làm việc
      const workLog = {
        date: today,
        checkInTime: checkInEntry.timestamp,
        checkOutTime: checkOutEntry.timestamp,
        completeTime: new Date().toISOString(),
        totalWorkHours: calculateWorkHours(),
        status: workDayStatus || "full",
      };

      // Lấy lịch sử hiện tại
      const workLogsJson = await AsyncStorage.getItem("work_logs");
      const workLogs = workLogsJson ? JSON.parse(workLogsJson) : [];

      // Thêm bản ghi mới
      workLogs.push(workLog);

      // Lưu lại
      await AsyncStorage.setItem("work_logs", JSON.stringify(workLogs));
      console.log("Đã lưu lịch sử làm việc:", workLog);

      return true;
    } catch (error) {
      console.error("Lỗi khi lưu lịch sử làm việc:", error);
      return false;
    }
  };

  // Tính toán và lưu giờ công
  const calculateAndSaveWorkHours = async () => {
    try {
      if (!checkInEntry || !checkOutEntry || !shiftInfo) {
        console.error("Không thể tính giờ công: thiếu thông tin cần thiết");
        return false;
      }

      const checkInTime = new Date(checkInEntry.timestamp);
      const checkOutTime = new Date(checkOutEntry.timestamp);

      // Lấy các mốc thời gian từ ca làm việc
      const startTime = parseShiftTime(shiftInfo.startTime);
      const officeEndTime = parseShiftTime(shiftInfo.officeEndTime);
      const endTime = parseShiftTime(shiftInfo.endTime);

      // Xác định trạng thái làm việc
      let workStatus = "full"; // Mặc định là đủ công
      let checkInStatus = "normal";
      let checkOutStatus = "normal";

      // Kiểm tra vào muộn
      if (checkInTime > startTime) {
        const minutesLate = differenceInMinutes(checkInTime, startTime);
        if (minutesLate > 5) {
          // Nếu vào muộn quá 5 phút
          checkInStatus = "late";
          workStatus = "rv"; // Vào muộn
        }
      }

      // Kiểm tra ra sớm
      if (checkOutTime < officeEndTime) {
        const minutesEarly = differenceInMinutes(officeEndTime, checkOutTime);
        if (minutesEarly > 5) {
          // Nếu ra sớm quá 5 phút
          checkOutStatus = "early";
          workStatus = "rv"; // Ra sớm
        }
      }

      // Tính giờ làm tiêu chuẩn và giờ tăng ca
      const standardWorkMinutes = differenceInMinutes(officeEndTime, startTime);
      const actualWorkMinutes = differenceInMinutes(checkOutTime, checkInTime);

      // Giờ làm tiêu chuẩn (tối đa là thời gian tiêu chuẩn)
      const standardHours =
        Math.min(actualWorkMinutes, standardWorkMinutes) / 60;

      // Giờ tăng ca (nếu làm quá giờ hành chính)
      let overtimeHours = 0;
      if (checkOutTime > officeEndTime) {
        const overtimeMinutes = differenceInMinutes(
          checkOutTime,
          officeEndTime
        );
        overtimeHours = overtimeMinutes / 60;
      }

      // Tạo đối tượng thống kê giờ công
      const workHoursData = {
        date: formatDateFn(new Date(), "yyyy-MM-dd"),
        standardHours: Number(standardHours.toFixed(2)),
        overtimeHours: Number(overtimeHours.toFixed(2)),
        totalHours: Number((standardHours + overtimeHours).toFixed(2)),
        checkInStatus,
        checkOutStatus,
        workStatus,
      };

      // Lưu thống kê giờ công
      const today = formatDateFn(new Date(), "yyyy-MM-dd");
      await AsyncStorage.setItem(
        `workHours_${today}`,
        JSON.stringify(workHoursData)
      );

      // Cập nhật trạng thái làm việc
      setWorkDayStatus(workStatus);
      setCheckInStatus(checkInStatus);
      setCheckOutStatus(checkOutStatus);

      console.log("Đã tính toán và lưu giờ công:", workHoursData);
      return true;
    } catch (error) {
      console.error("Lỗi khi tính toán và lưu giờ công:", error);
      return false;
    }
  };

  // Hàm xử lý thay đổi trạng thái ngày thủ công
  const handleDayStatusChange = async (dateStr, newStatus) => {
    try {
      // Update weekly status
      const updatedStatus = { ...weeklyStatus };
      updatedStatus[dateStr] = newStatus;
      setWeeklyStatus(updatedStatus);
      await DatabaseService.saveWeeklyStatus(updatedStatus);

      // Update status details if needed
      if (statusDetails[dateStr]) {
        const updatedDetails = { ...statusDetails };
        updatedDetails[dateStr] = {
          ...updatedDetails[dateStr],
          status: newStatus,
        };
        setStatusDetails(updatedDetails);
        await DatabaseService.saveStatusDetails(updatedDetails);
      }

      console.log(`Updated status for date ${dateStr}: ${newStatus}`);
    } catch (error) {
      console.error("Error changing day status:", error);
      Alert.alert(t("error"), t("error_saving_status"));
    }
  };

  // Hàm chuyển đổi giờ từ chuỗi HH:MM thành đối tượng Date
  const parseShiftTime = (timeStr) => {
    try {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch (error) {
      console.error("Lỗi khi phân tích giờ ca làm việc:", error);
      return new Date();
    }
  };

  const handleLanguageChange = async (languageCode) => {
    try {
      // Sử dụng context.setAppLanguage thay vì i18n.setAppLanguage
      if (context && context.setAppLanguage) {
        await context.setAppLanguage(languageCode);
        await AsyncStorage.setItem("userLanguage", languageCode);
        console.log(`Đã thay đổi ngôn ngữ thành: ${languageCode}`);
      } else {
        // Fallback nếu không có context.setAppLanguage
        context.setLocale(languageCode);
        await AsyncStorage.setItem("userLanguage", languageCode);
        console.log(`Đã thay đổi ngôn ngữ thành: ${languageCode} (fallback)`);
      }
    } catch (error) {
      console.error("Lỗi khi thay đổi ngôn ngữ:", error);
    }
  };

  const loadCurrentShift = async () => {
    try {
      const shiftInfoJson = await AsyncStorage.getItem("currentShift");
      if (shiftInfoJson) {
        const shift = JSON.parse(shiftInfoJson);
        setShiftInfo(shift);
        console.log("Đã tải ca làm việc hiện tại:", shift);

        // Khi ca làm việc thay đổi, kiểm tra nếu đang ở trạng thái hoàn tất
        // thì reset lại trạng thái để cho phép bắt đầu ca mới
        if (workStatus === "completed") {
          console.log("Phát hiện ca làm việc mới, đặt lại trạng thái");
          await resetDayStatus();
          setWorkStatus(null);
          setTodayEntries([]);
        }
      } else {
        setShiftInfo(null);
        console.log("Không tìm thấy thông tin ca làm việc");
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin ca làm việc:", error);
      setShiftInfo(null);
    }
  };

  useEffect(() => {
    loadCurrentShift();
    const unsubscribe = navigation.addListener("focus", loadCurrentShift);
    return unsubscribe;
  }, [navigation]);

  // Thêm đoạn này vào đầu component hoặc trong constructor
  useEffect(() => {
    const configurePushNotifications = async () => {
      try {
        if (Platform.OS === "web") {
          console.log("Push notifications không được hỗ trợ đầy đủ trên web");
          return;
        }

        // Cấu hình Expo Notifications
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        // Yêu cầu quyền thông báo
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.log("Không có quyền thông báo!");
          return;
        }

        // Tạo kênh thông báo cho Android
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Mặc định",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
          });
        }

        console.log("Đã cấu hình thông báo thành công");
      } catch (error) {
        console.error("Lỗi khi cấu hình thông báo:", error);
      }
    };

    configurePushNotifications();
  }, []);

  // Sửa hàm handleCancelReminders tại khoảng dòng 1997
  const handleCancelReminders = async (action) => {
    try {
      // Kiểm tra nếu đang chạy trên web
      if (Platform.OS === "web") {
        console.log("Hủy thông báo trên web không được hỗ trợ.");
        return;
      }

      // Code hiện tại cho Android/iOS
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log(`Đã hủy tất cả thông báo cho hành động: ${action}`);
    } catch (error) {
      console.error("Error canceling notification:", error);
    }
  };

  // Sửa hàm handleScheduleNotification tại khoảng dòng 2008
  const handleScheduleNotification = async (notificationData) => {
    try {
      // Kiểm tra nếu đang chạy trên web
      if (Platform.OS === "web") {
        console.log(
          "Web notification:",
          notificationData?.title || "Thông báo",
          notificationData?.message || "Nội dung thông báo"
        );

        // Tùy chọn: Sử dụng API thông báo web nếu cần
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(notificationData?.title || "Thông báo", {
            body: notificationData?.message || "Nội dung thông báo",
          });
        }
        return;
      }

      // Code hiện tại cho Android/iOS
      if (!notificationData) {
        console.warn("Dữ liệu thông báo không hợp lệ");
        return;
      }

      // Tính toán thời gian thông báo
      const currentDate = new Date();
      const minutesToAdd = notificationData.minutes || 0;
      const scheduledTime = new Date(
        currentDate.getTime() + minutesToAdd * 60000
      );

      // Lên lịch thông báo với trigger rõ ràng
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title || "Nhắc nhở",
          body: notificationData.message || "Bạn có một thông báo mới",
          data: notificationData.data || {},
        },
        trigger: {
          date: scheduledTime,
        },
      });

      console.log(
        `Đã lên lịch thông báo cho: ${scheduledTime.toLocaleString()}`
      );
    } catch (error) {
      console.error("Error scheduling notification:", error);
    }
  };

  // Thêm hàm showToast tự định nghĩa
  const showToast = (type, messageKey, defaultMessage = "") => {
    const message = safeT(messageKey, defaultMessage);
    if (Platform.OS === "web") {
      console.log(`[${type}] ${message}`);
      alert(message);
    } else {
      Toast.show({
        type: type || "info",
        text1: message,
        position: "bottom",
        visibilityTime: 4000,
      });
    }
  };

  // Sửa xử lý sự kiện chạm trong HomeScreen
  useEffect(() => {
    // Hàm xử lý lỗi chạm
    const fixTouchIssues = () => {
      if (Platform.OS === "web") {
        // Fix cho lỗi "Cannot record touch end without a touch start" trên web
        document.addEventListener(
          "touchend",
          (e) => {
            if (!e.target || !e.target._reactEvents) {
              e.preventDefault();
              e.stopPropagation();
            }
          },
          true
        );
      }
    };

    fixTouchIssues();

    return () => {
      if (Platform.OS === "web") {
        document.removeEventListener("touchend", fixTouchIssues, true);
      }
    };
  }, []);

  // Kiểm tra và điều chỉnh hàm safeT
  const safeT = (key, fallback) => {
    if (!key) return fallback || "";

    try {
      // Kiểm tra xem translations có đúng cấu trúc không
      if (translations && translations[locale] && translations[locale][key]) {
        // Trả về trực tiếp từ object translations
        return translations[locale][key];
      }

      // Sử dụng t() từ context
      const translated = t(key);
      // Kiểm tra nếu kết quả giống key (không dịch được)
      if (translated !== key) {
        return translated;
      }

      console.log(`Key "${key}" không tìm thấy bản dịch`);
      return fallback || key;
    } catch (error) {
      console.error(`Lỗi khi dịch key "${key}":`, error);
      return fallback || key;
    }
  };

  // Trong hàm renderWeeklyStatus hoặc tương tự
  const getDayName = (day) => {
    const dayNames = {
      0: safeT("sunday", "CN"),
      1: safeT("monday", "T2"),
      2: safeT("tuesday", "T3"),
      3: safeT("wednesday", "T4"),
      4: safeT("thursday", "T5"),
      5: safeT("friday", "T6"),
      6: safeT("saturday", "T7"),
    };
    return dayNames[day] || day.toString();
  };

  // Thêm đoạn debug này vào useEffect
  useEffect(() => {
    // Debug i18n
    console.log("HomeScreen - Current locale:", locale);

    // Test a few translations
    const testKeys = ["goToWork", "completed", "no_history_today"];
    testKeys.forEach((key) => {
      console.log(`Translation for ${key}:`, t(key));
    });
  }, [locale]);

  // Thêm đoạn debug này để kiểm tra giá trị thực tế
  useEffect(() => {
    console.log("==== DEBUG TRANSLATIONS VALUES ====");

    if (translations) {
      // Kiểm tra giá trị của một số khóa
      console.log("EN goToWork =", translations.en?.goToWork);
      console.log("VI goToWork =", translations.vi?.goToWork);

      console.log("EN check_in =", translations.en?.check_in);
      console.log("VI check_in =", translations.vi?.check_in);
    }

    // Kiểm tra cách hoạt động của t()
    console.log("t('goToWork') =", t("goToWork"));
    console.log("safeT('goToWork') =", safeT("goToWork", "Đi Làm"));

    console.log("==============================");
  }, [locale]);

  // Thêm đoạn code này để kiểm tra và đặt locale
  useEffect(() => {
    const checkLocale = async () => {
      try {
        // Kiểm tra locale hiện tại
        console.log("Current locale:", locale);

        // Đảm bảo locale đã được đặt trong AsyncStorage
        const storedLocale = await AsyncStorage.getItem("userLanguage");
        console.log("Stored locale:", storedLocale);

        // Đặt lại locale nếu cần
        if (!storedLocale) {
          await AsyncStorage.setItem("userLanguage", "vi");
          if (setLocale) setLocale("vi");
          console.log("Set default locale to 'vi'");
        } else if (locale !== storedLocale) {
          if (setLocale) setLocale(storedLocale);
          console.log(`Updated locale to match stored: ${storedLocale}`);
        }
      } catch (error) {
        console.error("Error checking locale:", error);
      }
    };

    checkLocale();
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.languageButton,
            { backgroundColor: theme.colors.surface },
          ]}
          onPress={() => changeLocale(locale === "vi" ? "en" : "vi")}
        >
          <Text style={[styles.languageText, { color: theme.colors.text }]}>
            {locale === "vi" ? "EN" : "VI"}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Vùng thông tin thởi gian */}
        <View style={styles.timeInfoSection}>
          <View style={styles.timeDisplayContainer}>
            <Text style={styles.timeDisplay}>
              {formatDateFn(currentTime, "HH:mm", {
                locale: i18n.locale === "vi" ? vi : enUS,
              })}
            </Text>
            <Text
              style={[
                styles.dateDisplay,
                { color: theme.colors.textSecondary },
              ]}
            >
              {formatDate(currentTime)}
            </Text>
          </View>

          {shiftInfo && (
            <View
              style={[
                styles.shiftInfoContainer,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.shiftName, { color: theme.colors.primary }]}>
                {shiftInfo.name}
              </Text>
              <Text
                style={[
                  styles.shiftTime,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {formatShiftTime(shiftInfo.startTime)} →{" "}
                {formatShiftTime(shiftInfo.endTime)}
              </Text>
            </View>
          )}
        </View>

        {/* Nút đa năng */}
        <View style={styles.multiActionSection}>
          <View style={styles.buttonContainer}>
            {renderActionButton()}
            {/* Nút reset - hiển thị sau khi bấm "Đi Làm" và sau khi hoàn thành */}
            {showResetButton && (
              <TouchableOpacity
                style={[
                  styles.resetButton,
                  // Khi trạng thái đã hoàn thành, làm nút reset rõ ràng hơn
                  workStatus === "completed" && styles.resetButtonHighlighted,
                ]}
                onPress={handleResetPress}
              >
                <Ionicons
                  name="refresh-outline"
                  size={24}
                  color={
                    workStatus === "completed"
                      ? theme.colors.primary
                      : theme.colors.resetButton
                  }
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Hiển thị lịch sử bấm nút */}
          {renderActionHistory()}

          {/* Hiển thị trạng thái nhập công hiện tại */}
          <Text style={styles.currentStatusText}>{renderStatusTime()}</Text>
        </View>

        {/* Trạng thái tuần này */}
        <View style={styles.weeklyStatusSection}>
          <WeeklyStatusGrid
            weeklyStatus={weeklyStatus}
            statusDetails={statusDetails}
            onStatusChange={handleDayStatusChange}
          />
        </View>

        {/* Ghi chú công việc */}
        <View style={styles.notesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{i18n.t("notes")}</Text>
            <TouchableOpacity
              style={styles.addNoteButton}
              onPress={() => setIsAddNoteModalVisible(true)}
            >
              <Text style={styles.addNoteButtonText}>{i18n.t("add_note")}</Text>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.notesCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {notes.length > 0 ? (
              <View style={styles.notesList}>
                {notes.slice(0, 3).map((note, index) => (
                  <View key={index} style={styles.noteItem}>
                    <View style={styles.noteContent}>
                      <Text style={styles.noteTitle} numberOfLines={1}>
                        {note.title}
                      </Text>
                      <Text style={styles.noteText} numberOfLines={2}>
                        {note.content}
                      </Text>
                      <Text style={styles.noteTime}>
                        {formatDateFn(
                          new Date(note.reminderTime),
                          "HH:mm, dd/MM/yyyy"
                        )}
                      </Text>
                    </View>
                    <View style={styles.noteActions}>
                      <TouchableOpacity
                        style={styles.noteActionButton}
                        onPress={() => handleEditNote(note)}
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={20}
                          color={theme.colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.noteActionButton}
                        onPress={() => handleDeleteNote(note.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={theme.colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text
                style={[
                  styles.noNotesText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {i18n.t("no_notes")}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal xác nhận hành động */}
      <Modal
        transparent={true}
        visible={confirmActionVisible}
        onRequestClose={() => setConfirmActionVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setConfirmActionVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.confirmDialog,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.confirmTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {i18n.t("confirm_action")}
                </Text>
                <Text
                  style={[
                    styles.confirmMessage,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {confirmMessage}
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[
                      styles.confirmButtonCancel,
                      { borderColor: theme.colors.border },
                    ]}
                    onPress={() => setConfirmActionVisible(false)}
                  >
                    <Text
                      style={[
                        styles.confirmButtonText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {i18n.t("cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButtonConfirm,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={confirmAction}
                  >
                    <Text style={[styles.confirmButtonText, { color: "#fff" }]}>
                      {i18n.t("confirm")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal xác nhận reset */}
      <Modal
        transparent={true}
        visible={confirmResetVisible}
        onRequestClose={() => setConfirmResetVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setConfirmResetVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.confirmDialog,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.confirmTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {i18n.t("confirm_reset")}
                </Text>
                <Text
                  style={[
                    styles.confirmMessage,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {i18n.t("reset_confirmation_message")}
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[
                      styles.confirmButtonCancel,
                      { borderColor: theme.colors.border },
                    ]}
                    onPress={() => setConfirmResetVisible(false)}
                  >
                    <Text
                      style={[
                        styles.confirmButtonText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {i18n.t("cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButtonConfirm,
                      { backgroundColor: theme.colors.error },
                    ]}
                    onPress={handleResetConfirm}
                  >
                    <Text style={[styles.confirmButtonText, { color: "#fff" }]}>
                      {i18n.t("reset")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal thêm/sửa ghi chú */}
      <AddNoteModal
        visible={isAddNoteModalVisible}
        onClose={() => setIsAddNoteModalVisible(false)}
        onSave={handleSaveNote}
        editNote={selectedNote}
        theme={theme}
      />
      <AddNoteModal
        visible={isAddNoteModalVisible}
        onClose={() => setIsAddNoteModalVisible(false)}
        onSave={handleSaveNote}
        editNote={selectedNote}
        theme={theme}
      />
      {/* Thêm Toast Container ở cuối component */}
      <Toast />
    </SafeAreaView>
  );
}; // Đảm bảo đã đóng ngoặc nhọn và có dấu chấm phẩy ở đây

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  languageButton: {
    padding: 8,
    borderRadius: 8,
    position: "absolute",
    right: 16,
    top: 16,
  },
  languageText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    width: "100%",
    position: "relative",
    height: 60,
  },
  scrollContent: {
    padding: 16,
  },
  // Vùng thông tin thởi gian
  timeInfoSection: {
    marginBottom: 20,
  },
  timeDisplayContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  timeDisplay: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#5A35F0",
  },
  dateDisplay: {
    fontSize: 16,
    marginTop: 4,
  },
  shiftInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  shiftName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  shiftTime: {
    fontSize: 14,
  },

  // Nút đa năng
  multiActionSection: {
    marginTop: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  multiActionButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  multiActionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  multipleButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  singleActionButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    margin: 5,
  },
  singleActionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 5,
    textAlign: "center",
  },
  resetButton: {
    position: "absolute",
    right: 5,
    bottom: 5,
    backgroundColor: "#f0f0f0",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  currentStatusText: {
    marginTop: 2,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  // Styles cho lịch sử bấm nút
  actionHistoryContainer: {
    width: "80%",
    marginTop: 8,
    marginBottom: 8,
    alignItems: "center",
    alignSelf: "center",
  },
  actionHistoryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    alignSelf: "center",
    width: "100%",
    justifyContent: "center",
  },
  actionHistoryText: {
    fontSize: 14,
    marginLeft: 8,
    color: "#333",
  },
  // Các section chung
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },

  // Trạng thái tuần này
  weeklyStatusSection: {
    marginBottom: 24,
  },
  weeklyStatusCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  weekDaysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekDayItem: {
    alignItems: "center",
    width: (Dimensions.get("window").width - 64) / 7,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  weekDayDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  statusIconText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  shiftTimeText: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },

  // Ghi chú công việc
  notesSection: {
    marginBottom: 16,
  },
  addNoteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addNoteButtonText: {
    fontSize: 14,
    color: "#5A35F0",
  },
  notesCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notesList: {
    gap: 16,
  },
  noteItem: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
    paddingBottom: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  noteTime: {
    fontSize: 12,
    color: "#999",
  },
  noteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noteActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  noNotesText: {
    textAlign: "center",
    padding: 16,
    fontSize: 14,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmDialog: {
    width: "100%",
    borderRadius: 12,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 14,
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  confirmButtonCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmButtonConfirm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  resetButtonHighlighted: {
    backgroundColor: "#f0f8ff",
    borderColor: "#4285F4",
    shadowColor: "#4285F4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#4CAF50",
    marginVertical: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  actionButtonContainer: {
    position: "relative",
    marginVertical: 10,
  },
  weeklyStatusContainer: {
    marginVertical: 15,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  weeklyStatusTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginHorizontal: 15,
  },
});

export default HomeScreen;
