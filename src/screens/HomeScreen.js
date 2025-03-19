import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format, differenceInMinutes, differenceInHours, isToday, parseISO, addDays, startOfWeek, isBefore, differenceInMilliseconds, parse } from 'date-fns';
import viLocale from 'date-fns/locale/vi';
import enUSLocale from 'date-fns/locale/en-US';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Contexts & Services
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import { NotificationService } from '../services/NotificationService';
import MultiActionButton from '../components/MultiActionButton';
import AddNoteModal from '../components/AddNoteModal';
import WeeklyStatusGrid from '../components/WeeklyStatusGrid';
import NoteItem from '../components/NoteItem';

const HomeScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const { t, locale } = useTranslation();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAddNoteModalVisible, setIsAddNoteModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [actionButtonDisabled, setActionButtonDisabled] = useState(false);
  const [confirmResetVisible, setConfirmResetVisible] = useState(false);
  const [confirmActionVisible, setConfirmActionVisible] = useState(false);
  const [nextAction, setNextAction] = useState(null);
  const [currentReminders, setCurrentReminders] = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [workStatus, setWorkStatus] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState('normal');  // 'normal', 'late'
  const [checkOutStatus, setCheckOutStatus] = useState('normal'); // 'normal', 'early'
  const [workDayStatus, setWorkDayStatus] = useState('full'); // 'full', 'rv', 'absent'
  const [shiftInfo, setShiftInfo] = useState(null);
  const [weeklyStatus, setWeeklyStatus] = useState({});
  const [statusDetails, setStatusDetails] = useState({});
  const [notes, setNotes] = useState([]);
  const [actionHistory, setActionHistory] = useState([]);
  const [actionLogs, setActionLogs] = useState([]);

  // Lấy thông tin nhắc nhở hiện tại
  useEffect(() => {
    const loadReminders = async () => {
      try {
        const reminders = await NotificationService.getScheduledNotifications();
        if (reminders) {
          const remindersList = Object.values(reminders);
          setCurrentReminders(remindersList);
        }
      } catch (error) {
        console.error('Error loading reminders:', error);
      }
    };
    
    loadReminders();
    
    // Cập nhật mỗi 1 phút
    const intervalId = setInterval(loadReminders, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Cập nhật đồng hồ mỗi giây
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Thêm một mục mới vào trạng thái làm việc
  const addWorkEntry = async (status) => {
    try {
      const entry = {
        id: Date.now().toString(),
        status,
        timestamp: new Date().toISOString(),
      };
      
      // Lấy danh sách hiện tại
      const entriesJson = await AsyncStorage.getItem('workEntries');
      const entries = entriesJson ? JSON.parse(entriesJson) : [];
      
      // Thêm mục mới
      entries.push(entry);
      
      // Lưu lại
      await AsyncStorage.setItem('workEntries', JSON.stringify(entries));
      
      return entry;
    } catch (error) {
      console.error('Lỗi khi thêm mục vào trạng thái làm việc:', error);
      return null;
    }
  };

  // Lấy danh sách mục của ngày hôm nay
  const getTodayEntries = async () => {
    try {
      const entriesJson = await AsyncStorage.getItem('workEntries');
      const entries = entriesJson ? JSON.parse(entriesJson) : [];
      
      // Lọc chỉ lấy các mục của ngày hôm nay
      return entries.filter(entry => isToday(parseISO(entry.timestamp)));
    } catch (error) {
      console.error('Lỗi khi lấy danh sách mục của ngày hôm nay:', error);
      return [];
    }
  };

  // Reset trạng thái làm việc của ngày hôm nay
  const resetDayStatus = async () => {
    try {
      const entriesJson = await AsyncStorage.getItem('workEntries');
      let entries = entriesJson ? JSON.parse(entriesJson) : [];
      
      // Lọc bỏ các mục của ngày hôm nay
      entries = entries.filter(entry => !isToday(parseISO(entry.timestamp)));
      
      // Lưu lại
      await AsyncStorage.setItem('workEntries', JSON.stringify(entries));
      
      return true;
    } catch (error) {
      console.error('Lỗi khi reset trạng thái của ngày hôm nay:', error);
      return false;
    }
  };

  // Cập nhật thông tin khi có thay đổi
  const updateInfo = useCallback(async () => {
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
    console.log('Đã cập nhật thông tin:', { 
      workStatus, 
      todayEntries: today.length 
    });
  }, [workStatus]);

  // Khởi tạo các state mà không hiện popup reset ngay lập tức
  useEffect(() => {
    // Cập nhật UI khi workStatus thay đổi
    updateInfo();
    
    // Đảm bảo nút luôn có thể nhấn được
    setActionButtonDisabled(false);
  }, [workStatus, updateInfo]);

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
  const formatDate = (date) => {
    const formatOptions = locale === 'vi' ? 'EEEE, dd/MM/yyyy' : 'EEEE, MM/dd/yyyy';
    return format(date, formatOptions, { locale: locale === 'vi' ? viLocale : enUSLocale });
  };

  // Format time
  const formatTime = (date) => {
    return format(date, 'HH:mm');
  };

  // Format shift time
  const formatShiftTime = (timeString) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  // Find latest entry by status
  const findLatestEntryByStatus = (status) => {
    const filteredEntries = todayEntries.filter(entry => entry.status === status);
    if (filteredEntries.length === 0) return null;
    
    return filteredEntries.reduce((latest, current) => {
      return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
    }, filteredEntries[0]);
  };

  // Get today's history entries
  const getTodayStatus = async () => {
    // Lọc các mục của ngày hôm nay
    const todayEntries = await getTodayEntries();
    const filteredEntries = todayEntries.filter(entry => isToday(parseISO(entry.timestamp)));
    const sortedEntries = filteredEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Tạo map để lưu trữ mục mới nhất cho mỗi loại trạng thái
    const uniqueStatusMap = new Map();
    
    // Duyệt qua để lấy mục mới nhất cho mỗi trạng thái
    sortedEntries.forEach(entry => {
      if (!uniqueStatusMap.has(entry.status) || 
          new Date(entry.timestamp) > new Date(uniqueStatusMap.get(entry.status).timestamp)) {
        uniqueStatusMap.set(entry.status, entry);
      }
    });
    
    // Chuyển đổi map thành mảng và sắp xếp theo thứ tự thời gian
    const uniqueEntries = Array.from(uniqueStatusMap.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return uniqueEntries;
  };

  const goWorkEntry = findLatestEntryByStatus('go_work');
  const checkInEntry = findLatestEntryByStatus('check_in');
  const checkOutEntry = findLatestEntryByStatus('check_out');
  const completeEntry = findLatestEntryByStatus('complete');

  // Hàm để xử lý thao tác trên nút đa năng
  const handleMultiActionPress = (action) => {
    console.log('Action pressed:', action);
    
    // Vô hiệu hóa nút để tránh nhấn nhiều lần
    setActionButtonDisabled(true);
    
    // Đặt nextAction và hiển thị popup xác nhận nếu cần
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

  // Thực hiện hành động sau khi đã xác nhận hoặc không cần xác nhận
  const performAction = async (action) => {
    try {
      let success = false;
      switch (action) {
        case 'go_work':
          success = await handleGoWork();
          break;
        case 'check_in':
          success = await handleCheckIn();
          break;
        case 'check_out':
          success = await handleCheckOut();
          break;
        case 'complete':
          success = await handleComplete();
          break;
        default:
          console.log('Unknown action:', action);
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
      console.error('Error performing action:', error);
      setActionButtonDisabled(false);
    }
  };

  // Xác nhận hành động từ popup
  const confirmAction = () => {
    // Đóng popup xác nhận
    setConfirmActionVisible(false);
    
    if (nextAction) {
      // Thực hiện hành động đã được xác nhận
      performAction(nextAction);
      
      // Đặt lại nextAction để tránh xung đột
      setNextAction(null);
    }
  };

  // Kiểm tra xem hành động có cần xác nhận không dựa trên thời gian
  const shouldShowConfirmation = (action) => {
    let needsConfirmation = false;

    if (action === 'check_in' && goWorkEntry) {
      // Kiểm tra thời gian giữa go_work và check_in (ít nhất 5 phút)
      const goWorkTime = parseISO(goWorkEntry.timestamp);
      const timeDiffMinutes = differenceInMinutes(new Date(), goWorkTime);
      
      if (timeDiffMinutes < 5) {
        setConfirmMessage(t('time_validation_check_in'));
        needsConfirmation = true;
      }
    } 
    else if (action === 'check_out' && checkInEntry) {
      // Kiểm tra thời gian giữa check_in và check_out (ít nhất 2 giờ)
      const checkInTime = parseISO(checkInEntry.timestamp);
      const hoursDiff = differenceInHours(new Date(), checkInTime);
      
      if (hoursDiff < 2) {
        setConfirmMessage(t('time_validation_check_out'));
        needsConfirmation = true;
      }
    }

    return needsConfirmation;
  };

  // Xử lý khi bấm "Đi làm"
  const handleGoWork = async () => {
    try {
      // Cập nhật trạng thái "Đi làm"
      const newEntry = await addWorkEntry('go_work');
      
      if (newEntry) {
        console.log('Đã thêm mục "Đi làm":', newEntry);
        
        // Cập nhật danh sách
        const updatedEntries = await getTodayEntries();
        setTodayEntries(updatedEntries);
        
        // Cập nhật trạng thái làm việc
        setWorkStatus('go_work');
        
        // Hủy thông báo nhắc nhở xuất phát vì đã thực hiện
        await NotificationService.cancelRemindersByAction('go_work');
        
        // Kiểm tra thời gian và thêm thông báo trạng thái
        const currentShift = await getCurrentShift();
        if (currentShift && currentShift.startTime) {
          const now = new Date();
          const [startHour, startMinute] = currentShift.startTime.split(':').map(Number);
          const startTime = new Date(now);
          startTime.setHours(startHour, startMinute, 0, 0);
          
          // Nếu đi làm sớm, không cần hiển thị thông báo
          if (now < startTime) {
            showToast(t('early_departure_success'));
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
        Alert.alert(
          t('error'),
          t('must_go_work_first_message'),
          [{ text: t('ok') }]
        );
        return false;
      }
      
      // Cập nhật trạng thái "Chấm công vào"
      const newEntry = await addWorkEntry('check_in');
      
      if (newEntry) {
        console.log('Đã thêm mục "Chấm công vào":', newEntry);
        
        // Cập nhật danh sách
        const updatedEntries = await getTodayEntries();
        setTodayEntries(updatedEntries);
        
        // Cập nhật trạng thái làm việc
        setWorkStatus('check_in');
        
        // Hủy thông báo nhắc nhở chấm công vào vì đã thực hiện
        await NotificationService.cancelRemindersByAction('check_in');
        
        // Kiểm tra thời gian và thêm thông báo trạng thái
        const currentShift = await getCurrentShift();
        if (currentShift && currentShift.startTime) {
          const now = new Date();
          const [startHour, startMinute] = currentShift.startTime.split(':').map(Number);
          const startTime = new Date(now);
          startTime.setHours(startHour, startMinute, 0, 0);
          
          // Nếu chấm công vào muộn, hiển thị cảnh báo
          if (now > startTime) {
            const minutesLate = differenceInMinutes(now, startTime);
            if (minutesLate > 5) {
              showToast(t('late_check_in_warning'));
              
              // Cập nhật trạng thái là "RV" (vào muộn)
              await updateWorkStatus('rv');
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
        Alert.alert(
          t('error'),
          t('must_check_in_first_message'),
          [{ text: t('ok') }]
        );
        return false;
      }
      
      // Cập nhật trạng thái "Chấm công ra"
      const newEntry = await addWorkEntry('check_out');
      
      if (newEntry) {
        console.log('Đã thêm mục "Chấm công ra":', newEntry);
        
        // Cập nhật danh sách
        const updatedEntries = await getTodayEntries();
        setTodayEntries(updatedEntries);
        
        // Cập nhật trạng thái làm việc
        setWorkStatus('check_out');
        
        // Hủy thông báo nhắc nhở chấm công ra vì đã thực hiện
        await NotificationService.cancelRemindersByAction('check_out');
        
        // Kiểm tra thời gian và thêm thông báo trạng thái
        const currentShift = await getCurrentShift();
        if (currentShift && currentShift.officeEndTime) {
          const now = new Date();
          const [endHour, endMinute] = currentShift.officeEndTime.split(':').map(Number);
          const endTime = new Date(now);
          endTime.setHours(endHour, endMinute, 0, 0);
          
          // Nếu chấm công ra sớm, hiển thị cảnh báo
          if (now < endTime) {
            const minutesEarly = differenceInMinutes(endTime, now);
            if (minutesEarly > 5) {
              showToast(t('early_check_out_warning'));
              
              // Cập nhật trạng thái là "RV" (ra sớm)
              await updateWorkStatus('rv');
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
        Alert.alert(
          t('error'),
          t('must_check_out_first_message'),
          [{ text: t('ok') }]
        );
        return false;
      }
      
      // Cập nhật trạng thái "Hoàn tất"
      const newEntry = await addWorkEntry('complete');
      
      if (newEntry) {
        console.log('Đã thêm mục "Hoàn tất":', newEntry);
        
        // Cập nhật danh sách
        const updatedEntries = await getTodayEntries();
        setTodayEntries(updatedEntries);
        
        // Cập nhật trạng thái làm việc
        setWorkStatus('complete');
        
        // Hủy thông báo nhắc nhở hoàn tất vì đã thực hiện
        await NotificationService.cancelRemindersByAction('complete');
        
        // Cập nhật trạng thái tuần
        await updateWeeklyStatus();
        
        // Hiển thị thông báo
        showToast(t('work_completed_success'));
        
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
        console.log('Không có thông tin ca làm việc hoặc giờ kết thúc hành chính');
        return;
      }
      
      // Hủy thông báo cũ nếu có
      await NotificationService.cancelNotification('office-end-reminder');
      
      // Lên lịch thông báo mới
      await NotificationService.scheduleOfficeEndReminder(
        currentShift.officeEndTime,
        currentShift
      );
      
      console.log('Đã lên lịch thông báo nhắc nhở giờ hành chính kết thúc');
    } catch (error) {
      console.error('Lỗi khi lên lịch thông báo nhắc nhở giờ hành chính kết thúc:', error);
    }
  };

  // Lên lịch thông báo nhắc nhở kết thúc ca
  const scheduleShiftEndReminder = async () => {
    try {
      const currentShift = await getCurrentShift();
      if (!currentShift || !currentShift.endTime) {
        console.log('Không có thông tin ca làm việc hoặc giờ kết thúc ca');
        return;
      }
      
      // Hủy thông báo cũ nếu có
      await NotificationService.cancelNotification('shift-end-reminder');
      
      // Lên lịch thông báo mới
      await NotificationService.scheduleEndShiftReminder(
        currentShift.endTime,
        currentShift
      );
      
      console.log('Đã lên lịch thông báo nhắc nhở kết thúc ca');
    } catch (error) {
      console.error('Lỗi khi lên lịch thông báo nhắc nhở kết thúc ca:', error);
    }
  };

  // Cập nhật trạng thái công
  const updateWorkStatus = async (status) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      await AsyncStorage.setItem(`workStatus_${today}`, status);
      
      // Cập nhật trạng thái tuần
      const weeklyStatusCopy = { ...weeklyStatus };
      weeklyStatusCopy[today] = status;
      setWeeklyStatus(weeklyStatusCopy);
      await AsyncStorage.setItem('weeklyStatus', JSON.stringify(weeklyStatusCopy));
      
      console.log(`Đã cập nhật trạng thái công cho ngày ${today}: ${status}`);
      return true;
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái công:', error);
      return false;
    }
  };

  // Lấy thông tin ca làm việc hiện tại
  const getCurrentShift = async () => {
    try {
      const shiftData = await AsyncStorage.getItem('currentShift');
      if (shiftData) {
        return JSON.parse(shiftData);
      }
      
      // Trả về ca mặc định nếu không có dữ liệu
      return {
        name: 'Ca Sáng',
        departureTime: '07:10',
        startTime: '08:00',
        officeEndTime: '17:00',
        endTime: '20:00'
      };
    } catch (error) {
      console.error('Lỗi khi lấy thông tin ca làm việc hiện tại:', error);
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
      const notesJson = await AsyncStorage.getItem('notes');
      if (notesJson) {
        const notesData = JSON.parse(notesJson);
        const updatedNotes = notesData.filter(note => note.id !== noteId);
        await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
        setNotes(updatedNotes);
      }
    } catch (error) {
      console.error('Lỗi khi xóa ghi chú:', error);
    }
  };

  // Hàm để xử lý lưu ghi chú
  const handleSaveNote = async (noteData) => {
    try {
      let notesJson = await AsyncStorage.getItem('notes');
      let notesData = notesJson ? JSON.parse(notesJson) : [];
      
      if (selectedNote) {
        // Cập nhật ghi chú hiện có
        notesData = notesData.map(note => 
          note.id === selectedNote.id ? {...noteData, id: selectedNote.id} : note
        );
      } else {
        // Thêm ghi chú mới
        notesData.push({...noteData, id: Date.now().toString()});
      }
      
      await AsyncStorage.setItem('notes', JSON.stringify(notesData));
      setNotes(notesData);
      setIsAddNoteModalVisible(false);
    } catch (error) {
      console.error('Lỗi khi lưu ghi chú:', error);
    }
  };

  // Lấy thông tin ghi chú
  const loadNotes = async () => {
    try {
      const notesJson = await AsyncStorage.getItem('notes');
      if (notesJson) {
        const notesData = JSON.parse(notesJson);
        setNotes(notesData);
      }
    } catch (error) {
      console.error('Lỗi khi tải ghi chú:', error);
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
      console.error('Lỗi khi tải lịch sử bấm nút:', error);
    }
  };

  // Lấy lịch sử bấm nút trong ngày
  const getTodayActionLogs = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const logsKey = `actionLogs_${today}`;
      const logsJson = await AsyncStorage.getItem(logsKey);
      
      if (logsJson) {
        const logs = JSON.parse(logsJson);
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      
      return [];
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử bấm nút:', error);
      return [];
    }
  };

  // Lưu lịch sử bấm nút
  const saveActionLog = async (action) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const logsKey = `actionLogs_${today}`;
      
      // Lấy lịch sử hiện tại
      const logsJson = await AsyncStorage.getItem(logsKey);
      const logs = logsJson ? JSON.parse(logsJson) : [];
      
      // Thêm log mới
      const newLog = {
        action,
        timestamp: new Date().toISOString(),
        status: action // Thêm trường status để tương thích với cách hiển thị cũ
      };
      
      logs.unshift(newLog); // Thêm vào đầu mảng
      
      // Lưu lịch sử cập nhật
      await AsyncStorage.setItem(logsKey, JSON.stringify(logs));
      
      // Cập nhật state
      setActionLogs(logs);
      
      console.log('Đã lưu lịch sử bấm nút:', newLog);
      return true;
    } catch (error) {
      console.error('Lỗi khi lưu lịch sử bấm nút:', error);
      return false;
    }
  };

  // Xử lý hành động từ nút đa năng
  const handleActionButtonPress = () => {
    // Vô hiệu hóa nút trong khi xử lý để tránh nhấn nhiều lần
    setActionButtonDisabled(true);

    // Xác định hành động tiếp theo dựa vào trạng thái hiện tại
    let nextAction = 'go_work';
    
    if (!workStatus || workStatus === 'complete' || workStatus === 'inactive') {
      nextAction = 'go_work';
    } else if (workStatus === 'go_work') {
      nextAction = 'check_in';
    } else if (workStatus === 'check_in') {
      nextAction = 'check_out';
    } else if (workStatus === 'check_out') {
      nextAction = 'complete';
    }

    console.log(`Hành động tiếp theo: ${nextAction}`);

    // Cập nhật biến để xác định hành động tiếp theo
    setNextAction(nextAction);

    // Kiểm tra xem hành động có cần xác nhận không
    if (shouldShowConfirmation(nextAction)) {
      // Hiển thị xác nhận nếu cần
      setConfirmActionVisible(true);
    } else {
      // Thực hiện hành động ngay nếu không cần xác nhận
      executeAction(nextAction);
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
      if (action === 'go_work') {
        success = await handleGoWork();
      } else if (action === 'check_in') {
        success = await handleCheckIn();
      } else if (action === 'check_out') {
        success = await handleCheckOut();
      } else if (action === 'complete') {
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
      } else {
        setActionButtonDisabled(false);
      }
    } catch (error) {
      console.error('Lỗi khi thực hiện hành động:', error);
      Alert.alert(
        t('error'),
        t('action_execution_error'),
        [{ text: t('ok') }]
      );
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
      const today = format(now, 'yyyy-MM-dd');
      
      // Tạo đối tượng lịch sử hành động
      const actionHistory = {
        action,
        timestamp: now.toISOString(),
        weekNumber: getWeekNumber(now),
        month: format(now, 'MM-yyyy')
      };
      
      // Lấy lịch sử hành động hiện có
      const historyJson = await AsyncStorage.getItem('workActionHistory');
      let history = historyJson ? JSON.parse(historyJson) : [];
      
      // Thêm hành động mới vào lịch sử
      history.push(actionHistory);
      
      // Lưu lịch sử cập nhật
      await AsyncStorage.setItem('workActionHistory', JSON.stringify(history));
      console.log(`Đã lưu lịch sử hành động: ${action}`);
      
      // Cập nhật thống kê tuần/tháng
      await updateWorkStatistics(action, now);
      
      return true;
    } catch (error) {
      console.error('Lỗi khi lưu lịch sử hành động:', error);
      return false;
    }
  };
  
  // Cập nhật thống kê thời gian làm việc
  const updateWorkStatistics = async (action, timestamp) => {
    try {
      // Nếu hành động là hoàn tất (đã kết thúc ca làm việc)
      if (action === 'complete' && checkInEntry && checkOutEntry) {
        const checkInTime = parseISO(checkInEntry.timestamp);
        const checkOutTime = parseISO(checkOutEntry.timestamp);
        
        // Tính toán thời gian làm việc thực tế (phút)
        const workTimeMinutes = differenceInMinutes(checkOutTime, checkInTime);
        
        // Lấy thông tin ca làm việc để tính giờ chuẩn
        const currentShift = await getCurrentShift();
        let standardWorkMinutes = 480; // 8 giờ mặc định
        
        if (currentShift && currentShift.startTime && currentShift.officeEndTime) {
          const [startHour, startMinute] = currentShift.startTime.split(':').map(Number);
          const [endHour, endMinute] = currentShift.officeEndTime.split(':').map(Number);
          
          // Tính số phút chuẩn từ giờ bắt đầu đến kết thúc
          const shiftStartMinutes = startHour * 60 + startMinute;
          const shiftEndMinutes = endHour * 60 + endMinute;
          standardWorkMinutes = shiftEndMinutes - shiftStartMinutes;
        }
        
        // Tính giờ làm việc thực tế và giờ tăng ca
        const regularHours = Math.min(workTimeMinutes, standardWorkMinutes) / 60;
        const overtimeHours = Math.max(0, (workTimeMinutes - standardWorkMinutes) / 60);
        
        // Tạo đối tượng dữ liệu thống kê
        const workDate = format(timestamp, 'yyyy-MM-dd');
        const weekNumber = getWeekNumber(timestamp);
        const monthYear = format(timestamp, 'MM-yyyy');
        
        const workStats = {
          date: workDate,
          week: weekNumber,
          month: monthYear,
          regularHours: Number(regularHours.toFixed(2)),
          overtimeHours: Number(overtimeHours.toFixed(2)),
          totalHours: Number(((regularHours + overtimeHours).toFixed(2))),
          status: workDayStatus || 'full', // Trạng thái ngày làm việc (full, rv, absent)
          timestamp: timestamp.toISOString()
        };
        
        // Lưu thống kê cho ngày hiện tại
        await AsyncStorage.setItem(`workStats_${workDate}`, JSON.stringify(workStats));
        
        // Cập nhật thống kê tuần
        await updateWeeklyStatistics(weekNumber, workStats);
        
        // Cập nhật thống kê tháng
        await updateMonthlyStatistics(monthYear, workStats);
        
        console.log('Đã cập nhật thống kê thời gian làm việc:', workStats);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thống kê thời gian làm việc:', error);
    }
  };
  
  // Cập nhật thống kê tuần
  const updateWeeklyStatistics = async (weekNumber, dailyStats) => {
    try {
      // Lấy thống kê tuần hiện tại
      const weekStatsKey = `weekStats_${weekNumber}`;
      const weekStatsJson = await AsyncStorage.getItem(weekStatsKey);
      let weekStats = weekStatsJson ? JSON.parse(weekStatsJson) : {
        weekNumber,
        year: new Date().getFullYear(),
        days: {},
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        totalHours: 0
      };
      
      // Cập nhật thông tin ngày
      weekStats.days[dailyStats.date] = {
        date: dailyStats.date,
        regularHours: dailyStats.regularHours,
        overtimeHours: dailyStats.overtimeHours,
        totalHours: dailyStats.totalHours,
        status: dailyStats.status
      };
      
      // Tính lại tổng giờ cho tuần
      let totalRegular = 0;
      let totalOvertime = 0;
      let totalHours = 0;
      
      Object.values(weekStats.days).forEach(day => {
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
      console.error('Lỗi khi cập nhật thống kê tuần:', error);
    }
  };
  
  // Cập nhật thống kê tháng
  const updateMonthlyStatistics = async (monthYear, dailyStats) => {
    try {
      // Lấy thống kê tháng hiện tại
      const monthStatsKey = `monthStats_${monthYear}`;
      const monthStatsJson = await AsyncStorage.getItem(monthStatsKey);
      let monthStats = monthStatsJson ? JSON.parse(monthStatsJson) : {
        month: monthYear,
        days: {},
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        totalHours: 0,
        daysWorked: 0,
        daysFullWork: 0,
        daysRV: 0
      };
      
      // Cập nhật thông tin ngày
      const isNewDay = !monthStats.days[dailyStats.date];
      monthStats.days[dailyStats.date] = {
        date: dailyStats.date,
        regularHours: dailyStats.regularHours,
        overtimeHours: dailyStats.overtimeHours,
        totalHours: dailyStats.totalHours,
        status: dailyStats.status
      };
      
      // Cập nhật thống kê số ngày
      if (isNewDay) {
        monthStats.daysWorked++;
        
        if (dailyStats.status === 'full') {
          monthStats.daysFullWork++;
        } else if (dailyStats.status === 'rv') {
          monthStats.daysRV++;
        }
      } else {
        // Nếu đã có ngày này nhưng trạng thái thay đổi
        const oldStatus = monthStats.days[dailyStats.date].status;
        if (oldStatus !== dailyStats.status) {
          if (oldStatus === 'full') monthStats.daysFullWork--;
          if (oldStatus === 'rv') monthStats.daysRV--;
          
          if (dailyStats.status === 'full') monthStats.daysFullWork++;
          if (dailyStats.status === 'rv') monthStats.daysRV++;
        }
      }
      
      // Tính lại tổng giờ cho tháng
      let totalRegular = 0;
      let totalOvertime = 0;
      let totalHours = 0;
      
      Object.values(monthStats.days).forEach(day => {
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
      console.error('Lỗi khi cập nhật thống kê tháng:', error);
    }
  };
  
  // Hàm lấy số tuần trong năm
  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-${weekNumber}`;
  };

  const actionButton = getActionButton();
  
  // Determine if we should show the reset button
  const showResetButton = workStatus !== 'inactive';

  // Hàm load thông tin ca làm việc
  const loadShiftInfo = async () => {
    try {
      const shiftJson = await AsyncStorage.getItem('workShifts');
      if (shiftJson) {
        const shifts = JSON.parse(shiftJson);
        if (shifts.length > 0) {
          setShiftInfo(shifts[0]); // Chỉ hiển thị ca đầu tiên
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin ca làm việc:', error);
    }
  };

  // Hàm trả về trạng thái ngày trong tuần dạng icon
  const getDayStatusIcon = (status) => {
    switch (status) {
      case 'full':
        return { icon: 'checkmark-circle', color: '#4CAF50', text: '✓' };
      case 'partial':
      case 'rv':
        return { icon: 'alert-circle', color: '#FF9800', text: 'RV' };
      case 'absent':
        return { icon: 'close-circle', color: '#F44336', text: 'X' };
      case 'pending':
        return { icon: 'help-circle', color: '#9E9E9E', text: '?' };
      case 'sick':
        return { icon: 'medkit', color: '#E91E63', text: 'B' };
      case 'vacation':
        return { icon: 'mail', color: '#2196F3', text: 'P' };
      case 'holiday':
        return { icon: 'flag', color: '#9C27B0', text: 'H' };
      case 'incomplete':
        return { icon: 'alert', color: '#FF5722', text: '!' };
      default:
        return { icon: 'remove-circle', color: '#757575', text: '--' };
    }
  };

  // Lấy tên hành động theo loại
  const getActionName = (action) => {
    switch (action) {
      case 'go_work':
        return t('goToWork');
      case 'check_in':
        return t('checkIn');
      case 'check_out':
        return t('checkOut');
      case 'complete':
        return t('complete');
      default:
        return '';
    }
  };

  // Lấy icon tương ứng với trạng thái
  const getIconForStatus = (status) => {
    switch (status) {
      case 'go_work':
        return 'briefcase-outline';
      case 'check_in':
        return 'log-in-outline';
      case 'check_out':
        return 'log-out-outline';
      case 'complete':
        return 'checkmark-done-outline';
      default:
        return 'time-outline';
    }
  };

  // Lấy màu tương ứng với trạng thái
  const getColorForStatus = (status, theme) => {
    switch (status) {
      case 'go_work':
        return theme.colors.goWorkButton;
      case 'check_in':
        return theme.colors.checkInButton;
      case 'check_out':
        return theme.colors.checkOutButton;
      case 'complete':
        return theme.colors.completeButton;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Vùng thông tin thởi gian */}
        <View style={styles.timeInfoSection}>
          <View style={styles.timeDisplayContainer}>
            <Text style={styles.timeDisplay}>
              {format(currentTime, 'HH:mm', { locale: locale === 'vi' ? viLocale : enUSLocale })}
            </Text>
            <Text style={[styles.dateDisplay, { color: theme.colors.textSecondary }]}>
              {formatDate(currentTime)}
            </Text>
          </View>
          
          {shiftInfo && (
            <View style={[styles.shiftInfoContainer, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.shiftName, { color: theme.colors.primary }]}>
                {shiftInfo.name}
              </Text>
              <Text style={[styles.shiftTime, { color: theme.colors.textSecondary }]}>
                {formatShiftTime(shiftInfo.startTime)} → {formatShiftTime(shiftInfo.endTime)}
              </Text>
            </View>
          )}
        </View>

        {/* Nút đa năng */}
        <View style={styles.multiActionSection}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.multiActionButton,
                { backgroundColor: getColorForStatus(workStatus || 'go_work', theme) }
              ]}
              onPress={handleActionButtonPress}
              disabled={actionButtonDisabled}
            >
              <Ionicons 
                name={getIconForStatus(workStatus || 'go_work')} 
                size={36} 
                color="#fff" 
              />
              <Text style={styles.multiActionButtonText}>
                {actionButton.label}
              </Text>
            </TouchableOpacity>
            
            {/* Nút reset */}
            {showResetButton && (
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={handleResetPress}
              >
                <Ionicons name="refresh-outline" size={24} color={theme.colors.resetButton} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Hiển thị lịch sử bấm nút */}
          <View style={styles.actionLogsContainer}>
            {actionLogs.slice(0, 3).map((log, index) => (
              <View key={index} style={styles.actionLogItem}>
                <Ionicons 
                  name={getIconForStatus(log.action)} 
                  size={16} 
                  color={getColorForStatus(log.action, theme)} 
                />
                <Text style={styles.actionLogText}>
                  {getActionName(log.action)}: {format(parseISO(log.timestamp), 'HH:mm')}
                </Text>
              </View>
            ))}
          </View>
          
          {/* Hiển thị trạng thái nhập công hiện tại */}
          <Text style={styles.currentStatusText}>
            {goWorkEntry ? format(new Date(goWorkEntry.timestamp), 'HH:mm') + ' - ' + t('work_started') : t('not_started_yet')}
          </Text>
        </View>

        {/* Lịch sử thao tác */}
        <View style={styles.actionHistorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('action_history')}</Text>
          </View>
          
          <View style={[styles.actionHistoryCard, { backgroundColor: theme.colors.surface }]}>
            {/* Hiển thị lịch sử các thao tác quan trọng */}
            {actionLogs.length > 0 ? (
              <View style={styles.actionHistoryList}>
                {actionLogs.map((entry, index) => {
                  let statusText = '';
                  let icon = '';
                  
                  switch(entry.action) {
                    case 'go_work':
                      statusText = t('goToWork');
                      icon = 'briefcase-outline';
                      break;
                    case 'check_in':
                      statusText = t('checkIn');
                      icon = 'log-in-outline';
                      break;
                    case 'check_out':
                      statusText = t('checkOut');
                      icon = 'log-out-outline';
                      break;
                    case 'complete':
                      statusText = t('complete');
                      icon = 'checkmark-done-outline';
                      break;
                    default:
                      statusText = entry.action;
                      icon = 'time-outline';
                  }
                  
                  return (
                    <View key={index} style={styles.actionHistoryItem}>
                      <View style={styles.actionIconContainer}>
                        <Ionicons name={icon} size={20} color={getColorForStatus(entry.action, theme)} />
                      </View>
                      <View style={styles.actionTextContainer}>
                        <Text style={[styles.actionText, { color: theme.colors.textPrimary }]}>
                          {statusText}
                        </Text>
                        <Text style={[styles.actionTime, { color: theme.colors.textSecondary }]}>
                          {format(parseISO(entry.timestamp), 'HH:mm')}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyListContainer}>
                <Text style={[styles.emptyListText, { color: theme.colors.textSecondary }]}>
                  {t('no_history')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Trạng thái tuần này */}
        <View style={styles.weeklyStatusSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('weekly_status')}</Text>
          </View>
          
          <View style={[styles.weeklyStatusCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.weekDaysContainer}>
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => {
                const date = addDays(new Date(), index - new Date().getDay() + (index === 6 ? -6 : 1));
                const dayStatus = weeklyStatus[format(date, 'yyyy-MM-dd')] || 'none';
                const statusInfo = getDayStatusIcon(dayStatus);
                
                return (
                  <TouchableOpacity 
                    key={index}
                    style={styles.weekDayItem}
                    onPress={() => handleDayStatusPress(format(date, 'yyyy-MM-dd'))}
                  >
                    <Text style={[
                      styles.weekDayText, 
                      { color: isToday(date) ? theme.colors.primary : theme.colors.textPrimary }
                    ]}>
                      {day}
                    </Text>
                    <Text style={[
                      styles.weekDayDate, 
                      { color: isToday(date) ? theme.colors.primary : theme.colors.textSecondary }
                    ]}>
                      {format(date, 'dd')}
                    </Text>
                    <View style={[
                      styles.statusIcon, 
                      { backgroundColor: isToday(date) ? statusInfo.color : theme.colors.background }
                    ]}>
                      <Text style={styles.statusIconText}>
                        {statusInfo.text}
                      </Text>
                    </View>
                    
                    {shiftInfo && (
                      <Text style={styles.shiftTimeText}>
                        {formatShiftTime(shiftInfo.startTime)} - {formatShiftTime(shiftInfo.endTime)}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Ghi chú công việc */}
        <View style={styles.notesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('notes')}</Text>
            <TouchableOpacity 
              style={styles.addNoteButton}
              onPress={() => setIsAddNoteModalVisible(true)}
            >
              <Text style={styles.addNoteButtonText}>{t('add_note')}</Text>
              <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.notesCard, { backgroundColor: theme.colors.surface }]}>
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
                        {format(new Date(note.reminderTime), 'HH:mm, dd/MM/yyyy')}
                      </Text>
                    </View>
                    <View style={styles.noteActions}>
                      <TouchableOpacity 
                        style={styles.noteActionButton}
                        onPress={() => handleEditNote(note)}
                      >
                        <Ionicons name="pencil-outline" size={20} color={theme.colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.noteActionButton}
                        onPress={() => handleDeleteNote(note.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.noNotesText, { color: theme.colors.textSecondary }]}>
                {t('no_notes')}
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
        <TouchableWithoutFeedback onPress={() => setConfirmActionVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={[styles.confirmDialog, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.confirmTitle, { color: theme.colors.textPrimary }]}>
                  {t('confirm_action')}
                </Text>
                <Text style={[styles.confirmMessage, { color: theme.colors.textSecondary }]}>
                  {confirmMessage}
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[styles.confirmButtonCancel, { borderColor: theme.colors.border }]}
                    onPress={() => setConfirmActionVisible(false)}
                  >
                    <Text style={[styles.confirmButtonText, { color: theme.colors.textSecondary }]}>
                      {t('cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButtonConfirm, { backgroundColor: theme.colors.primary }]}
                    onPress={confirmAction}
                  >
                    <Text style={[styles.confirmButtonText, { color: '#fff' }]}>
                      {t('confirm')}
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
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={[styles.confirmDialog, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.confirmTitle, { color: theme.colors.textPrimary }]}>
                  {t('confirm_reset')}
                </Text>
                <Text style={[styles.confirmMessage, { color: theme.colors.textSecondary }]}>
                  {t('reset_confirmation_message')}
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[styles.confirmButtonCancel, { borderColor: theme.colors.border }]}
                    onPress={() => setConfirmResetVisible(false)}
                  >
                    <Text style={[styles.confirmButtonText, { color: theme.colors.textSecondary }]}>
                      {t('cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButtonConfirm, { backgroundColor: theme.colors.error }]}
                    onPress={handleResetConfirm}
                  >
                    <Text style={[styles.confirmButtonText, { color: '#fff' }]}>
                      {t('reset')}
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
        t={t}
        theme={theme}
      />
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  // Vùng thông tin thởi gian
  timeInfoSection: {
    marginBottom: 20,
  },
  timeDisplayContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  timeDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#5A35F0',
  },
  dateDisplay: {
    fontSize: 16,
    marginTop: 4,
  },
  shiftInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  shiftName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  shiftTime: {
    fontSize: 14,
  },
  
  // Nút đa năng
  multiActionSection: {
    marginTop: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  multiActionButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  multiActionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  resetButton: {
    position: 'absolute',
    right: -30,
    top: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentStatusText: {
    marginTop: 2,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Styles cho lịch sử bấm nút
  actionLogsContainer: {
    width: '80%',
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  actionLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionLogText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#333',
  },
  // Các section chung
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  
  // Lịch sử thao tác
  actionHistorySection: {
    marginBottom: 24,
  },
  actionHistoryCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionHistoryList: {
    gap: 12,
  },
  actionHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginRight: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionTime: {
    fontSize: 12,
    marginTop: 2,
  },
  noHistoryText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
  },
  
  // Trạng thái tuần này
  weeklyStatusSection: {
    marginBottom: 24,
  },
  weeklyStatusCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDayItem: {
    alignItems: 'center',
    width: (Dimensions.get('window').width - 64) / 7,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  weekDayDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  statusIconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  shiftTimeText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  
  // Ghi chú công việc
  notesSection: {
    marginBottom: 16,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addNoteButtonText: {
    fontSize: 14,
    color: '#5A35F0',
  },
  notesCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notesList: {
    gap: 16,
  },
  noteItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    paddingBottom: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  noteTime: {
    fontSize: 12,
    color: '#999',
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  noNotesText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmDialog: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 14,
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
    fontWeight: 'bold',
  },
});

export default HomeScreen;
