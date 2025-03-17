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
  const [selectedColor, setSelectedColor] = useState('#4285F4');
  const [selectedTags, setSelectedTags] = useState([]);

  const colors = ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#9C27B0', '#009688'];
  const note = initialData;
  
  // Predefined tag options
  const tagOptions = [
    { id: 'work', label: t('tag_work') },
    { id: 'personal', label: t('tag_personal') },
    { id: 'important', label: t('tag_important') },
    { id: 'urgent', label: t('tag_urgent') },
  ];

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

  const MAX_TITLE_LENGTH = 100;
  const MAX_CONTENT_LENGTH = 300;
  
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      if (initialData.reminderTime) {
        setReminderDate(new Date(initialData.reminderTime));
      }
      setSelectedDays(initialData.weekDays || [1, 2, 3, 4, 5]);
      setSelectedColor(initialData.color || '#4285F4');
      setSelectedTags(initialData.tags || []);
    } else {
      handleConfirmReset();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setReminderDate(new Date());
    setSelectedDays([1, 2, 3, 4, 5]);
    setSelectedColor('#4285F4');
    setSelectedTags([]);
  };

  const handleConfirmReset = () => {
    Alert.alert(
      t('confirm_reset'),
      t('confirm_reset_message'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('reset'),
          onPress: resetForm,
          style: 'destructive'
        }
      ]
    );
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
    
    // Xác nhận trước khi lưu
    Alert.alert(
      t('confirm'),
      t('save_note_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('confirm'), 
          onPress: () => {
            // Thực hiện lưu ghi chú
            const noteData = {
              title: title.trim(),
              content: content.trim(),
              reminderTime: reminderDate.toISOString(),
              weekDays: selectedDays,
              color: selectedColor,
              tags: selectedTags
            };
            
            onSave(noteData);
            handleConfirmReset();
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
            handleConfirmReset();
            onClose();
          }}
        ]
      );
    } else {
      handleConfirmReset();
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
              style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {initialData ? t('edit_note') : t('add_note')}
                </Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.form}>
                {/* Title Input */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{t('title')}</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5', 
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={t('title_placeholder')}
                    placeholderTextColor={theme.isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#ccc'}
                    maxLength={MAX_TITLE_LENGTH}
                  />
                  <Text style={[styles.charCounter, { color: theme.colors.text }]}>{title.length}/{MAX_TITLE_LENGTH}</Text>
                </View>
                
                {/* Content Input */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{t('content')}</Text>
                  <TextInput
                    style={[styles.input, styles.contentInput, { 
                      backgroundColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5', 
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }]}
                    value={content}
                    onChangeText={setContent}
                    placeholder={t('content_placeholder')}
                    placeholderTextColor={theme.isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#ccc'}
                    multiline={true}
                    maxLength={MAX_CONTENT_LENGTH}
                  />
                  <Text style={[styles.charCounter, { color: theme.colors.text }]}>{content.length}/{MAX_CONTENT_LENGTH}</Text>
                </View>
                
                {/* Date and Time Pickers */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{t('reminder_time')}</Text>
                  <View style={styles.dateTimeContainer}>
                    <TouchableOpacity
                      style={[styles.dateTimeButton, { 
                        backgroundColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5', 
                        borderColor: theme.colors.border
                      }]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={18} color={theme.colors.text} />
                      <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
                        {format(reminderDate, 'dd/MM/yyyy')}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.dateTimeButton, { 
                        backgroundColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5', 
                        borderColor: theme.colors.border
                      }]}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Ionicons name="time-outline" size={18} color={theme.colors.text} />
                      <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
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
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{t('show_on_days')}</Text>
                  <View style={styles.daysContainer}>
                    {weekDays.map(day => (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          styles.dayButton,
                          { 
                            backgroundColor: selectedDays.includes(day.id) ? theme.colors.primary : 'rgba(255, 255, 255, 0.1)',
                            borderColor: selectedDays.includes(day.id) ? theme.colors.primary : theme.colors.border
                          }
                        ]}
                        onPress={() => toggleDaySelection(day.id)}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            { color: selectedDays.includes(day.id) ? '#fff' : theme.colors.text }
                          ]}
                        >
                          {day.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Color selection */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{t('color')}</Text>
                  <View style={styles.colorsContainer}>
                    {colors.map(color => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorButton,
                          { 
                            backgroundColor: color,
                            borderColor: selectedColor === color ? theme.colors.primary : theme.colors.border
                          }
                        ]}
                        onPress={() => setSelectedColor(color)}
                      />
                    ))}
                  </View>
                </View>
                
                {/* Tag selection */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{t('tags')}</Text>
                  <View style={styles.tagsContainer}>
                    {tagOptions.map(tag => (
                      <TouchableOpacity
                        key={tag.id}
                        style={[
                          styles.tagButton,
                          { 
                            backgroundColor: selectedTags.includes(tag.id) ? theme.colors.primary : 'rgba(255, 255, 255, 0.1)',
                            borderColor: selectedTags.includes(tag.id) ? theme.colors.primary : theme.colors.border
                          }
                        ]}
                        onPress={() => {
                          if (selectedTags.includes(tag.id)) {
                            setSelectedTags(selectedTags.filter(id => id !== tag.id));
                          } else {
                            setSelectedTags([...selectedTags, tag.id]);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.tagButtonText,
                            { color: selectedTags.includes(tag.id) ? '#fff' : theme.colors.text }
                          ]}
                        >
                          {tag.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
              
              {/* Save Button */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.resetButton, { borderColor: theme.colors.border }]}
                  onPress={handleConfirmReset}
                >
                  <Ionicons name="refresh-outline" size={20} color={theme.colors.text} />
                  <Text style={[styles.resetButtonText, { color: theme.colors.text }]}>{t('reset')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSave}
                >
                  <Ionicons name="save-outline" size={20} color="#fff" />
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
    backgroundColor: theme => theme.colors.surface,
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
    borderBottomColor: theme => theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme => theme.colors.text,
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
    color: theme => theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme => theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme => theme.colors.text,
    borderWidth: 1,
    borderColor: theme => theme.colors.border,
  },
  contentInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: theme => theme.colors.text,
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
    backgroundColor: theme => theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme => theme.colors.border,
    flex: 0.48,
  },
  dateTimeText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme => theme.colors.text,
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
    backgroundColor: theme => theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme => theme.colors.border,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme => theme.colors.text,
  },
  colorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme => theme.colors.border,
  },
  tagsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  tagButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme => theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme => theme.colors.border,
  },
  tagButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme => theme.colors.text,
  },
  buttonContainer: {
    padding: 16,
    paddingTop: 0,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme => theme.colors.border,
    marginBottom: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: theme => theme.colors.primary,
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
