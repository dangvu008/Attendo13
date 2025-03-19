import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format, differenceInMinutes, differenceInHours, isToday, parseISO, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Contexts & Services
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import NotificationService from '../services/NotificationService';
import MultiActionButton from '../components/MultiActionButton';
import AddNoteModal from '../components/AddNoteModal';
import WeeklyStatusGrid from '../components/WeeklyStatusGrid';
import NoteItem from '../components/NoteItem';

const HomeScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const { t, locale } = useLocalization();

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
  const updateInfo = async () => {
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
  };

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
  }, [loadShiftInfo, updateInfo]);

  // Format date using the current locale
  const formatDate = (date) => {
    const formatOptions = locale === 'vi' ? 'EEEE, dd/MM/yyyy' : 'EEEE, MM/dd/yyyy';
    return format(date, formatOptions, { locale: locale === 'vi' ? vi : enUS });
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
          t('must_go_work_first'),
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
        
        // Kiểm tra vào muộn nếu có thông tin ca làm việc
        if (shiftInfo) {
          const isLate = checkIfLateCheckIn(newEntry.timestamp, shiftInfo.startTime);
          setCheckInStatus(isLate ? 'late' : 'normal');
          
          // Hiển thị thông báo vào muộn
          if (isLate) {
            Alert.alert(
              t('warning'),
              t('late_check_in_warning'),
              [{ text: t('ok') }]
            );
          }
          
          // Lên lịch thông báo nhắc nhở tan làm nếu có
          if (shiftInfo.officeEndTime) {
            // Lên lịch thông báo tại thời điểm kết thúc giờ hành chính
            const [hours, minutes] = shiftInfo.officeEndTime.split(':').map(Number);
            
            const notificationDate = new Date();
            notificationDate.setHours(hours, minutes, 0, 0);
            
            // Chỉ lên lịch nếu thời gian trong tương lai
            if (notificationDate > new Date()) {
              await NotificationService.scheduleNotification({
                id: 'office-end-reminder',
                title: t('check_out_reminder'),
                message: t('office_hours_ended'),
                date: notificationDate,
                sound: true,
                vibrate: true
              });
            }
          }
        }
        
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
          t('must_check_in_first'),
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
        
        // Kiểm tra trạng thái ngày công mới
        const workHours = calculateWorkHours(
          checkInEntry.timestamp,
          newEntry.timestamp,
          shiftInfo
        );
        
        await saveWorkHoursInfo(workHours);
        
        // Cập nhật trạng thái ngày công
        if (workHours.workDayStatus === 'absent') {
          setWorkDayStatus('absent');
        } else if (workHours.workDayStatus === 'rv') {
          setWorkDayStatus('rv');
        } else {
          setWorkDayStatus('full');
        }
        
        // Kiểm tra vào muộn/ra sớm
        if (shiftInfo && checkInEntry) {
          // Tính toán và lưu thông tin giờ công
          const workHours = calculateWorkHours(
            checkInEntry.timestamp,
            newEntry.timestamp,
            shiftInfo
          );
          
          await saveWorkHoursInfo(workHours);
          
          // Kiểm tra trạng thái nghỉ (làm việc dưới 1 giờ)
          if (workHours.workDayStatus === 'absent') {
            Alert.alert(
              t('warning'),
              t('work_time_too_short'),
              [{ text: t('ok') }]
            );
          } 
          // Kiểm tra vào muộn/ra sớm
          else if (workHours.workDayStatus === 'rv') {
            // Hiển thị thông báo tương ứng
            if (checkInStatus === 'late' && checkOutStatus === 'early') {
              Alert.alert(
                t('warning'),
                t('late_and_early_warning'),
                [{ text: t('ok') }]
              );
            } else if (checkInStatus === 'late') {
              Alert.alert(
                t('warning'),
                t('late_check_in_warning'),
                [{ text: t('ok') }]
              );
            } else if (checkOutStatus === 'early') {
              Alert.alert(
                t('warning'),
                t('early_check_out_warning'),
                [{ text: t('ok') }]
              );
            }
          }
          
          // Hiển thị thông tin giờ công
          const workStatusText = t(`work_status_${workHours.workDayStatus}`);
          
          const hoursMessage = `${t('work_status')}: ${workStatusText}\n\n` +
                             `${t('regular_hours')}: ${workHours.regularHours.toFixed(1)} ${t('hours')}\n` +
                             `${t('overtime_150')}: ${workHours.overtime150.toFixed(1)} ${t('hours')}\n` +
                             `${t('overtime_200')}: ${workHours.overtime200.toFixed(1)} ${t('hours')}\n` +
                             `${t('overtime_300')}: ${workHours.overtime300.toFixed(1)} ${t('hours')}\n\n` +
                             `${t('total_hours')}: ${workHours.totalHours.toFixed(1)} ${t('hours')}`;
          
          Alert.alert(
            t('work_hours_summary'),
            hoursMessage,
            [{ text: t('ok') }]
          );
          
          // Lên lịch thông báo nhắc nhở hoàn thành nếu có
          if (shiftInfo.endTime) {
            // Lên lịch thông báo tại thời điểm kết thúc ca làm việc
            const [hours, minutes] = shiftInfo.endTime.split(':').map(Number);
            
            const notificationDate = new Date();
            notificationDate.setHours(hours, minutes, 0, 0);
            
            // Thêm 10 phút (nhắc nhở sau giờ kết thúc)
            notificationDate.setMinutes(notificationDate.getMinutes() + 10);
            
            // Chỉ lên lịch nếu thời gian trong tương lai
            if (notificationDate > new Date()) {
              await NotificationService.scheduleNotification({
                id: 'shift-end-reminder',
                title: t('complete_reminder'),
                message: t('shift_ended_complete_reminder'),
                date: notificationDate,
                sound: true,
                vibrate: true
              });
            }
          }
        }
        
        // Hủy thông báo nhắc nhở tan làm nếu có
        await NotificationService.cancelNotification('office-end-reminder');
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Lỗi khi thêm mục "Chấm công ra":', error);
      return false;
    }
  };

  // Xử lý khi bấm "Hoàn thành"
  const handleComplete = async () => {
    try {
      // Kiểm tra xem đã chấm công ra chưa
      if (!checkOutEntry) {
        Alert.alert(
          t('error'),
          t('must_check_out_first'),
          [{ text: t('ok') }]
        );
        return false;
      }
      
      // Cập nhật trạng thái "Hoàn thành"
      const newEntry = await addWorkEntry('complete');
      
      if (newEntry) {
        console.log('Đã thêm mục "Hoàn thành":', newEntry);
        
        // Cập nhật danh sách
        const updatedEntries = await getTodayEntries();
        setTodayEntries(updatedEntries);
        
        // Cập nhật trạng thái làm việc
        setWorkStatus('complete');
        
        // Hủy tất cả thông báo liên quan đến ca làm việc hiện tại
        await NotificationService.cancelNotification('shift-end-reminder');
        
        // Hiển thị thông báo tổng kết ca làm việc
        Alert.alert(
          t('shift_summary'),
          t('shift_completed_successfully'),
          [{ text: t('ok') }]
        );
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Lỗi khi thêm mục "Hoàn thành":', error);
      return false;
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

  // Handle status change for a specific day
  const handleStatusChange = (date, newStatus) => {
    manualUpdateWeeklyStatus(date, newStatus);
  };

  // Hàm để xử lý nhấn nút reset
  const handleResetPress = (event) => {
    // Ngăn chặn sự kiện lan truyền đến các thành phần khác
    event.stopPropagation();
    
    // Chỉ hiển thị xác nhận khi bấm trực tiếp vào nút reset
    if (event.target) {
      setConfirmResetVisible(true);
    }
  };

  // Hàm xử lý khi người dùng xác nhận reset
  const handleResetConfirm = async () => {
    try {
      // Reset trạng thái công việc
      setWorkStatus(null);
      setNextAction(null);
      setActionHistory([]);
      
      // Xóa dữ liệu lưu trữ cho ngày hiện tại
      const today = format(new Date(), 'yyyy-MM-dd');
      await AsyncStorage.removeItem(`workStatus_${today}`);
      await AsyncStorage.removeItem(`actionHistory_${today}`);
      
      // Hiển thị thông báo thành công
      Alert.alert(
        t('success'),
        t('reset_success'),
        [{ text: t('ok') }]
      );
    } catch (error) {
      console.error('Lỗi khi reset:', error);
      Alert.alert(
        t('error'),
        t('reset_error'),
        [{ text: t('ok') }]
      );
    } finally {
      // Đóng hộp thoại xác nhận
      setConfirmResetVisible(false);
    }
  };

  // Hàm để tải danh sách ghi chú gần nhất
  const loadRecentNotes = async () => {
    try {
      const notesJson = await AsyncStorage.getItem('notes');
      if (notesJson) {
        const notesData = JSON.parse(notesJson);
        setNotes(notesData.slice(0, 3));
      }
    } catch (error) {
      console.error('Lỗi khi tải ghi chú gần nhất:', error);
    }
  };

  // Lấy trạng thái hiện tại và thiết lập cho nút hành động
  const getActionButton = () => {
    let button = {
      status: 'go_work',
      label: t('goToWork'),
      icon: 'briefcase-outline',
      color: theme.colors.goWorkButton,
      disabled: false
    };

    // Dựa vào trạng thái làm việc hiện tại để xác định nút tiếp theo
    if (!workStatus || workStatus === 'complete') {
      // Mặc định là "Đi làm" nếu chưa có trạng thái nào
      button = {
        status: 'go_work',
        label: t('goToWork'),
        icon: 'briefcase-outline',
        color: theme.colors.goWorkButton,
        disabled: false
      };
    } else if (workStatus === 'go_work') {
      // Nếu đã "Đi làm" thì hiển thị "Chấm công vào"
      button = {
        status: 'check_in',
        label: t('checkIn'),
        icon: 'log-in-outline',
        color: theme.colors.checkInButton,
        disabled: false
      };
    } else if (workStatus === 'check_in') {
      // Nếu đã "Chấm công vào" thì hiển thị "Chấm công ra"
      button = {
        status: 'check_out',
        label: t('checkOut'),
        icon: 'log-out-outline',
        color: theme.colors.checkOutButton,
        disabled: false
      };
    } else if (workStatus === 'check_out') {
      // Nếu đã "Chấm công ra" thì hiển thị "Hoàn thành"
      button = {
        status: 'complete',
        label: t('complete'),
        icon: 'checkmark-done-outline',
        color: theme.colors.completeButton,
        disabled: false
      };
    }

    return button;
  };

  // Xử lý hành động từ nút đa năng
  const handleActionButtonPress = () => {
    // Vô hiệu hóa nút trong khi xử lý để tránh nhấn nhiều lần
    setActionButtonDisabled(true);

    // Xác định hành động tiếp theo dựa vào trạng thái hiện tại
    let nextAction = 'go_work';
    
    if (!workStatus || workStatus === 'complete') {
      nextAction = 'go_work';
    } else if (workStatus === 'go_work') {
      nextAction = 'check_in';
    } else if (workStatus === 'check_in') {
      nextAction = 'check_out';
    } else if (workStatus === 'check_out') {
      nextAction = 'complete';
    }

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
        // Cập nhật UI nếu thành công
        updateInfo();
        
        // Hiển thị thông báo thành công nếu cần
        const actionName = getActionName(action);
        Alert.alert(
          t('success'),
          t('action_completed_successfully', { action: actionName }),
          [{ text: t('ok') }]
        );
      } else {
        // Thông báo lỗi nếu thất bại
        Alert.alert(
          t('error'),
          t('action_failed'),
          [{ text: t('ok') }]
        );
      }
    } catch (error) {
      console.error('Lỗi khi thực hiện hành động:', error);
      Alert.alert(
        t('error'),
        t('unexpected_error'),
        [{ text: t('ok') }]
      );
    } finally {
      // Đóng dialog xác nhận nếu đang mở
      setConfirmActionVisible(false);
      
      // Kích hoạt lại nút
      setActionButtonDisabled(false);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Vùng thông tin thời gian */}
        <View style={styles.timeInfoSection}>
          <View style={styles.timeDisplayContainer}>
            <Text style={styles.timeDisplay}>
              {format(currentTime, 'HH:mm', { locale: locale === 'vi' ? vi : enUS })}
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
            {todayEntries.length > 0 ? (
              <View style={styles.actionHistoryList}>
                {todayEntries.map((entry, index) => {
                  let statusText = '';
                  let icon = '';
                  
                  switch(entry.status) {
                    case 'go_work':
                      statusText = t('work_start');
                      icon = 'briefcase-outline';
                      break;
                    case 'check_in':
                      statusText = t('check_in_time');
                      icon = 'log-in-outline';
                      break;
                    case 'check_out':
                      statusText = t('check_out_time');
                      icon = 'log-out-outline';
                      break;
                    case 'complete':
                      statusText = t('completion_time');
                      icon = 'checkmark-done-outline';
                      break;
                    default:
                      statusText = entry.status;
                      icon = 'time-outline';
                  }
                  
                  return (
                    <View key={index} style={styles.actionHistoryItem}>
                      <View style={styles.actionIconContainer}>
                        <Ionicons name={icon} size={20} color={getColorForStatus(entry.status, theme)} />
                      </View>
                      <View style={styles.actionTextContainer}>
                        <Text style={[styles.actionText, { color: theme.colors.textPrimary }]}>
                          {statusText}
                        </Text>
                        <Text style={[styles.actionTime, { color: theme.colors.textSecondary }]}>
                          {format(new Date(entry.timestamp), 'HH:mm')}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={[styles.noHistoryText, { color: theme.colors.textSecondary }]}>
                {t('no_history_today')}
              </Text>
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
  // Vùng thông tin thời gian
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
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  multiActionButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
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
    right: -24,
    top: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currentStatusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
