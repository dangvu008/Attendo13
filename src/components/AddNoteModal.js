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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

const AddNoteModal = ({ visible, onClose, onSave, initialData }) => {
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
      alert('Vui lòng nhập tiêu đề');
      return;
    }
    
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung');
      return;
    }
    
    const noteData = {
      title: title.trim(),
      content: content.trim(),
      reminderTime: reminderDate.toISOString(),
      weekDays: selectedDays
    };
    
    onSave(noteData);
    resetForm();
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {initialData ? 'Cập nhật ghi chú' : 'Thêm ghi chú mới'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.form}>
                {/* Title Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tiêu đề</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Nhập tiêu đề (tối đa 100 ký tự)"
                    maxLength={MAX_TITLE_LENGTH}
                  />
                  <Text style={styles.charCounter}>{title.length}/{MAX_TITLE_LENGTH}</Text>
                </View>
                
                {/* Content Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nội dung</Text>
                  <TextInput
                    style={[styles.input, styles.contentInput]}
                    value={content}
                    onChangeText={setContent}
                    placeholder="Nhập nội dung (tối đa 300 ký tự)"
                    multiline={true}
                    maxLength={MAX_CONTENT_LENGTH}
                  />
                  <Text style={styles.charCounter}>{content.length}/{MAX_CONTENT_LENGTH}</Text>
                </View>
                
                {/* Date and Time Pickers */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Thời gian nhắc nhở</Text>
                  <View style={styles.dateTimeContainer}>
                    <TouchableOpacity
                      style={styles.dateTimeButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={18} color="#6200ee" />
                      <Text style={styles.dateTimeText}>
                        {format(reminderDate, 'dd/MM/yyyy')}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.dateTimeButton}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Ionicons name="time-outline" size={18} color="#6200ee" />
                      <Text style={styles.dateTimeText}>
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
                
                {/* Week days selection */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Hiển thị vào các ngày</Text>
                  <View style={styles.daysContainer}>
                    {weekDays.map(day => (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          styles.dayButton,
                          selectedDays.includes(day.id) && styles.selectedDayButton
                        ]}
                        onPress={() => toggleDaySelection(day.id)}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            selectedDays.includes(day.id) && styles.selectedDayText
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
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Lưu</Text>
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
