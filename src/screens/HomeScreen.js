import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { format, isToday, parseISO, differenceInMinutes, differenceInHours } from 'date-fns';
import { vi } from '../utils/viLocale';

import { useShift } from '../context/ShiftContext';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import * as NotificationService from '../services/NotificationService';

// Components
import MultiActionButton from '../components/MultiActionButton';
import WeeklyStatusGrid from '../components/WeeklyStatusGrid';
import NoteItem from '../components/NoteItem';
import AddNoteModal from '../components/AddNoteModal';

const HomeScreen = () => {
  const {
    currentShift,
    workStatus,
    statusHistory,
    weeklyStatus,
    statusDetails,
    notes,
    updateWorkStatus,
    resetDayStatus,
    addNote,
    updateNote,
    deleteNote,
    validateAction,
    updateDayStatus,
    manualUpdateWeeklyStatus
  } = useShift();

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

  // Lấy thông tin ca làm việc và trạng thái khi component được tạo
  useEffect(() => {
    // Lấy lịch sử bấm nút ngày hôm nay
    const today = getTodayStatus();
    setTodayEntries(today);
  }, [statusHistory, getTodayStatus]);

  // Format functions
  const formatDate = (date) => {
    // Check if viLocale is available before using it
    return format(date, 'EEEE, dd/MM/yyyy', { locale: vi });
  };

  const formatTime = (date) => {
    return format(date, 'HH:mm:ss');
  };

  const formatShiftTime = (timeString) => {
    return timeString || '--:--';
  };

  // Get today's history entries
  const getTodayStatus = () => {
    // Lọc các mục của ngày hôm nay
    const todayEntries = statusHistory
      .filter(entry => isToday(parseISO(entry.timestamp)))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Tạo map để lưu trữ mục mới nhất cho mỗi loại trạng thái
    const uniqueStatusMap = new Map();
    
    // Duyệt qua để lấy mục mới nhất cho mỗi trạng thái
    todayEntries.forEach(entry => {
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

  // Find latest entries for different statuses
  const findLatestEntryByStatus = (status) => {
    const filtered = todayEntries.filter(entry => entry.status === status);
    return filtered.length > 0 ? filtered[0] : null;
  };

  const goWorkEntry = findLatestEntryByStatus('go_work');
  const checkInEntry = findLatestEntryByStatus('check_in');
  const checkOutEntry = findLatestEntryByStatus('check_out');
  const completeEntry = findLatestEntryByStatus('complete');

  // Check if action needs validation
  const handleMultiActionPress = (action) => {
    // Lưu hành động tiếp theo và hiển thị xác nhận
    setNextAction(action);
    setConfirmActionVisible(true);
  };

  const handleResetPress = () => {
    setConfirmResetVisible(true);
  };

  const confirmReset = async () => {
    const success = await resetDayStatus();
    if (success) {
      console.log('Reset thành công trạng thái ngày hôm nay');
    } else {
      console.error('Có lỗi khi reset trạng thái');
    }
    setConfirmResetVisible(false);
  };

  const confirmAction = async () => {
    try {
      if (nextAction) {
        // Log để debug
        console.log('Thực hiện hành động:', nextAction);
        
        if (nextAction === 'go_work') {
          await handleGoToWork();
        } else if (nextAction === 'check_in') {
          await handleCheckIn();
        } else if (nextAction === 'check_out') {
          await handleCheckOut();
        } else if (nextAction === 'complete') {
          await handleComplete();
        }
        
        // Log kết quả
        console.log('Đã hoàn thành hành động:', nextAction);
        setNextAction(null);
      }
      setConfirmActionVisible(false);
    } catch (error) {
      console.error('Lỗi khi xác nhận hành động:', error);
      // Vẫn đóng modal ngay cả khi có lỗi
      setConfirmActionVisible(false);
    }
  };

  // Xử lý khi nhấn nút đi làm
  const handleGoToWork = async () => {
    try {
      if (validateAction('go_work')) {
        const result = await updateWorkStatus('go_work');
        if (result) {
          // Cập nhật lịch sử ngay lập tức
          setTodayEntries(getTodayStatus());
        }
        
        // Tự động lập lịch nhắc nhở dựa trên cài đặt
        const settings = await NotificationService.loadNotificationSettings();
        if (settings.enabled && settings.reminderType !== 'none' && currentShift) {
          await NotificationService.scheduleShiftReminders(
            currentShift,
            settings.reminderType
          );
        }
      }
    } catch (error) {
      console.error('Error handling go to work:', error);
    }
  };

  // Xử lý khi nhấn nút check in
  const handleCheckIn = async () => {
    try {
      if (validateAction('check_in')) {
        const result = await updateWorkStatus('check_in');
        if (result) {
          // Cập nhật lịch sử ngay lập tức
          setTodayEntries(getTodayStatus());
        }
        
        // Hủy nhắc nhở check-in nếu có
        if (currentReminders.some(r => r.type === 'check_in')) {
          const checkInReminder = currentReminders.find(r => r.type === 'check_in');
          if (checkInReminder) {
            await NotificationService.cancelNotification(checkInReminder.id);
          }
        }
      }
    } catch (error) {
      console.error('Error handling check in:', error);
    }
  };

  // Xử lý khi nhấn nút check out
  const handleCheckOut = async () => {
    try {
      if (validateAction('check_out')) {
        const result = await updateWorkStatus('check_out');
        if (result) {
          // Cập nhật lịch sử ngay lập tức
          setTodayEntries(getTodayStatus());
        }
      }
    } catch (error) {
      console.error('Error handling check out:', error);
    }
  };

  // Xử lý khi nhấn nút hoàn thành
  const handleComplete = async () => {
    try {
      if (validateAction('complete')) {
        const result = await updateWorkStatus('complete');
        if (result) {
          // Cập nhật lịch sử ngay lập tức
          setTodayEntries(getTodayStatus());
        }
        
        // Hủy tất cả nhắc nhở liên quan đến ca làm việc hiện tại
        await NotificationService.cancelAllShiftNotifications();
      }
    } catch (error) {
      console.error('Error handling complete:', error);
    }
  };

  // Note handlers
  const handleAddNote = () => {
    setSelectedNote(null);
    setIsAddNoteModalVisible(true);
  };

  const handleEditNote = (note) => {
    setSelectedNote(note);
    setIsAddNoteModalVisible(true);
  };

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

  // Get the appropriate button based on current status
  const getActionButton = () => {
    const buttons = {
      inactive: {
        status: 'go_work',
        label: t('goToWork'),
        icon: 'walk-outline',
        color: theme.colors.goWorkButton
      },
      go_work: {
        status: 'check_in',
        label: t('checkIn'),
        icon: 'log-in-outline',
        color: theme.colors.checkInButton
      },
      check_in: {
        status: 'check_out',
        label: t('checkOut'),
        icon: 'log-out-outline',
        color: theme.colors.checkOutButton
      },
      check_out: {
        status: 'complete',
        label: t('complete'),
        icon: 'checkmark-circle-outline',
        color: theme.colors.completeButton
      },
      complete: {
        status: 'complete',
        label: t('completed'),
        icon: 'checkmark-done-circle-outline',
        color: theme.colors.disabled,
        disabled: true
      }
    };

    return buttons[workStatus] || buttons.inactive;
  };

  const actionButton = getActionButton();
  
  // Determine if we should show the reset button
  const showResetButton = workStatus !== 'inactive';

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
            <MultiActionButton
              status={actionButton.status}
              label={actionButton.label}
              iconName={actionButton.icon}
              color={actionButton.color}
              onPress={() => handleMultiActionPress(actionButton.status)}
              disabled={actionButton.disabled || actionButtonDisabled}
            />
            
            {showResetButton && (
              <TouchableOpacity 
                style={[styles.resetButton, { backgroundColor: theme.colors.resetButton }]}
                onPress={handleResetPress}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
              </TouchableOpacity>
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
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('action_history')}</Text>
              </View>
              <View style={[styles.historyCard, { backgroundColor: theme.colors.surface }]}>
                {todayEntries.length > 0 ? (
                  todayEntries.map((entry, index) => {
                    let statusText = '';
                    let icon = '';
                    let iconColor = theme.colors.primary;
                    
                    switch(entry.status) {
                      case 'go_work':
                        statusText = t('goToWork');
                        icon = 'walk-outline';
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
                      <View key={entry.id} style={[
                        styles.historyItem,
                        index < todayEntries.length - 1 && styles.historyItemBorder
                      ]}>
                        <View style={styles.historyItemLeft}>
                          <Ionicons name={icon} size={20} color={iconColor} />
                          <Text style={[styles.historyText, { color: theme.colors.text }]}>
                            {statusText}
                          </Text>
                        </View>
                        <Text style={[styles.historyTime, { color: theme.colors.textSecondary }]}>
                          {format(parseISO(entry.timestamp), 'HH:mm')}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={[styles.noHistoryText, { color: theme.colors.textSecondary }]}>
                    {t('no_history_today')}
                  </Text>
                )}
              </View>
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
                  {t('confirm_reset_title')}
                </Text>
                <Text style={[styles.confirmModalMessage, { color: theme.colors.textSecondary }]}>
                  {t('confirm_reset_message')}
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
        onRequestClose={() => setConfirmActionVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setConfirmActionVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.confirmModalContainer, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.confirmModalTitle, { color: theme.colors.text }]}>
                  {t('confirm_action_title')}
                </Text>
                <Text style={[styles.confirmModalMessage, { color: theme.colors.textSecondary }]}>
                  {nextAction === 'check_in' 
                    ? t('confirm_early_check_in') 
                    : nextAction === 'check_out'
                    ? t('confirm_early_check_out')
                    : t('confirm_action_message')}
                </Text>
                <View style={styles.confirmButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: theme.colors.cancelButton }]}
                    onPress={() => setConfirmActionVisible(false)}
                  >
                    <Ionicons name="close-circle-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: theme.colors.resetButton }]}
                    onPress={() => {
                      setNextAction(null);
                      setConfirmActionVisible(false);
                    }}
                  >
                    <Ionicons name="arrow-forward-circle-outline" size={24} color="#fff" />
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
    marginBottom: 24,
  },
  multiActionContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButton: {
    position: 'absolute',
    right: -10,
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
  },
  confirmModalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  confirmButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: '45%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historySection: {
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  historyCard: {
    borderRadius: 12,
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyText: {
    fontSize: 14,
    marginLeft: 8,
  },
  historyTime: {
    fontSize: 14,
    color: '#666',
  },
  noHistoryText: {
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
});

export default HomeScreen;
