import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
  TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useShift } from '../context/ShiftContext';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';

const ShiftScreen = () => {
  const { 
    shifts, 
    addShift, 
    updateShift, 
    deleteShift, 
    applyShift,
    validateShiftData,
    isDuplicateShift 
  } = useShift();
  const { theme } = useTheme();
  const { t } = useLocalization();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [newShift, setNewShift] = useState({
    name: '',
    startWorkTime: '',
    endWorkTime: '',
    departureTime: '',
    remindBeforeWork: 15,
    remindAfterWork: 15,
    showSignButton: true,
    appliedDays: [1, 2, 3, 4, 5], // Mặc định áp dụng từ thứ 2 đến thứ 6
    active: true
  });

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerFor, setTimePickerFor] = useState('');
  const [displayReminderOptions, setDisplayReminderOptions] = useState(false);
  const [reminderType, setReminderType] = useState('');
  const reminderOptions = [5, 10, 15, 30, 45, 60];
  const [nameCharCount, setNameCharCount] = useState(0);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (newShift.name) {
      setNameCharCount(newShift.name.length);
      validateShiftName(newShift.name);
    } else {
      setNameCharCount(0);
      setNameError('');
    }
  }, [newShift.name]);

  const validateShiftName = (name) => {
    setNameError('');
    
    const specialCharsRegex = /[^\p{L}\p{N}\s.,\-_()]/u;
    if (specialCharsRegex.test(name)) {
      setNameError(t('shift_name_special_chars'));
      return false;
    }
    
    if (name.length > 200) {
      setNameError(t('shift_name_max_length'));
      return false;
    }
    
    if (!editingShift && shifts.some(shift => shift.name.toLowerCase() === name.toLowerCase())) {
      setNameError(t('shift_name_duplicate'));
      return false;
    }
    
    if (editingShift && name.toLowerCase() !== editingShift.name.toLowerCase() && 
        shifts.some(shift => shift.name.toLowerCase() === name.toLowerCase())) {
      setNameError(t('shift_name_duplicate'));
      return false;
    }
    
    return true;
  };

  const toggleAppliedDay = (day) => {
    let updatedDays = [...newShift.appliedDays];
    
    if (updatedDays.includes(day)) {
      updatedDays = updatedDays.filter(d => d !== day);
    } else {
      updatedDays.push(day);
      updatedDays.sort();
    }
    
    setNewShift({...newShift, appliedDays: updatedDays});
  };

  const handleAddShift = () => {
    setEditingShift(null);
    setNewShift({
      name: '',
      startWorkTime: '',
      endWorkTime: '',
      departureTime: '',
      remindBeforeWork: 15,
      remindAfterWork: 15,
      showSignButton: true,
      appliedDays: [1, 2, 3, 4, 5], 
      active: true
    });
    setModalVisible(true);
  };

  const handleEditShift = (shift) => {
    setEditingShift(shift);
    setNewShift({
      name: shift.name,
      startWorkTime: shift.startWorkTime,
      endWorkTime: shift.endWorkTime,
      departureTime: shift.departureTime,
      remindBeforeWork: shift.remindBeforeWork,
      remindAfterWork: shift.remindAfterWork,
      showSignButton: shift.showSignButton,
      appliedDays: shift.appliedDays || [1, 2, 3, 4, 5], 
      active: shift.active
    });
    setModalVisible(true);
  };

  const handleDeleteShift = (shiftId) => {
    Alert.alert(
      t('confirm'),
      t('delete_shift_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteShift(shiftId);
            if (!success) {
              Alert.alert(t('error'), t('save_shift_error'));
            }
          }
        }
      ]
    );
  };

  const handleSaveShift = () => {
    if (!newShift.name.trim()) {
      Alert.alert(t('error'), t('shift_name_required'));
      return;
    }
    
    if (!newShift.startWorkTime || !newShift.endWorkTime) {
      Alert.alert(t('error'), t('shift_times_required'));
      return;
    }
    
    if (nameError) {
      Alert.alert(t('error'), nameError);
      return;
    }
    
    if (isDuplicateShift(newShift)) {
      Alert.alert(t('error'), t('shift_duplicate'));
      return;
    }
    
    Alert.alert(
      t('confirm'),
      t('save_shift_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('confirm'), 
          onPress: async () => {
            let success = false;
            if (editingShift) {
              success = await updateShift({
                ...editingShift,
                ...newShift
              });
            } else {
              success = await addShift({
                ...newShift
              });
            }
            
            if (success) {
              setModalVisible(false);
            } else {
              Alert.alert(t('error'), t('save_shift_error'));
            }
          }
        }
      ]
    );
  };

  const handleApplyShift = (shift) => {
    applyShift(shift);
    Alert.alert(
      t('success'),
      t('shift_applied')
    );
  };

  const handleOpenTimePicker = (field) => {
    setTimePickerFor(field);
    setShowTimePicker(true);
  };

  const handleTimeChange = (time) => {
    let formattedTime = time;
    if (time && time.length) {
      if (time.length <= 2) {
        formattedTime = time + ':00';
      } else if (!time.includes(':')) {
        formattedTime = time.substring(0, 2) + ':' + time.substring(2, 4);
      }
    }

    setNewShift({...newShift, [timePickerFor]: formattedTime});
    setShowTimePicker(false);
  };

  const handleOpenReminderOptions = (type) => {
    setReminderType(type);
    setDisplayReminderOptions(true);
  };

  const handleSelectReminder = (minutes) => {
    if (reminderType === 'before') {
      setNewShift({...newShift, remindBeforeWork: minutes});
    } else {
      setNewShift({...newShift, remindAfterWork: minutes});
    }
    setDisplayReminderOptions(false);
  };

  const handleResetForm = () => {
    Alert.alert(
      t('confirm'),
      t('reset_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('confirm'), 
          onPress: () => {
            if (editingShift) {
              setNewShift({
                name: editingShift.name,
                startWorkTime: editingShift.startWorkTime || '',
                endWorkTime: editingShift.endWorkTime || '',
                departureTime: editingShift.departureTime || '',
                remindBeforeWork: editingShift.remindBeforeWork || 15,
                remindAfterWork: editingShift.remindAfterWork || 15,
                showSignButton: editingShift.showSignButton !== undefined ? editingShift.showSignButton : true,
                appliedDays: editingShift.appliedDays || [1, 2, 3, 4, 5], 
                active: editingShift.active
              });
            } else {
              setNewShift({
                name: '',
                startWorkTime: '',
                endWorkTime: '',
                departureTime: '',
                remindBeforeWork: 15,
                remindAfterWork: 15,
                showSignButton: true,
                appliedDays: [1, 2, 3, 4, 5], 
                active: true
              });
            }
          }
        }
      ]
    );
  };

  const renderShiftItem = ({ item }) => {
    const isCurrentShift = item.active;
    
    return (
      <View style={[
        styles.shiftItem,
        { backgroundColor: theme.colors.surface }
      ]}>
        <View style={styles.shiftHeader}>
          <Text style={[styles.shiftName, { color: theme.colors.text }]}>{item.name}</Text>
          {isCurrentShift && (
            <View style={[styles.currentBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.currentBadgeText}>{t('current')}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.shiftTimes}>
          <View style={styles.timeItem}>
            <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>{t('shift_start_time')}:</Text>
            <Text style={[styles.timeValue, { color: theme.colors.text }]}>{item.startWorkTime || '--:--'}</Text>
          </View>
          
          <View style={styles.timeItem}>
            <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>{t('shift_end_time')}:</Text>
            <Text style={[styles.timeValue, { color: theme.colors.text }]}>{item.endWorkTime || '--:--'}</Text>
          </View>
          
          {item.departureTime && (
            <View style={styles.timeItem}>
              <Ionicons name="walk-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>{t('departure_time')}:</Text>
              <Text style={[styles.timeValue, { color: theme.colors.text }]}>{item.departureTime || '--:--'}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.shiftActions}>
          {!isCurrentShift && (
            <TouchableOpacity 
              style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleApplyShift(item)}
            >
              <Text style={styles.applyButtonText}>{t('set_as_active')}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: theme.colors.primary }]}
            onPress={() => handleEditShift(item)}
          >
            <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: theme.colors.error }]}
            onPress={() => handleDeleteShift(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.headerTitle}>{t('shifts_title')}</Text>
      </View>
      
      <FlatList
        data={shifts}
        renderItem={renderShiftItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.shiftsList}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.disabled} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('no_shifts')}
            </Text>
          </View>
        )}
      />
      
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddShift}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
      
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background || '#1a1a2e' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingShift ? t('edit_shift') : t('new_shift')}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('shift_name')}</Text>
              <TextInput
                style={styles.textInput}
                value={newShift.name}
                onChangeText={(text) => setNewShift({...newShift, name: text})}
                placeholder={t('shift_name_placeholder')}
                placeholderTextColor="#757575"
                maxLength={200}
              />
              <View style={styles.nameInputFooter}>
                {nameError ? (
                  <Text style={styles.errorText}>{nameError}</Text>
                ) : null}
                <Text style={styles.charCountText}>{nameCharCount}/200 {t('character_count')}</Text>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('departure_time')}</Text>
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => handleOpenTimePicker('departureTime')}
              >
                <Text style={styles.timePickerText}>
                  {newShift.departureTime || '--:--'}
                </Text>
                <Ionicons name="time-outline" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timeRow}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.inputLabel}>{t('shift_start_time')}</Text>
                <TouchableOpacity 
                  style={styles.timePickerButton}
                  onPress={() => handleOpenTimePicker('startWorkTime')}
                >
                  <Text style={styles.timePickerText}>
                    {newShift.startWorkTime || '--:--'}
                  </Text>
                  <Ionicons name="time-outline" size={24} color="#757575" />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.inputLabel}>{t('shift_end_time')}</Text>
                <TouchableOpacity 
                  style={styles.timePickerButton}
                  onPress={() => handleOpenTimePicker('endWorkTime')}
                >
                  <Text style={styles.timePickerText}>
                    {newShift.endWorkTime || '--:--'}
                  </Text>
                  <Ionicons name="time-outline" size={24} color="#757575" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('remind_before_work')}</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => handleOpenReminderOptions('before')}
              >
                <Text style={styles.dropdownText}>
                  {newShift.remindBeforeWork} {t('minutes')}
                </Text>
                <Ionicons name="chevron-down" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('remind_after_work')}</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => handleOpenReminderOptions('after')}
              >
                <Text style={styles.dropdownText}>
                  {newShift.remindAfterWork} {t('minutes')}
                </Text>
                <Ionicons name="chevron-down" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>{t('show_sign_button')}</Text>
              <Switch
                value={newShift.showSignButton}
                onValueChange={(value) => setNewShift({ ...newShift, showSignButton: value })}
                trackColor={{ false: '#3e3e42', true: '#6200ee50' }}
                thumbColor={newShift.showSignButton ? '#6200ee' : '#f4f3f4'}
                ios_backgroundColor="#3e3e42"
              />
            </View>
            
            <View style={styles.appliedDaysGroup}>
              <Text style={styles.inputLabel}>{t('applied_days')}</Text>
              <View style={styles.appliedDaysList}>
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      newShift.appliedDays.includes(day) ? styles.dayButtonSelected : styles.dayButtonUnselected
                    ]}
                    onPress={() => toggleAppliedDay(day)}
                  >
                    <Text 
                      style={[
                        styles.dayButtonText,
                        newShift.appliedDays.includes(day) ? styles.dayButtonTextSelected : styles.dayButtonTextUnselected
                      ]}
                    >
                      {t(`day_${day}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.footerButton, styles.cancelButton]} 
              onPress={handleResetForm}
            >
              <Text style={styles.buttonText}>{t('reset')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.footerButton, styles.saveButton]} 
              onPress={handleSaveShift}
            >
              <Text style={styles.buttonText}>{t('save_shift')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <Modal
        transparent={true}
        visible={showTimePicker}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, maxHeight: '40%' }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    {t('select_time')}
                  </Text>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.timePickerContainer}>
                  <Text style={[styles.timePickerHelp, { color: theme.colors.textSecondary }]}>
                    {t('time_format_help')}
                  </Text>
                  <TextInput
                    style={[styles.timePickerInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                    value={newShift[timePickerFor] || '08:00'}
                    onChangeText={handleTimeChange}
                    placeholder="08:00"
                    placeholderTextColor={theme.colors.placeholder}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      <Modal
        transparent={true}
        visible={displayReminderOptions}
        animationType="slide"
        onRequestClose={() => setDisplayReminderOptions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDisplayReminderOptions(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, maxHeight: '40%' }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                    {t('select_reminder')}
                  </Text>
                  <TouchableOpacity onPress={() => setDisplayReminderOptions(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.reminderOptionsContainer}>
                  {reminderOptions.map((minutes, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.reminderOption, { backgroundColor: theme.colors.surface }]}
                      onPress={() => handleSelectReminder(minutes)}
                    >
                      <Text style={[styles.reminderOptionText, { color: theme.colors.text }]}>{minutes} {t('minutes')}</Text>
                    </TouchableOpacity>
                  ))}
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
  header: {
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  shiftsList: {
    padding: 16,
    paddingBottom: 80,
  },
  shiftItem: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shiftName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shiftTimes: {
    marginBottom: 12,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  shiftActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  modalContainer: {
    margin: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  timePickerButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timePickerText: {
    fontSize: 16,
  },
  dropdownButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#3e3e42',
  },
  saveButton: {
    backgroundColor: '#6200ee',
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timePickerContainer: {
    padding: 16,
  },
  timePickerInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  timePickerHelp: {
    fontSize: 14,
    marginBottom: 8,
  },
  reminderOptionsContainer: {
    padding: 16,
  },
  reminderOption: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
  },
  reminderOptionText: {
    fontSize: 16,
  },
  appliedDaysGroup: {
    marginBottom: 16,
  },
  appliedDaysLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  appliedDaysList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  dayButtonSelected: {
    backgroundColor: '#6200ee',
  },
  dayButtonUnselected: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 14,
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  dayButtonTextUnselected: {
    color: '#333',
  },
  errorText: {
    fontSize: 14,
    color: '#ff0000',
  },
  charCountText: {
    fontSize: 14,
    color: '#757575',
  },
  nameInputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
});

export default ShiftScreen;
