import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

const AddNoteModal = ({ visible, onClose, onSave, initialData, theme, t }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [reminderDate, setReminderDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // Monday to Friday by default
  
  const MAX_TITLE_LENGTH = 100;
  const MAX_CONTENT_LENGTH = 300;
  
  // Week days options
  const weekDays = [
    { id: 1, name: 'T2' },
    { id: 2, name: 'T3' },
    { id: 3, name: 'T4' },
    { id: 4, name: 'T5' },
    { id: 5, name: 'T6' },
    { id: 6, name: 'T7' },
    { id: 0, name: 'CN' },
  ];

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      if (initialData.reminderTime) {
        setReminderDate(new Date(initialData.reminderTime));
      }
      setSelectedDays(initialData.weekDays || [1, 2, 3, 4, 5]);
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setReminderDate(new Date());
    setSelectedDays([1, 2, 3, 4, 5]);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const currentDateTime = new Date(reminderDate);
      currentDateTime.setFullYear(selectedDate.getFullYear());
      currentDateTime.setMonth(selectedDate.getMonth());
      currentDateTime.setDate(selectedDate.getDate());
      setReminderDate(currentDateTime);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const currentDateTime = new Date(reminderDate);
      currentDateTime.setHours(selectedTime.getHours());
      currentDateTime.setMinutes(selectedTime.getMinutes());
      setReminderDate(currentDateTime);
    }
  };

  const toggleDaySelection = (dayId) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(id => id !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleSave = () => {
    // Validation
    if (!title.trim()) {
      Alert.alert(t('error'), t('note_title_required'));
      return;
    }
    
    if (!content.trim()) {
      Alert.alert(t('error'), t('note_content_required'));
      return;
    }
    
    Alert.alert(
      t('confirm'),
      t('save_note_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('save'), 
          onPress: () => {
            const noteData = {
              title: title.trim(),
              content: content.trim(),
              reminderTime: reminderDate.toISOString(),
              weekDays: selectedDays
            };
            
            onSave(noteData);
            resetForm();
          }
        }
      ]
    );
  };

  const handleClose = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        t('confirm'),
        t('exit_note_confirm'),
        [
          { text: t('continue_editing'), style: 'cancel' },
          { text: t('exit'), onPress: () => {
            resetForm();
            onClose();
          }}
        ]
      );
    } else {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[styles.modalContent, { backgroundColor: theme.colors.background || '#1a1a2e' }]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Text style={[styles.modalTitle, { color: '#fff' }]}>
                  {initialData ? t('edit_note') : t('add_note')}
                </Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.form}>
                {/* Title Input */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: '#fff' }]}>{t('title')}</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#fff'
                    }]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={t('title_placeholder')}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    maxLength={MAX_TITLE_LENGTH}
                  />
                  <Text style={[styles.charCounter, { color: 'rgba(255, 255, 255, 0.7)' }]}>{title.length}/{MAX_TITLE_LENGTH}</Text>
                </View>
                
                {/* Content Input */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: '#fff' }]}>{t('content')}</Text>
                  <TextInput
                    style={[styles.input, styles.contentInput, { 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#fff'
                    }]}
                    value={content}
                    onChangeText={setContent}
                    placeholder={t('content_placeholder')}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    multiline={true}
                    maxLength={MAX_CONTENT_LENGTH}
                  />
                  <Text style={[styles.charCounter, { color: 'rgba(255, 255, 255, 0.7)' }]}>{content.length}/{MAX_CONTENT_LENGTH}</Text>
                </View>
                
                {/* Date and Time Pickers */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: '#fff' }]}>{t('reminder_time')}</Text>
                  <View style={styles.dateTimeContainer}>
                    <TouchableOpacity
                      style={[styles.dateTimeButton, { 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      }]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={18} color="#8b5cf6" />
                      <Text style={[styles.dateTimeText, { color: '#fff' }]}>
                        {format(reminderDate, 'dd/MM/yyyy')}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.dateTimeButton, { 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      }]}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Ionicons name="time-outline" size={18} color="#8b5cf6" />
                      <Text style={[styles.dateTimeText, { color: '#fff' }]}>
                        {format(reminderDate, 'HH:mm')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {showDatePicker && (
                    <DateTimePicker
                      value={reminderDate}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                      themeVariant="dark"
                    />
                  )}
                  
                  {showTimePicker && (
                    <DateTimePicker
                      value={reminderDate}
                      mode="time"
                      display="default"
                      onChange={handleTimeChange}
                      themeVariant="dark"
                    />
                  )}
                </View>
                
                {/* Week days selection */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: '#fff' }]}>{t('show_on_days')}</Text>
                  <View style={styles.daysContainer}>
                    {weekDays.map(day => (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          styles.dayButton,
                          { 
                            backgroundColor: selectedDays.includes(day.id) ? '#6b46c1' : 'rgba(255, 255, 255, 0.1)',
                            borderColor: selectedDays.includes(day.id) ? '#8b5cf6' : 'rgba(255, 255, 255, 0.2)'
                          }
                        ]}
                        onPress={() => toggleDaySelection(day.id)}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            { color: selectedDays.includes(day.id) ? '#fff' : 'rgba(255, 255, 255, 0.8)' }
                          ]}
                        >
                          {day.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
              
              {/* Save Button */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: '#6b46c1' }]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  contentInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 4,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 0.48,
  },
  dateTimeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedDayButton: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  selectedDayText: {
    color: '#fff',
  },
  buttonContainer: {
    padding: 16,
    paddingTop: 0,
  },
  saveButton: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddNoteModal;
