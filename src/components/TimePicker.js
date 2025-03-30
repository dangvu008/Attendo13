import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, parse } from "date-fns";
import { useLocalization } from "../context/LocalizationContext";

const TimePicker = ({
  value,
  onChange,
  placeholder = "HH:MM",
  theme,
  label,
  style,
}) => {
  const { t } = useLocalization();
  const [showPicker, setShowPicker] = useState(false);
  const [tempTime, setTempTime] = useState(null);

  // Tạo đối tượng Date từ chuỗi thời gian
  const getTimeAsDate = () => {
    if (!value) return new Date();

    try {
      return parse(value, "HH:mm", new Date());
    } catch (error) {
      console.error("Lỗi phân tích thời gian:", error);
      return new Date();
    }
  };

  // Xử lý khi thời gian thay đổi
  const handleTimeChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === "ios");

    if (event.type === "dismissed") {
      return;
    }

    if (selectedDate) {
      const timeString = format(selectedDate, "HH:mm");
      onChange(timeString);
    }
  };

  // Hiển thị DateTimePicker
  const showTimepicker = () => {
    setShowPicker(true);
  };

  const handleOpenPicker = () => {
    setTempTime(getTimeAsDate());
    setShowPicker(true);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  const handleConfirm = () => {
    if (tempTime) {
      const formattedTime = format(tempTime, "HH:mm");
      onChange(formattedTime);
    }
    setShowPicker(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: theme?.colors.text || "#333" }]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.pickerButton,
          {
            backgroundColor: theme?.isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "#f5f5f5",
            borderColor: theme?.colors.border || "#ddd",
          },
        ]}
        onPress={showTimepicker}
      >
        <Ionicons
          name="time-outline"
          size={20}
          color={theme?.colors.primary || "#5A35F0"}
        />
        <Text
          style={[
            styles.valueText,
            !value && styles.placeholderText,
            {
              color: value
                ? theme?.colors.text || "#333"
                : theme?.colors.placeholder || "#999",
            },
          ]}
        >
          {value || placeholder || "Chọn giờ"}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={getTimeAsDate()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  valueText: {
    fontSize: 16,
  },
  placeholderText: {
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  picker: {
    height: 200,
  },
});

export default TimePicker;
