import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';
import { useLocalization } from '../context/LocalizationContext';

const TimePicker = ({
  value,
  onChange,
  placeholder = 'HH:MM',
  theme,
  label,
  style
}) => {
  const { t } = useLocalization();
  const [showPicker, setShowPicker] = useState(false);
  const [tempTime, setTempTime] = useState(null);

  // Chuyển đổi chuỗi thời gian thành đối tượng Date
  const getTimeAsDate = () => {
    if (!value) return new Date();
    try {
      // Chuyển đổi chuỗi HH:MM thành đối tượng Date
      return parse(value, 'HH:mm', new Date());
    } catch (error) {
      console.error('Lỗi khi chuyển đổi thời gian:', error);
      return new Date();
    }
  };

  const handleOpenPicker = () => {
    setTempTime(getTimeAsDate());
    setShowPicker(true);
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedTime) {
      setTempTime(selectedTime);
      
      if (Platform.OS === 'android') {
        // Trên Android, áp dụng thay đổi ngay lập tức
        const formattedTime = format(selectedTime, 'HH:mm');
        onChange(formattedTime);
      }
    }
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  const handleConfirm = () => {
    if (tempTime) {
      const formattedTime = format(tempTime, 'HH:mm');
      onChange(formattedTime);
    }
    setShowPicker(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme.isDarkMode
              ? 'rgba(255, 255, 255, 0.1)'
              : '#f5f5f5',
            borderColor: theme.colors.border,
          },
        ]}
        onPress={handleOpenPicker}
      >
        <Ionicons
          name="time-outline"
          size={18}
          color={theme.colors.primary}
        />
        <Text style={[styles.buttonText, { color: theme.colors.text }]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        // Modal cho iOS
        <Modal
          transparent={true}
          visible={showPicker}
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <TouchableWithoutFeedback onPress={handleCancel}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.modalContent,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={handleCancel}>
                      <Text style={{ color: theme.colors.text }}>
                        {t('cancel')}
                      </Text>
                    </TouchableOpacity>
                    <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                      {t('select_time')}
                    </Text>
                    <TouchableOpacity onPress={handleConfirm}>
                      <Text style={{ color: theme.colors.primary }}>
                        {t('confirm')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempTime || getTimeAsDate()}
                    mode="time"
                    display="spinner"
                    onChange={handleTimeChange}
                    style={styles.picker}
                    textColor={theme.colors.text}
                    is24Hour={true}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      ) : (
        // DateTimePicker cho Android
        showPicker && (
          <DateTimePicker
            value={tempTime || getTimeAsDate()}
            mode="time"
            display="default"
            onChange={handleTimeChange}
            is24Hour={true}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
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
    fontWeight: '500',
  },
  picker: {
    height: 200,
  },
});

export default TimePicker;