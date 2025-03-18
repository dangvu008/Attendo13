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
  const [titleError, setTitleError] = useState('');
  const [contentError, setContentError] = useState('');

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
      resetForm();
    }
    // Clear validation errors when opening modal
    setTitleError('');
    setContentError('');
  }, [initialData, visible]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setReminderDate(new Date());
    setSelectedDays([1, 2, 3, 4, 5]);
    setSelectedColor('#4285F4');
    setSelectedTags([]);
    setTitleError('');
    setContentError('');
  };

  const handleConfirmReset = () => {
    // Skip confirmation if form is empty
    if (!title.trim() && !content.trim() && selectedTags.length === 0) {
      resetForm();
      return;
    }
    
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

  const validateNote = () => {
    let isValid = true;
    
    // Validate title
    if (!title.trim()) {
      setTitleError(t('note_title_required'));
      isValid = false;
    } else if (title.trim().length > MAX_TITLE_LENGTH) {
      setTitleError(t('note_title_too_long', { max: MAX_TITLE_LENGTH }));
      isValid = false;
    } else {
      setTitleError('');
    }
    
    // Validate content
    if (!content.trim()) {
      setContentError(t('note_content_required'));
      isValid = false;
    } else if (content.trim().length > MAX_CONTENT_LENGTH) {
      setContentError(t('note_content_too_long', { max: MAX_CONTENT_LENGTH }));
      isValid = false;
    } else {
      setContentError('');
    }
    
    return isValid;
  };

  const handleSave = () => {
    // Validate form
    if (!validateNote()) {
      return;
    }
    
    // Prepare note data
    const noteData = {
      title: title.trim(),
      content: content.trim(),
      reminderTime: reminderDate.toISOString(),
      weekDays: selectedDays,
      color: selectedColor,
      tags: selectedTags
    };
    
    // Show confirmation dialog
    Alert.alert(
      t('confirm'),
      t('save_note_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('confirm'), 
          onPress: () => {
            onSave(noteData);
          }
        }
      ]
    );
  };

  const handleClose = () => {
    if (title.trim() || content.trim() || selectedTags.length > 0) {
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

              <ScrollView style={styles.modalBody}>
                {/* Title Input */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    {t('note_title')} <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: theme.colors.text, borderColor: titleError ? theme.colors.error : theme.colors.border }
                    ]}
                    placeholder={t('note_title_placeholder')}
                    placeholderTextColor={theme.colors.textSecondary}
                    value={title}
                    onChangeText={(text) => {
                      setTitle(text);
                      if (text.trim()) {
                        setTitleError('');
                      }
                    }}
                    maxLength={MAX_TITLE_LENGTH}
                  />
                  {titleError ? (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {titleError}
                    </Text>
                  ) : null}
                  <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
                    {title.length}/{MAX_TITLE_LENGTH}
                  </Text>
                </View>

                {/* Content Input */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    {t('note_content')} <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      { color: theme.colors.text, borderColor: contentError ? theme.colors.error : theme.colors.border }
                    ]}
                    placeholder={t('note_content_placeholder')}
                    placeholderTextColor={theme.colors.textSecondary}
                    value={content}
                    onChangeText={(text) => {
                      setContent(text);
                      if (text.trim()) {
                        setContentError('');
                      }
                    }}
                    multiline={true}
                    maxLength={MAX_CONTENT_LENGTH}
                  />
                  {contentError ? (
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>
                      {contentError}
                    </Text>
                  ) : null}
                  <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
                    {content.length}/{MAX_CONTENT_LENGTH}
                  </Text>
                </View>

                {/* Reminder Time */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    {t('reminder_time')}
                  </Text>
                  <View style={styles.dateTimeContainer}>
                    <TouchableOpacity 
                      style={[styles.dateTimeButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                      <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
                        {format(reminderDate, 'dd/MM/yyyy')}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.dateTimeButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
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
                    />
                  )}
                  
                  {showTimePicker && (
                    <DateTimePicker 
                      value={reminderDate}
                      mode="time"
                      display="default"
                      onChange={handleTimeChange}
                    />
                  )}
                </View>

                {/* Week Days Selection */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    {t('applied_days')}
                  </Text>
                  <View style={styles.daysContainer}>
                    {weekDays.map(day => (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          styles.dayButton,
                          selectedDays.includes(day.id) 
                            ? { backgroundColor: theme.colors.primary } 
                            : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
                        ]}
                        onPress={() => toggleDaySelection(day.id)}
                      >
                        <Text 
                          style={[
                            styles.dayText, 
                            { color: selectedDays.includes(day.id) ? '#fff' : theme.colors.text }
                          ]}
                        >
                          {day.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Color Selection */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    {t('note_color')}
                  </Text>
                  <View style={styles.colorsContainer}>
                    {colors.map(color => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorButton,
                          { backgroundColor: color },
                          selectedColor === color && styles.selectedColorButton
                        ]}
                        onPress={() => setSelectedColor(color)}
                      />
                    ))}
                  </View>
                </View>

                {/* Tags Selection */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                    {t('note_tags')}
                  </Text>
                  <View style={styles.tagsContainer}>
                    {tagOptions.map(tag => (
                      <TouchableOpacity
                        key={tag.id}
                        style={[
                          styles.tagButton,
                          selectedTags.includes(tag.id) 
                            ? { backgroundColor: theme.colors.primary } 
                            : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
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
                            styles.tagText, 
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

              <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
                <TouchableOpacity
                  style={[styles.resetButton, { backgroundColor: theme.colors.error }]}
                  onPress={handleConfirmReset}
                >
                  <Text style={styles.buttonText}>{t('reset')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSave}
                >
                  <Text style={styles.buttonText}>{t('save')}</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 4,
    fontSize: 16,
    fontWeight: '500',
  },
  requiredStar: {
    color: 'red',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingTop: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    flex: 0.48,
  },
  dateTimeText: {
    marginLeft: 8,
    fontSize: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  dayText: {
    fontSize: 14,
  },
  colorsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 4,
  },
  selectedColorButton: {
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tagButton: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  tagText: {
    fontSize: 14,
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 5,
    flex: 0.48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 5,
    flex: 0.48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AddNoteModal;
