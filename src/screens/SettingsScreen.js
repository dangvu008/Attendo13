import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { useShift } from '../context/ShiftContext';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as NotificationService from '../services/NotificationService';

const SettingsScreen = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { locale, changeLocale, t } = useLocalization();
  const { shifts, currentShift, setCurrentShift, addShift, updateShift, deleteShift } = useShift();
  const navigation = useNavigation();
  
  const [notificationSound, setNotificationSound] = useState(true);
  const [notificationVibration, setNotificationVibration] = useState(true);
  const [reminderType, setReminderType] = useState('none');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Load notification settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoadingSettings(true);
        
        // Initialize notifications
        await NotificationService.initializeNotifications();
        
        // Load saved settings
        const settings = await NotificationService.loadNotificationSettings();
        setNotificationSound(settings.sound);
        setNotificationVibration(settings.vibration);
        setReminderType(settings.reminderType);
        setNotificationsEnabled(settings.enabled);
      } catch (error) {
        console.error('Error loading notification settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    
    loadSettings();
  }, []);

  // Save settings when changed
  useEffect(() => {
    const saveSettings = async () => {
      if (isLoadingSettings) return;
      
      try {
        const settings = {
          enabled: notificationsEnabled,
          sound: notificationSound,
          vibration: notificationVibration,
          reminderType: reminderType,
        };
        
        await NotificationService.saveNotificationSettings(settings);
        
        // Schedule or cancel reminders based on settings
        if (notificationsEnabled && reminderType !== 'none' && currentShift) {
          await NotificationService.scheduleShiftReminders(
            currentShift,
            reminderType
          );
        } else if (!notificationsEnabled || reminderType === 'none') {
          await NotificationService.cancelAllShiftNotifications();
        }
      } catch (error) {
        console.error('Error saving notification settings:', error);
      }
    };
    
    saveSettings();
  }, [notificationsEnabled, notificationSound, notificationVibration, reminderType, currentShift, isLoadingSettings]);

  const handleToggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
  };

  const handleToggleSound = () => {
    setNotificationSound(prev => !prev);
  };

  const handleToggleVibration = () => {
    setNotificationVibration(prev => !prev);
  };

  const handleSelectShift = (shift) => {
    setCurrentShift(shift);
  };

  const handleDeleteShift = (shift) => {
    setSelectedShift(shift);
    setDeleteModalVisible(true);
  };

  const confirmDeleteShift = async () => {
    if (selectedShift) {
      const success = await deleteShift(selectedShift.id);
      if (success) {
        setDeleteModalVisible(false);
        setSelectedShift(null);
      } else {
        Alert.alert(t('error'), t('delete_shift_error'));
      }
    }
  };

  const handleEditShift = (shift) => {
    navigation.navigate('EditShift', { shift });
  };

  const handleAddShift = () => {
    navigation.navigate('AddShift');
  };

  const handleChangeLanguage = (newLocale) => {
    changeLocale(newLocale);
    setLanguageModalVisible(false);
  };
  
  const handleSelectReminderType = async (type) => {
    setReminderType(type);
    setReminderModalVisible(false);
    
    // Schedule or cancel reminders based on the new type
    if (type !== 'none' && notificationsEnabled && currentShift) {
      await NotificationService.scheduleShiftReminders(
        currentShift,
        type
      );
    } else if (type === 'none' && currentShift) {
      await NotificationService.cancelAllShiftNotifications(currentShift.id);
    }
  };

  const renderShiftItem = (shift) => {
    const isActive = currentShift && currentShift.id === shift.id;
    
    return (
      <View 
        key={shift.id} 
        style={[
          styles.shiftItem, 
          { 
            backgroundColor: theme.colors.surface,
            ...(isActive ? { borderLeftWidth: 4, borderLeftColor: theme.colors.primary } : {})
          }
        ]}
      >
        <View style={styles.shiftItemContent}>
          <Text style={[styles.shiftName, { color: theme.colors.text }]}>
            {shift.name}
          </Text>
          <Text style={[styles.shiftTime, { color: theme.colors.textSecondary }]}>
            {shift.startWorkTime} - {shift.endWorkTime}
          </Text>
          {isActive && (
            <View style={styles.activeShiftBadge}>
              <Text style={[styles.activeShiftText, { color: theme.colors.primary }]}>
                {t('currently_applied')}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.shiftActions}>
          <TouchableOpacity 
            style={[
              styles.shiftActionButton, 
              { 
                borderColor: isActive ? theme.colors.primary : theme.colors.border,
                backgroundColor: isActive ? theme.colors.primaryLight : 'transparent'
              }
            ]} 
            onPress={() => handleSelectShift(shift)}
          >
            <Ionicons 
              name="checkmark" 
              size={20} 
              color={isActive ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.shiftActionButton, { borderColor: theme.colors.border }]} 
            onPress={() => handleEditShift(shift)}
          >
            <Ionicons 
              name="create-outline" 
              size={20} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.shiftActionButton, 
              { backgroundColor: theme.colors.error, borderColor: theme.colors.error }
            ]} 
            onPress={() => handleDeleteShift(shift)}
          >
            <Ionicons 
              name="trash-outline" 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSettingItem = (icon, title, description, control) => {
    return (
      <View style={[
        styles.settingItem, 
        { 
          backgroundColor: theme.colors.surface,
          ...theme.elevation.small
        }
      ]}>
        <View style={styles.settingItemLeft}>
          <View style={[styles.settingIcon, { backgroundColor: theme.colors.primaryLight }]}>
            {icon}
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              {title}
            </Text>
            {description && (
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                {description}
              </Text>
            )}
          </View>
        </View>
        {control}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, ...theme.elevation.small }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('settings_title')}</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shift Reminder Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="notifications-none" size={22} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('shift_reminders')}
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
              {t('shift_reminder_description')}
            </Text>
          </View>
          
          {renderSettingItem(
            <MaterialIcons name="access-time" size={20} color={theme.colors.primary} />,
            t('reminder_type'),
            null,
            <TouchableOpacity 
              style={styles.settingControl}
              onPress={() => setReminderModalVisible(true)}
              disabled={!notificationsEnabled}
            >
              <Text style={[
                styles.settingValue, 
                { 
                  color: notificationsEnabled 
                    ? theme.colors.textSecondary 
                    : theme.colors.disabled 
                }
              ]}>
                {reminderType === 'none' ? t('no_reminder') : 
                 reminderType === 'before_5_min' ? t('before_5_min') :
                 reminderType === 'before_15_min' ? t('before_15_min') : 
                 t('before_30_min')}
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={notificationsEnabled ? theme.colors.textSecondary : theme.colors.disabled} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('notification_settings')}
              </Text>
            </View>
          </View>
          
          {renderSettingItem(
            <Ionicons name="notifications" size={20} color={theme.colors.primary} />,
            t('notifications_enabled'),
            t('notifications_enabled_description'),
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#767577', true: theme.colors.primaryLight }}
              thumbColor={notificationsEnabled ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          )}
          
          {renderSettingItem(
            <Ionicons name="volume-high-outline" size={20} color={theme.colors.primary} />,
            t('notification_sound'),
            t('notification_sound_description'),
            <Switch
              value={notificationSound}
              onValueChange={handleToggleSound}
              trackColor={{ false: '#767577', true: theme.colors.primaryLight }}
              thumbColor={notificationSound ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          )}
          
          {renderSettingItem(
            <MaterialCommunityIcons name="vibrate" size={20} color={theme.colors.primary} />,
            t('notification_vibration'),
            t('notification_vibration_description'),
            <Switch
              value={notificationVibration}
              onValueChange={handleToggleVibration}
              trackColor={{ false: '#767577', true: theme.colors.primaryLight }}
              thumbColor={notificationVibration ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          )}
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="settings-outline" size={22} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('general_settings')}
              </Text>
            </View>
          </View>
          
          {renderSettingItem(
            <Ionicons name="moon-outline" size={20} color={theme.colors.primary} />,
            t('dark_mode'),
            t('dark_mode_description'),
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: theme.colors.primaryLight }}
              thumbColor={isDarkMode ? theme.colors.primary : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          )}
          
          {renderSettingItem(
            <Ionicons name="language-outline" size={20} color={theme.colors.primary} />,
            t('language'),
            null,
            <TouchableOpacity 
              style={styles.settingControl}
              onPress={() => setLanguageModalVisible(true)}
            >
              <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
                {locale === 'vi' ? 'Tiếng Việt' : 'English'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
            {t('version')}: {Constants.expoConfig?.version || '1.0.0'}
          </Text>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLanguageModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('select_language')}</Text>
                <TouchableOpacity onPress={() => setLanguageModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                {['en', 'vi'].map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.languageOption,
                      locale === lang && { backgroundColor: theme.colors.primaryLight }
                    ]}
                    onPress={() => handleChangeLanguage(lang)}
                  >
                    <Text style={[styles.languageText, { color: theme.colors.text }]}>
                      {lang === 'en' ? 'English' : 'Tiếng Việt'}
                    </Text>
                    {locale === lang && (
                      <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Reminder Type Modal */}
      <Modal
        visible={reminderModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setReminderModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('select_reminder_type')}</Text>
                <TouchableOpacity onPress={() => setReminderModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                {['none', 'beforeDeparture', 'beforeWork', 'afterWork', 'all'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.reminderOption,
                      reminderType === type && { backgroundColor: theme.colors.primaryLight }
                    ]}
                    onPress={() => handleSelectReminderType(type)}
                  >
                    <Text style={[styles.reminderText, { color: theme.colors.text }]}>
                      {t(`reminder_type_${type}`)}
                    </Text>
                    {reminderType === type && (
                      <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete Shift Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDeleteModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.deleteModalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('confirm_delete')}</Text>
                <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.deleteModalBody}>
                <Text style={[styles.deleteText, { color: theme.colors.text }]}>
                  {t('delete_shift_confirm')}
                </Text>
                {selectedShift && (
                  <Text style={[styles.shiftName, { color: theme.colors.text, marginTop: 8 }]}>
                    {selectedShift.name}
                  </Text>
                )}
              </View>
              <View style={styles.deleteModalActions}>
                <TouchableOpacity 
                  style={[styles.deleteModalButton, styles.cancelButton, { borderColor: theme.colors.border }]} 
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.text }]}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.deleteModalButton, styles.deleteButton, { backgroundColor: theme.colors.error }]} 
                  onPress={confirmDeleteShift}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" style={styles.buttonIcon} />
                  <Text style={[styles.buttonText, { color: '#fff' }]}>{t('delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 4,
  },
  headerRight: {
    width: 32,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
    position: 'relative',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 30,
  },
  addButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftList: {
    marginTop: 8,
  },
  shiftItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  shiftItemContent: {
    flex: 1,
  },
  shiftName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 14,
  },
  activeShiftBadge: {
    marginTop: 8,
  },
  activeShiftText: {
    fontSize: 12,
    fontWeight: '500',
  },
  shiftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  settingControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  settingValue: {
    marginRight: 8,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    maxHeight: '80%',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  languageText: {
    fontSize: 16,
  },
  reminderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 16,
  },
  deleteModalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 24,
  },
  deleteModalBody: {
    marginBottom: 24,
  },
  deleteText: {
    fontSize: 16,
    marginBottom: 8,
  },
  deleteModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  deleteButton: {
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
  emptyState: {
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
  }
});

export default SettingsScreen;
