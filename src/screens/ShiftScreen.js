import React, { useState, useEffect } from "react";
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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useShift } from "../context/ShiftContext";
import { useTheme } from "../context/ThemeContext";
import { useLocalization } from "../context/LocalizationContext";
import TimePicker from "../components/TimePicker";

const ShiftScreen = () => {
  const {
    shifts,
    addShift,
    updateShift,
    deleteShift,
    applyShift,
    validateShiftData,
    isDuplicateShift,
  } = useShift();
  const { theme } = useTheme();
  const { t } = useLocalization();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [newShift, setNewShift] = useState({
    name: "",
    startWorkTime: "",
    endWorkTime: "",
    departureTime: "",
    remindBeforeWork: 15,
    remindAfterWork: 15,
    showSignButton: true,
    appliedDays: [1, 2, 3, 4, 5], // Mặc định áp dụng từ thứ 2 đến thứ 6
    active: true,
  });

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerFor, setTimePickerFor] = useState("");
  const [displayReminderOptions, setDisplayReminderOptions] = useState(false);
  const [reminderType, setReminderType] = useState("");
  const reminderOptions = [5, 10, 15, 30, 45, 60];
  const [nameCharCount, setNameCharCount] = useState(0);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    const validateName = (name) => {
      setNameError("");
      setNameCharCount(name.length);

      // Kiểm tra ký tự đặc biệt
      const specialCharsRegex = /[^\p{L}\p{N}\s.,\-_()]/u;
      if (specialCharsRegex.test(name)) {
        setNameError(t("shift_name_special_chars"));
        return false;
      }

      // Kiểm tra độ dài tên
      if (name.length > 200) {
        setNameError(t("shift_name_max_length"));
        return false;
      }

      // Kiểm tra trùng lặp nếu không phải đang chỉnh sửa
      if (
        !editingShift &&
        shifts.some((shift) => shift.name.toLowerCase() === name.toLowerCase())
      ) {
        setNameError(t("shift_name_duplicate"));
        return false;
      }

      if (
        editingShift &&
        name.toLowerCase() !== editingShift.name.toLowerCase() &&
        shifts.some((shift) => shift.name.toLowerCase() === name.toLowerCase())
      ) {
        setNameError(t("shift_name_duplicate"));
        return false;
      }

      return true;
    };

    if (newShift.name) {
      validateName(newShift.name);
    } else {
      setNameError("");
      setNameCharCount(0);
    }
  }, [newShift.name, shifts, editingShift, t]);

  const toggleAppliedDay = (day) => {
    let updatedDays = [...newShift.appliedDays];

    if (updatedDays.includes(day)) {
      updatedDays = updatedDays.filter((d) => d !== day);
    } else {
      updatedDays.push(day);
      updatedDays.sort();
    }

    setNewShift({ ...newShift, appliedDays: updatedDays });
  };

  const handleAddShift = () => {
    setEditingShift(null);
    setNewShift({
      name: "",
      startWorkTime: "",
      endWorkTime: "",
      departureTime: "",
      remindBeforeWork: 15,
      remindAfterWork: 15,
      showSignButton: true,
      appliedDays: [1, 2, 3, 4, 5],
      active: true,
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
      active: shift.active,
    });
    setModalVisible(true);
  };

  const handleDeleteShift = (shiftId) => {
    Alert.alert(t("confirm"), t("delete_shift_confirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          const success = await deleteShift(shiftId);
          if (!success) {
            Alert.alert(t("error"), t("save_shift_error"));
          }
        },
      },
    ]);
  };

  const handleSaveShift = async () => {
    // Basic validations
    if (!newShift.name.trim()) {
      Alert.alert(t("error"), t("shift_name_required"));
      return;
    }

    if (!newShift.startWorkTime || !newShift.endWorkTime) {
      Alert.alert(t("error"), t("shift_times_required"));
      return;
    }

    // Validate time format and convert to 24h
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (
      !timeRegex.test(newShift.startWorkTime) ||
      !timeRegex.test(newShift.endWorkTime) ||
      (newShift.departureTime && !timeRegex.test(newShift.departureTime))
    ) {
      Alert.alert(t("error"), t("invalid_time_format"));
      return;
    }

    if (nameError) {
      Alert.alert(t("error"), nameError);
      return;
    }

    // Check for overlapping shifts
    const overlapCheck = validateShiftOverlap(newShift, shifts);
    if (overlapCheck.overlaps) {
      Alert.alert(
        t("error"),
        t("shift_overlap_error", { shiftName: overlapCheck.shiftName })
      );
      return;
    }

    // Validate reminder times
    if (newShift.remindBeforeWork < 0 || newShift.remindAfterWork < 0) {
      Alert.alert(t("error"), t("invalid_reminder_time"));
      return;
    }

    if (!newShift.name.trim()) {
      Alert.alert(t("error"), t("shift_name_required"));
      return;
    }

    if (!newShift.startWorkTime || !newShift.endWorkTime) {
      Alert.alert(t("error"), t("shift_times_required"));
      return;
    }

    if (isDuplicateShift(newShift)) {
      Alert.alert(t("error"), t("shift_duplicate"));
      return;
    }

    Alert.alert(t("confirm"), t("save_shift_confirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("confirm"),
        onPress: async () => {
          let success = false;
          if (editingShift) {
            success = await updateShift({
              ...editingShift,
              ...newShift,
            });
          } else {
            success = await addShift({
              ...newShift,
            });
          }

          if (success) {
            setModalVisible(false);
          } else {
            Alert.alert(t("error"), t("save_shift_error"));
          }
        },
      },
    ]);
  };

  const handleApplyShift = async (shift) => {
    try {
      const success = await applyShift(shift.id);

      if (success) {
        Alert.alert(t("success"), t("shift_applied"));
      } else {
        Alert.alert(t("error"), t("shift_apply_error"));
      }
    } catch (error) {
      console.error("Error applying shift:", error);
      Alert.alert(t("error"), t("shift_apply_error"));
    }
  };

  const handleOpenTimePicker = (field) => {
    setTimePickerFor(field);
    setShowTimePicker(true);
  };

  const handleTimeChange = (time) => {
    let formattedTime = time;
    if (time && time.length) {
      // Remove any non-numeric and non-colon characters
      formattedTime = time.replace(/[^0-9:]/g, "");

      // Add colon if not present
      if (!formattedTime.includes(":")) {
        if (formattedTime.length <= 2) {
          formattedTime = formattedTime.padStart(2, "0") + ":00";
        } else {
          formattedTime =
            formattedTime.substring(0, 2) +
            ":" +
            formattedTime.substring(2, 4).padEnd(2, "0");
        }
      }

      // Validate hours and minutes
      const [hours, minutes] = formattedTime.split(":");
      formattedTime = hours.padStart(2, "0") + ":" + minutes.padEnd(2, "0");

      // Ensure hours and minutes are within valid ranges
      if (parseInt(hours) > 23) formattedTime = "23:" + minutes;
      if (parseInt(minutes) > 59) formattedTime = hours + ":59";
    }

    setNewShift({ ...newShift, [timePickerFor]: formattedTime });
    setShowTimePicker(false);
  };

  const handleOpenReminderOptions = (type) => {
    setReminderType(type);
    setDisplayReminderOptions(true);
  };

  const handleSelectReminder = (minutes) => {
    if (reminderType === "before") {
      setNewShift({ ...newShift, remindBeforeWork: minutes });
    } else {
      setNewShift({ ...newShift, remindAfterWork: minutes });
    }
    setDisplayReminderOptions(false);
  };

  const handleResetShiftForm = () => {
    Alert.alert(t("confirm_reset"), t("confirm_reset_form_message"), [
      {
        text: t("cancel"),
        style: "cancel",
      },
      {
        text: t("reset"),
        onPress: () => {
          setNewShift({
            name: "",
            startWorkTime: "",
            endWorkTime: "",
            departureTime: "",
            remindBeforeWork: 15,
            remindAfterWork: 15,
            showSignButton: true,
            appliedDays: [1, 2, 3, 4, 5], // Monday to Friday by default
          });
          setNameError("");
        },
        style: "destructive",
      },
    ]);
  };

  const renderShiftItem = ({ item }) => {
    const isCurrentShift = item.active;

    return (
      <View
        style={[
          styles.shiftItem,
          {
            backgroundColor: isCurrentShift
              ? theme.colors.primaryLight
              : theme.colors.surface,
            borderLeftWidth: isCurrentShift ? 4 : 0,
            borderLeftColor: isCurrentShift
              ? theme.colors.primary
              : "transparent",
            shadowColor: isCurrentShift ? theme.colors.primary : "#000",
            shadowOffset: { width: 0, height: isCurrentShift ? 4 : 2 },
            shadowOpacity: isCurrentShift ? 0.4 : 0.1,
            shadowRadius: isCurrentShift ? 8 : 3,
            elevation: isCurrentShift ? 10 : 3,
          },
        ]}
      >
        <View style={styles.shiftHeader}>
          <Text
            style={[
              styles.shiftName,
              {
                color: isCurrentShift
                  ? theme.colors.primary
                  : theme.colors.text,
                fontWeight: isCurrentShift ? "bold" : "normal",
                fontSize: isCurrentShift ? 18 : 16,
              },
            ]}
          >
            {item.name}
          </Text>
          {isCurrentShift && (
            <View
              style={[
                styles.currentBadge,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.currentBadgeText}>{t("current")}</Text>
            </View>
          )}
        </View>

        <View style={styles.shiftTimes}>
          <View style={styles.timeItem}>
            <Ionicons
              name="time-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.timeLabel, { color: theme.colors.textSecondary }]}
            >
              {t("shift_start_time")}:
            </Text>
            <Text style={[styles.timeValue, { color: theme.colors.text }]}>
              {item.startWorkTime || "--:--"}
            </Text>
          </View>

          <View style={styles.timeItem}>
            <Ionicons
              name="time-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.timeLabel, { color: theme.colors.textSecondary }]}
            >
              {t("shift_end_time")}:
            </Text>
            <Text style={[styles.timeValue, { color: theme.colors.text }]}>
              {item.endWorkTime || "--:--"}
            </Text>
          </View>

          {item.departureTime && (
            <View style={styles.timeItem}>
              <Ionicons
                name="walk-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.timeLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {t("departure_time")}:
              </Text>
              <Text style={[styles.timeValue, { color: theme.colors.text }]}>
                {item.departureTime || "--:--"}
              </Text>
            </View>
          )}
        </View>

        {isCurrentShift && (
          <Text
            style={[styles.appliedWeekText, { color: theme.colors.success }]}
          >
            {t("currently_applied")}
          </Text>
        )}

        <View style={styles.shiftActions}>
          {!isCurrentShift && (
            <TouchableOpacity
              style={[
                styles.applyButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => handleApplyShift(item)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.primary }]}
            onPress={() => handleEditShift(item)}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.error }]}
            onPress={() => handleDeleteShift(item.id)}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={theme.colors.error}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.headerTitle}>{t("shifts_title")}</Text>
      </View>

      <FlatList
        data={shifts}
        renderItem={renderShiftItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.shiftsList}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={theme.colors.disabled}
            />
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              {t("no_shifts")}
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
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingShift ? t("edit_shift") : t("add_shift")}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              {/* Shift Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  {t("shift_name")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      backgroundColor: theme.isDarkMode
                        ? "rgba(255, 255, 255, 0.1)"
                        : "#f5f5f5",
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder={t("shift_name_placeholder")}
                  placeholderTextColor={theme.colors.placeholder}
                  value={newShift.name}
                  onChangeText={(text) =>
                    setNewShift({ ...newShift, name: text })
                  }
                />
                {nameError && <Text style={styles.errorText}>{nameError}</Text>}
              </View>

              {/* Work Time */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  {t("work_time")}
                </Text>
                <View style={styles.timeContainer}>
                  <TimePicker
                    value={newShift.startWorkTime}
                    onChange={(time) =>
                      setNewShift({ ...newShift, startWorkTime: time })
                    }
                    placeholder={t("select_time")}
                    theme={theme}
                    label={t("shift_start_time")}
                    style={styles.timePicker}
                  />
                  <Text
                    style={[styles.timeSeparator, { color: theme.colors.text }]}
                  >
                    -
                  </Text>
                  <TimePicker
                    value={newShift.endWorkTime}
                    onChange={(time) =>
                      setNewShift({ ...newShift, endWorkTime: time })
                    }
                    placeholder={t("select_time")}
                    theme={theme}
                    label={t("shift_end_time")}
                    style={styles.timePicker}
                  />
                </View>
              </View>

              {/* Departure Time */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  {t("departure_time")}
                </Text>
                <TimePicker
                  value={newShift.departureTime}
                  onChange={(time) =>
                    setNewShift({ ...newShift, departureTime: time })
                  }
                  placeholder={t("select_time")}
                  theme={theme}
                  label={t("departure_time")}
                  style={styles.timePicker}
                />
              </View>

              {/* Week Days Selection */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  {t("apply_to_days")}
                </Text>
                <View style={styles.daysContainer}>
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        {
                          backgroundColor: newShift.appliedDays?.includes(day)
                            ? theme.colors.primary
                            : theme.isDarkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "#f5f5f5",
                          borderColor: newShift.appliedDays?.includes(day)
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                      onPress={() => toggleAppliedDay(day)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          {
                            color: newShift.appliedDays?.includes(day)
                              ? "#fff"
                              : theme.colors.text,
                          },
                        ]}
                      >
                        {t(`day_${day}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Reminder Options */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  {t("reminder_options")}
                </Text>

                <View style={styles.reminderOption}>
                  <Text
                    style={[styles.reminderText, { color: theme.colors.text }]}
                  >
                    {t("remind_before_work")}
                  </Text>
                  <View style={styles.reminderValue}>
                    <TextInput
                      style={[
                        styles.reminderInput,
                        {
                          color: theme.colors.text,
                          backgroundColor: theme.isDarkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "#f5f5f5",
                          borderColor: theme.colors.border,
                        },
                      ]}
                      keyboardType="number-pad"
                      value={String(newShift.remindBeforeWork || "15")}
                      onChangeText={(text) =>
                        setNewShift({
                          ...newShift,
                          remindBeforeWork: text ? parseInt(text) : 15,
                        })
                      }
                    />
                    <Text
                      style={[
                        styles.reminderUnit,
                        { color: theme.colors.text },
                      ]}
                    >
                      {t("minutes")}
                    </Text>
                  </View>
                </View>

                <View style={styles.reminderOption}>
                  <Text
                    style={[styles.reminderText, { color: theme.colors.text }]}
                  >
                    {t("remind_after_work")}
                  </Text>
                  <View style={styles.reminderValue}>
                    <TextInput
                      style={[
                        styles.reminderInput,
                        {
                          color: theme.colors.text,
                          backgroundColor: theme.isDarkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "#f5f5f5",
                          borderColor: theme.colors.border,
                        },
                      ]}
                      keyboardType="number-pad"
                      value={String(newShift.remindAfterWork || "15")}
                      onChangeText={(text) =>
                        setNewShift({
                          ...newShift,
                          remindAfterWork: text ? parseInt(text) : 15,
                        })
                      }
                    />
                    <Text
                      style={[
                        styles.reminderUnit,
                        { color: theme.colors.text },
                      ]}
                    >
                      {t("minutes")}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Show Sign Button Option */}
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text
                    style={[styles.switchLabel, { color: theme.colors.text }]}
                  >
                    {t("show_sign_button")}
                  </Text>
                  <Switch
                    value={newShift.showSignButton}
                    onValueChange={(value) =>
                      setNewShift({ ...newShift, showSignButton: value })
                    }
                    trackColor={{
                      false: theme.colors.disabled,
                      true: theme.colors.primary,
                    }}
                    thumbColor={
                      newShift.showSignButton
                        ? theme.colors.primaryLight
                        : "#f4f3f4"
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.switchHint,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {t("sign_button_hint")}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.resetButton,
                  {
                    backgroundColor: theme.isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "#f5f5f5",
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={handleResetShiftForm}
              >
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={theme.colors.text}
                />
                <Text
                  style={[styles.resetButtonText, { color: theme.colors.text }]}
                >
                  {t("reset")}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.footerButton,
                  styles.cancelButton,
                  { borderColor: theme.colors.border },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: theme.colors.text },
                  ]}
                >
                  {t("cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.footerButton,
                  styles.saveButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleSaveShift}
              >
                <Text style={styles.saveButtonText}>{t("save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={displayReminderOptions}
        animationType="slide"
        onRequestClose={() => setDisplayReminderOptions(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setDisplayReminderOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: theme.colors.surface, maxHeight: "40%" },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text
                    style={[styles.modalTitle, { color: theme.colors.text }]}
                  >
                    {t("select_reminder")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setDisplayReminderOptions(false)}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.reminderOptionsContainer}>
                  {reminderOptions.map((minutes, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.reminderOption,
                        { backgroundColor: theme.colors.surface },
                      ]}
                      onPress={() => handleSelectReminder(minutes)}
                    >
                      <Text
                        style={[
                          styles.reminderOptionText,
                          { color: theme.colors.text },
                        ]}
                      >
                        {minutes} {t("minutes")}
                      </Text>
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
  timePicker: {
    flex: 1,
    marginHorizontal: 4,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  shiftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  shiftName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  shiftTimes: {
    marginBottom: 12,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  shiftActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    borderWidth: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  modalContainer: {
    margin: 20,
    borderRadius: 8,
    overflow: "hidden",
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
    fontWeight: "bold",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeSeparator: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  departureTimePicker: {
    width: "100%",
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayButton: {
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  dayText: {
    fontSize: 14,
  },
  reminderOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 16,
  },
  reminderValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  reminderInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 16,
    width: 80,
  },
  reminderUnit: {
    fontSize: 16,
    marginLeft: 8,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 16,
  },
  switchHint: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  formContainer: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  footerButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    borderColor: "#ccc",
  },
  saveButton: {
    backgroundColor: "#6200ee",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  resetButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  resetButtonText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#ff0000",
  },
  appliedWeekText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  reminderOptionsContainer: {
    padding: 16,
  },
  reminderOptionText: {
    fontSize: 16,
  },
});

export default ShiftScreen;
