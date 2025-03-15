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
import vi from 'date-fns/locale/vi';
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
    getTodayStatus,
    addNote,
    updateNote,
    deleteNote,
    validateAction,
    updateDayStatus
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
  const todayEntries = getTodayStatus();
  
  // Find latest entries for different statuses
  const findLatestEntryByStatus = (status) => {
    const filtered = todayEntries.filter(entry => entry.status === status);
    return filtered.length > 0 ? filtered[0] : null;
  };

  const goWorkEntry = findLatestEntryByStatus('go_work');
  const checkInEntry = findLatestEntryByStatus('check_in');
  const checkOutEntry = findLatestEntryByStatus('check_out');
  const completeEntry = findLatestEntryByStatus('complete');

  // Button action handlers
  const handleMultiActionPress = (action) => {
    // Check if action needs validation
    let lastActionTimestamp = null;
    
    if (action === 'check_in' && goWorkEntry) {
      lastActionTimestamp = goWorkEntry.timestamp;
    } else if (action === 'check_out' && checkInEntry) {
      lastActionTimestamp = checkInEntry.timestamp;
    }
    
    // Validate time difference
    if (lastActionTimestamp && !validateAction(action, lastActionTimestamp)) {
      // Show confirmation dialog
      setNextAction(action);
      setConfirmActionVisible(true);
      return;
    }
    
    // Execute action if validation passes
    updateWorkStatus(action);
  };

  const handleResetPress = () => {
    setConfirmResetVisible(true);
  };

  const confirmReset = () => {
    resetDayStatus();
    setConfirmResetVisible(false);
  };

  const confirmAction = () => {
    if (nextAction) {
      updateWorkStatus(nextAction);
      setNextAction(null);
    }
    setConfirmActionVisible(false);
  };

  // Xử lý khi nhấn nút đi làm
  const handleGoToWork = async () => {
    try {
      if (validateAction('goToWork')) {
        await updateWorkStatus('goToWork');
        
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
      if (validateAction('checkIn')) {
        await updateWorkStatus('checkIn');
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
      if (validateAction('checkOut')) {
        await updateWorkStatus('checkOut');
      }
    } catch (error) {
      console.error('Error handling check out:', error);
    }
  };

  // Xử lý khi nhấn nút hoàn thành
  const handleComplete = async () => {
    try {
      if (validateAction('complete')) {
        await updateWorkStatus('complete');
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
    updateDayStatus(date, newStatus);
  };

  // Get the appropriate button based on current status
  const getActionButton = () => {
    const buttons = {
      inactive: {
        status: 'go_work',
        label: t('go_work'),
        icon: 'walk-outline',
        color: theme.colors.goWorkButton
      },
      go_work: {
        status: 'check_in',
        label: t('check_in'),
        icon: 'log-in-outline',
        color: theme.colors.checkInButton
      },
      check_in: {
        status: 'check_out',
        label: t('check_out'),
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
              onPress={() => {
                if (actionButton.status === 'go_work') {
                  handleGoToWork();
                } else if (actionButton.status === 'check_in') {
                  handleCheckIn();
                } else if (actionButton.status === 'check_out') {
                  handleCheckOut();
                } else if (actionButton.status === 'complete') {
                  handleComplete();
                }
              }}
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
          </View>

          {/* Status Information */}
          <View style={[styles.statusInfoContainer, { backgroundColor: theme.colors.surface }]}>
            {goWorkEntry && (
              <View style={styles.statusItem}>
                <Ionicons name="walk-outline" size={18} color={theme.colors.goWorkButton} />
                <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                  {t('go_work')}: {format(new Date(goWorkEntry.timestamp), 'HH:mm')}
                </Text>
              </View>
            )}
            
            {checkInEntry && (
              <View style={styles.statusItem}>
                <Ionicons name="log-in-outline" size={18} color={theme.colors.checkInButton} />
                <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                  {t('check_in')}: {format(new Date(checkInEntry.timestamp), 'HH:mm')}
                </Text>
              </View>
            )}
            
            {checkOutEntry && (
              <View style={styles.statusItem}>
                <Ionicons name="log-out-outline" size={18} color={theme.colors.checkOutButton} />
                <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                  {t('check_out')}: {format(new Date(checkOutEntry.timestamp), 'HH:mm')}
                </Text>
              </View>
            )}
            
            {completeEntry && (
              <View style={styles.statusItem}>
                <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.completeButton} />
                <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                  {t('complete')}: {format(new Date(completeEntry.timestamp), 'HH:mm')}
                </Text>
              </View>
            )}
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

      {/* Reset Confirmation Modal */}
      <Modal
        transparent={true}
        visible={confirmResetVisible}
        animationType="fade"
        onRequestClose={() => setConfirmResetVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setConfirmResetVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.confirmDialog, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.confirmTitle, { color: theme.colors.text }]}>{t('confirm')}</Text>
                <Text style={[styles.confirmText, { color: theme.colors.textSecondary }]}>
                  {t('reset_day_confirm')}
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.cancelButton, { backgroundColor: theme.colors.disabled }]}
                    onPress={() => setConfirmResetVisible(false)}
                  >
                    <Text style={styles.confirmButtonText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.okButton, { backgroundColor: theme.colors.primary }]}
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

      {/* Action Confirmation Modal */}
      <Modal
        transparent={true}
        visible={confirmActionVisible}
        animationType="fade"
        onRequestClose={() => setConfirmActionVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setConfirmActionVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.confirmDialog, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.confirmTitle, { color: theme.colors.text }]}>{t('confirm')}</Text>
                <Text style={[styles.confirmText, { color: theme.colors.textSecondary }]}>
                  {nextAction === 'check_in' ? t('time_validation_check_in') : t('time_validation_check_out')}
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.cancelButton, { backgroundColor: theme.colors.disabled }]}
                    onPress={() => setConfirmActionVisible(false)}
                  >
                    <Text style={styles.confirmButtonText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.okButton, { backgroundColor: theme.colors.primary }]}
                    onPress={confirmAction}
                  >
                    <Text style={styles.confirmButtonText}>{t('continue')}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  statusInfoContainer: {
    borderRadius: 8,
    padding: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 8,
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
  confirmDialog: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  confirmText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
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
  cancelButton: {
    marginRight: 10,
  },
  okButton: {
  },
});

export default HomeScreen;
