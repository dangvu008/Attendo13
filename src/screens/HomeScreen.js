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
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { format, differenceInMinutes, differenceInHours, isToday, parseISO, addDays } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
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
  }, [workStatus]);

  // Lấy thông tin ca làm việc và trạng thái khi component được tạo
  useEffect(() => {
    // Khởi tạo lần đầu
    updateInfo();
  }, []);

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
  const handleDeleteNote = (noteId) => {
    Alert.alert(
      t('confirm'),
      t('delete_note_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), onPress: () => deleteNote(noteId), style: 'destructive' }
      ]
    );
  };

  // Hàm để xử lý lưu ghi chú
  const handleSaveNote = (note) => {
    if (selectedNote) {
      updateNote({ ...selectedNote, ...note });
    } else {
      addNote(note);
    }
    setIsAddNoteModalVisible(false);
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

  // Hàm để xử lý xác nhận reset
  const confirmReset = async () => {
    try {
      const success = await resetDayStatus();
      if (success) {
        console.log('Reset thành công trạng thái ngày hôm nay');
        
        // Cập nhật trạng thái màn hình về trạng thái ban đầu
        setWorkStatus(null);
        
        // Đặt lại nextAction để tránh xung đột
        setNextAction(null);
        
        // Cập nhật UI
        updateInfo();
        
        // Đảm bảo nút đa năng được kích hoạt lại
        setActionButtonDisabled(false);
        
        // Cập nhật lại các nhắc nhở nếu cần
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
      } else {
        console.error('Có lỗi khi reset trạng thái');
      }
    } catch (error) {
      console.error('Lỗi khi reset:', error);
    } finally {
      // Luôn đảm bảo đóng popup
      setConfirmResetVisible(false);
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

  // Lấy thông tin ca làm việc từ storage
  const loadShiftInfo = async () => {
    try {
      const shiftInfoJson = await AsyncStorage.getItem('currentShift');
      
      if (shiftInfoJson) {
        const parsedShiftInfo = JSON.parse(shiftInfoJson);
        setShiftInfo(parsedShiftInfo);
        return parsedShiftInfo;
      }
      
      return null;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin ca làm việc:', error);
      return null;
    }
  };

  // Cập nhật thông tin ca làm việc 
  useEffect(() => {
    const fetchShiftInfo = async () => {
      const shift = await loadShiftInfo();
      if (shift) {
        console.log('Loaded shift info:', shift);
      }
    };
    
    fetchShiftInfo();
  }, []);

  // Kiểm tra trạng thái vào muộn
  const checkIfLateCheckIn = (checkInTime, shiftStartTime) => {
    if (!checkInTime || !shiftStartTime) return false;
    
    // Chuyển đổi thời gian sang Date objects
    const checkInDate = parseISO(checkInTime);
    
    // Parse shiftStartTime dạng "HH:MM" thành Date object của ngày hôm nay
    const [hours, minutes] = shiftStartTime.split(':').map(Number);
    
    const shiftDate = new Date();
    shiftDate.setHours(hours, minutes, 0, 0);
    
    // Thêm thời gian dung sai (5 phút)
    const graceDate = new Date(shiftDate);
    graceDate.setMinutes(graceDate.getMinutes() + 5);
    
    // Vào muộn nếu vào sau thời gian dung sai (sau 08:05 với ca 08:00)
    return checkInDate > graceDate;
  };

  // Kiểm tra trạng thái ra sớm
  const checkIfEarlyCheckOut = (checkOutTime, officeEndTime) => {
    if (!checkOutTime || !officeEndTime) return false;
    
    // Chuyển đổi thời gian sang Date objects
    const checkOutDate = parseISO(checkOutTime);
    
    // Parse officeEndTime dạng "HH:MM" thành Date object của ngày hôm nay
    const [hours, minutes] = officeEndTime.split(':').map(Number);
    
    const endDate = new Date();
    endDate.setHours(hours, minutes, 0, 0);
    
    // Ra sớm nếu ra trước thời gian kết thúc quy định (trước 17:00)
    return checkOutDate < endDate;
  };

  // Kiểm tra trạng thái nghỉ
  const checkIfAbsent = (checkInTime, checkOutTime) => {
    // Nếu không có check-in hoặc không có check-out
    if (!checkInTime || !checkOutTime) return true;
    
    // Chuyển đổi thời gian sang Date objects
    const checkInDate = parseISO(checkInTime);
    const checkOutDate = parseISO(checkOutTime);
    
    // Tính khoảng thời gian làm việc (phút)
    const workMinutes = differenceInMinutes(checkOutDate, checkInDate);
    
    // Nếu thời gian làm việc dưới 60 phút (1 giờ), coi như nghỉ
    return workMinutes < 60;
  };

  // Tính toán số giờ công theo quy tắc mới
  const calculateWorkHours = (checkInTime, checkOutTime, shiftInfo) => {
    if (!checkInTime || !checkOutTime || !shiftInfo) return {
      regularHours: 0,
      overtime150: 0,
      overtime200: 0,
      overtime300: 0,
      totalHours: 0,
      workDayStatus: 'absent'
    };
    
    // Chuyển đổi thời gian sang Date objects
    const checkInDate = parseISO(checkInTime);
    const checkOutDate = parseISO(checkOutTime);
    
    // Kiểm tra xem có phải ngày nghỉ không (T7/CN)
    const dayOfWeek = checkInDate.getDay(); // 0 = CN, 6 = T7
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Parse thời gian ca làm việc
    const [startHours, startMinutes] = shiftInfo.startTime.split(':').map(Number);
    const [endHours, endMinutes] = shiftInfo.endTime.split(':').map(Number);
    
    // Tạo Date objects cho thời gian ca làm việc
    const shiftStartDate = new Date(checkInDate);
    shiftStartDate.setHours(startHours, startMinutes, 0, 0);
    
    const shiftEndDate = new Date(checkInDate);
    shiftEndDate.setHours(endHours, endMinutes, 0, 0);
    
    // Thời gian ân trưa (cố định 1 giờ)
    const lunchBreakHours = 1;
    
    // Tạo giờ kết thúc với thời gian dung sai
    const graceStartDate = new Date(shiftStartDate);
    graceStartDate.setMinutes(graceStartDate.getMinutes() + 5); // 5 phút dung sai
    
    // Kiểm tra trạng thái nghỉ (làm việc dưới 1 giờ)
    const workMinutes = differenceInMinutes(checkOutDate, checkInDate);
    if (workMinutes < 60) {
      setWorkDayStatus('absent');
      return {
        regularHours: 0,
        overtime150: 0,
        overtime200: 0,
        overtime300: 0,
        totalHours: 0,
        workDayStatus: 'absent'
      };
    }
    
    // Kiểm tra trạng thái vào muộn
    const isLateCheckIn = checkInDate > graceStartDate;
    setCheckInStatus(isLateCheckIn ? 'late' : 'normal');
    
    // Kiểm tra trạng thái ra sớm (trước thời gian kết thúc quy định)
    const isEarlyCheckOut = checkOutDate < shiftEndDate;
    setCheckOutStatus(isEarlyCheckOut ? 'early' : 'normal');
    
    // Tính giờ công chuẩn (8 giờ)
    let regularHours = 8;
    
    // Nếu vào muộn hoặc ra sớm, giảm giờ công theo bội số 30 phút
    if (isLateCheckIn) {
      // Tính số phút vào muộn
      const lateMinutes = differenceInMinutes(checkInDate, shiftStartDate);
      // Làm tròn lên theo bội số 30 phút
      const deductedHours = Math.ceil(lateMinutes / 30) / 2; // Chuyển đổi 30 phút thành 0.5 giờ
      regularHours -= deductedHours;
    }
    
    if (isEarlyCheckOut) {
      // Tính số phút ra sớm
      const earlyMinutes = differenceInMinutes(shiftEndDate, checkOutDate);
      // Làm tròn lên theo bội số 30 phút
      const deductedHours = Math.ceil(earlyMinutes / 30) / 2; // Chuyển đổi 30 phút thành 0.5 giờ
      regularHours -= deductedHours;
    }
    
    // Đảm bảo giờ công không âm
    regularHours = Math.max(0, regularHours);
    
    // Cập nhật trạng thái ngày công
    if (isLateCheckIn || isEarlyCheckOut) {
      setWorkDayStatus('rv'); // Vào muộn/Ra sớm
    } else {
      setWorkDayStatus('full'); // Công đầy đủ
    }
    
    // Tính giờ tăng ca (nếu có)
    let overtime150 = 0;
    let overtime200 = 0;
    let overtime300 = 0;
    
    // Kiểm tra có phải làm đêm không (từ 22:00 đến 6:00 sáng hôm sau)
    const isNightShift = (hour) => hour >= 22 || hour < 6;
    
    // Nếu làm việc quá giờ hành chính, tính tăng ca
    if (checkOutDate > shiftEndDate) {
      // Tính toán số giờ tăng ca
      const overtimeMinutes = differenceInMinutes(checkOutDate, shiftEndDate);
      let overtimeHours = overtimeMinutes / 60;
      
      if (isWeekend) {
        // Tăng ca 200% cho ngày nghỉ (T7/CN)
        overtime200 = overtimeHours;
      } else {
        // Tách thời gian tăng ca thành các khoảng để tính
        const overtimeStartHour = shiftEndDate.getHours();
        const overtimeEndHour = checkOutDate.getHours();
        
        // Kiểm tra tăng ca đêm
        if (isNightShift(overtimeStartHour) || isNightShift(overtimeEndHour)) {
          // Nếu có làm đêm, tính 300%
          overtime300 = overtimeHours;
        } else {
          // Tăng ca ngày thường, tính 150%
          overtime150 = overtimeHours;
        }
      }
    }
    
    // Tổng số giờ công
    const totalHours = regularHours + overtime150 + overtime200 + overtime300;
    
    return {
      regularHours,
      overtime150,
      overtime200,
      overtime300,
      totalHours,
      workDayStatus: workDayStatus
    };
  };

  // Lưu thông tin giờ công
  const saveWorkHoursInfo = async (hoursInfo) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Lấy dữ liệu hiện có
      const hoursDataJson = await AsyncStorage.getItem('workHoursData');
      const hoursData = hoursDataJson ? JSON.parse(hoursDataJson) : {};
      
      // Cập nhật thông tin của ngày hôm nay
      hoursData[today] = {
        ...hoursInfo,
        checkInStatus: checkInStatus,
        checkOutStatus: checkOutStatus,
        workDayStatus: workDayStatus,
        date: today
      };
      
      // Lưu lại
      await AsyncStorage.setItem('workHoursData', JSON.stringify(hoursData));
      
      return true;
    } catch (error) {
      console.error('Lỗi khi lưu thông tin giờ công:', error);
      return false;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.dateTimeContainer}>
            <Text style={[styles.dateText, { color: theme.colors.text }]}>{formatDate(currentTime)}</Text>
            <Text style={[styles.timeText, { color: theme.colors.primary }]}>{formatTime(currentTime)}</Text>
          </View>
          
          {currentShift && (
            <View style={[styles.shiftInfo, { backgroundColor: isDarkMode ? theme.colors.surface : '#e6e6ff' }]}>
              <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.shiftText, { color: theme.colors.primary }]}>{currentShift.name}</Text>
              <Text style={[styles.shiftTimeText, { color: theme.colors.textSecondary }]}>
                {formatShiftTime(currentShift.startWorkTime)} - {formatShiftTime(currentShift.endWorkTime)}
              </Text>
            </View>
          )}
        </View>

        {/* Main Action Button Section */}
        <View style={styles.actionSection}>
          <View style={styles.multiActionContainer}>
            {/* Nút hành động */}
            <MultiActionButton
              label={actionButton.label}
              iconName={actionButton.icon}
              color={actionButton.color}
              onPress={handleActionButtonPress}
              disabled={actionButton.disabled || actionButtonDisabled}
            />

            {/* Lịch sử hành động */}
            <View style={styles.actionHistoryContainer}>
              <Text style={[styles.actionHistoryTitle, { color: theme.colors.textPrimary }]}>
                {t('action_history')}
              </Text>

              {/* Trạng thái hiện tại */}
              <View style={styles.currentStatusContainer}>
                <Text style={[styles.currentStatusLabel, { color: theme.colors.textSecondary }]}>
                  {t('current_status')}:
                </Text>
                <View style={styles.currentStatusValueContainer}>
                  <Ionicons
                    name={getIconForStatus(workStatus)}
                    size={18}
                    color={getColorForStatus(workStatus, theme)}
                  />
                  <Text style={[
                    styles.currentStatusValue,
                    { color: getColorForStatus(workStatus, theme) }
                  ]}>
                    {t(workStatus || 'not_started')}
                  </Text>
                </View>
              </View>

              {/* Danh sách lịch sử */}
              <View style={styles.historyList}>
                {/* Mục Đi làm */}
                {goWorkEntry && (
                  <View style={styles.historyItem}>
                    <View style={styles.historyIconContainer}>
                      <Ionicons
                        name="briefcase-outline"
                        size={18}
                        color={theme.colors.goWorkButton}
                      />
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={[styles.historyText, { color: theme.colors.textPrimary }]}>
                        {t('work_start')}
                      </Text>
                      <Text style={[styles.historyTime, { color: theme.colors.textSecondary }]}>
                        {formatTime(new Date(goWorkEntry.timestamp))}
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* Mục Chấm công vào */}
                {checkInEntry && (
                  <View style={styles.historyItem}>
                    <View style={styles.historyIconContainer}>
                      <Ionicons
                        name="log-in-outline"
                        size={18}
                        color={theme.colors.checkInButton}
                      />
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={[styles.historyText, { color: theme.colors.textPrimary }]}>
                        {t('check_in_time')}
                      </Text>
                      <Text style={[styles.historyTime, { color: theme.colors.textSecondary }]}>
                        {formatTime(new Date(checkInEntry.timestamp))}
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* Mục Chấm công ra */}
                {checkOutEntry && (
                  <View style={styles.historyItem}>
                    <View style={styles.historyIconContainer}>
                      <Ionicons
                        name="log-out-outline"
                        size={18}
                        color={theme.colors.checkOutButton}
                      />
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={[styles.historyText, { color: theme.colors.textPrimary }]}>
                        {t('check_out_time')}
                      </Text>
                      <Text style={[styles.historyTime, { color: theme.colors.textSecondary }]}>
                        {formatTime(new Date(checkOutEntry.timestamp))}
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* Mục Hoàn thành */}
                {completeEntry && (
                  <View style={styles.historyItem}>
                    <View style={styles.historyIconContainer}>
                      <Ionicons
                        name="checkmark-done-outline"
                        size={18}
                        color={theme.colors.completeButton}
                      />
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={[styles.historyText, { color: theme.colors.textPrimary }]}>
                        {t('completion_time')}
                      </Text>
                      <Text style={[styles.historyTime, { color: theme.colors.textSecondary }]}>
                        {formatTime(new Date(completeEntry.timestamp))}
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* Hiển thị thông báo nếu chưa có lịch sử */}
                {!goWorkEntry && !checkInEntry && !checkOutEntry && !completeEntry && (
                  <Text style={[styles.noHistoryText, { color: theme.colors.textSecondary }]}>
                    {t('no_history_today')}
                  </Text>
                )}
              </View>
            </View>
          </View>
          
          {/* Nút reset được tách riêng khỏi multiActionContainer */}
          {showResetButton && (
            <View style={styles.resetButtonContainer}>
              <TouchableOpacity 
                style={[styles.resetButton, { backgroundColor: theme.colors.resetButton }]}
                onPress={handleResetPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Nút Ký Công - Hiển thị sau khi chấm công vào */}
          {workStatus === 'check_in' && currentShift && currentShift.showSignButton && (
            <TouchableOpacity 
              style={[styles.signButton, { backgroundColor: theme.colors.completeButton }]}
              onPress={handleComplete}
            >
              <Ionicons name="document-text-outline" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          
          {/* Action History Section */}
          <View style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('workHistory')}</Text>
            </View>
            <View style={[styles.historyCard, { backgroundColor: theme.colors.surface, ...theme.elevation.small }]}>
              {todayEntries.length > 0 ? (
                <View style={styles.historyList}>
                  {/* Trạng thái hiện tại */}
                  <View style={[styles.currentStatusContainer, { backgroundColor: theme.colors.primaryLight }]}>
                    <Text style={[styles.currentStatusTitle, { color: theme.colors.primary }]}>
                      {t('currentStatus')}:
                    </Text>
                    <Text style={[styles.currentStatusText, { color: theme.colors.text }]}>
                      {workStatus ? 
                        (workStatus === 'go_work' ? t('statusWorking') :
                        workStatus === 'check_in' ? t('statusCheckedIn') :
                        workStatus === 'check_out' ? t('statusCheckedOut') :
                        workStatus === 'complete' ? t('statusCompleted') : t('statusIdle')) 
                        : t('statusIdle')}
                    </Text>
                  </View>
                  
                  {/* Lịch sử các thao tác */}
                  {todayEntries.map((entry, index) => {
                    let statusText = '';
                    let icon = '';
                    let iconColor = theme.colors.primary;
                    
                    switch(entry.status) {
                      case 'go_work':
                        statusText = t('goToWork');
                        icon = 'briefcase-outline';
                        iconColor = theme.colors.goWorkButton;
                        break;
                      case 'check_in':
                        statusText = t('checkIn');
                        icon = 'log-in-outline';
                        iconColor = theme.colors.checkInButton;
                        break;
                      case 'check_out':
                        statusText = t('checkOut');
                        icon = 'log-out-outline';
                        iconColor = theme.colors.checkOutButton;
                        break;
                      case 'complete':
                      case 'sign':
                        statusText = entry.status === 'complete' ? t('complete') : t('sign_work');
                        icon = 'checkmark-circle-outline';
                        iconColor = theme.colors.completeButton;
                        break;
                      default:
                        statusText = entry.status;
                        icon = 'information-circle-outline';
                    }
                    
                    return (
                      <View key={index} style={styles.historyItem}>
                        <View style={[styles.historyIconContainer, { backgroundColor: iconColor }]}>
                          <Ionicons name={icon} size={18} color="#fff" />
                        </View>
                        <View style={styles.historyContent}>
                          <Text style={[styles.historyTitle, { color: theme.colors.text }]}>
                            {statusText}
                          </Text>
                          <Text style={[styles.historyTime, { color: theme.colors.textSecondary }]}>
                            {formatTime(new Date(entry.timestamp))}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyHistory}>
                  <Ionicons name="calendar-outline" size={30} color={theme.colors.disabled} />
                  <Text style={[styles.emptyHistoryText, { color: theme.colors.textSecondary }]}>
                    {t('no_history_today')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Weekly Status Grid */}
        <View style={[styles.weeklyStatusSection, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('weekly_status')}</Text>
          <WeeklyStatusGrid 
            weeklyStatus={weeklyStatus} 
            statusDetails={statusDetails}
            onStatusChange={handleStatusChange}
            theme={theme}
          />
        </View>

        {/* Notes Section */}
        <View style={[styles.notesSection, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.notesHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('work_notes')}</Text>
            <TouchableOpacity 
              style={[styles.addNoteButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddNote}
            >
              <Ionicons name="add-outline" size={18} color="#fff" />
              <Text style={styles.addNoteButtonText}>{t('add_note')}</Text>
            </TouchableOpacity>
          </View>
          
          {notes.length > 0 ? (
            notes.slice(0, 3).map(note => (
              <NoteItem
                key={note.id}
                note={note}
                onEdit={() => handleEditNote(note)}
                onDelete={() => handleDeleteNote(note.id)}
                theme={theme}
              />
            ))
          ) : (
            <Text style={[styles.emptyNotesText, { color: theme.colors.textSecondary }]}>{t('no_notes')}</Text>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Note Modal */}
      <AddNoteModal
        visible={isAddNoteModalVisible}
        onClose={() => setIsAddNoteModalVisible(false)}
        onSave={handleSaveNote}
        initialData={selectedNote}
        theme={theme}
        t={t}
      />

      {/* Xác nhận Reset Trạng Thái */}
      <Modal
        visible={confirmResetVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmResetVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setConfirmResetVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.confirmModalContainer, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.confirmModalTitle, { color: theme.colors.text }]}>
                  {t('confirm_reset')}
                </Text>
                <Text style={[styles.confirmModalMessage, { color: theme.colors.textSecondary }]}>
                  {t('confirm_reset_today')}
                </Text>
                <View style={styles.confirmButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: theme.colors.cancelButton }]}
                    onPress={() => setConfirmResetVisible(false)}
                  >
                    <Text style={styles.confirmButtonText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: theme.colors.resetButton }]}
                    onPress={confirmReset}
                  >
                    <Text style={styles.confirmButtonText}>{t('reset')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Xác nhận Hành Động Khi Không Đủ Thời Gian */}
      <Modal
        visible={confirmActionVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setConfirmActionVisible(false);
          setNextAction(null); // Đảm bảo xóa hành động tiếp theo khi đóng
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setConfirmActionVisible(false);
          setNextAction(null); // Đảm bảo xóa hành động tiếp theo khi đóng
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.confirmModalContainer, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.confirmModalTitle, { color: theme.colors.text }]}>
                  {t('confirm_action_title')}
                </Text>
                <Text style={[styles.confirmModalMessage, { color: theme.colors.textSecondary }]}>
                  {confirmMessage}
                </Text>
                <View style={styles.confirmButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: theme.colors.cancelButton }]}
                    onPress={() => {
                      setConfirmActionVisible(false);
                      setNextAction(null); // Đảm bảo xóa hành động tiếp theo khi hủy
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: theme.colors.primary }]}
                    onPress={confirmAction}
                  >
                    <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  dateTimeContainer: {
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  shiftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  shiftText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    marginRight: 12,
  },
  shiftTimeText: {
    fontSize: 14,
  },
  actionSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  multiActionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  resetButtonContainer: {
    position: 'absolute',
    top: 0,
    right: '30%',
    width: 42,
    height: 42,
    zIndex: 200,
  },
  resetButton: {
    position: 'relative',
    backgroundColor: 'red',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  signButton: {
    position: 'absolute',
    right: -60,
    top: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  weeklyStatusSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  notesSection: {
    borderRadius: 12,
    padding: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addNoteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addNoteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyNotesText: {
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContainer: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmModalMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  confirmButton: {
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historySection: {
    marginTop: 30,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  historyCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  historyList: {
    gap: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  historyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 14,
    marginTop: 2,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyHistoryText: {
    marginTop: 8,
    fontSize: 14,
  },
  currentStatusContainer: {
    flexDirection: 'column',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  currentStatusTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  currentStatusText: {
    fontSize: 15,
    fontWeight: '500',
  },
  actionHistoryContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    width: '90%',
  },
  actionHistoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  currentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    padding: 8,
    borderRadius: 8,
  },
  currentStatusLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  currentStatusValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentStatusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  historyList: {
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    padding: 8,
    borderRadius: 8,
  },
  historyIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 14,
  },
  noHistoryText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    marginVertical: 8,
  },
});

export default HomeScreen;
