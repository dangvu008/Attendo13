import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { useShift } from '../context/ShiftContext';

const SettingsScreen = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { locale, changeLocale, t } = useLocalization();
  const { shifts, applyShift } = useShift();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAllShifts, setShowAllShifts] = useState(true);

  const handleToggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
  };

  const handleToggleShowAllShifts = () => {
    setShowAllShifts(prev => !prev);
  };

  const handleChangeLanguage = (newLocale) => {
    changeLocale(newLocale);
    Alert.alert(
      locale === 'vi' ? 'Language Changed' : 'Đã Thay Đổi Ngôn Ngữ',
      locale === 'vi' ? 'Application language changed to English' : 'Ngôn ngữ ứng dụng đã thay đổi thành Tiếng Việt',
      [{ text: 'OK' }]
    );
  };

  const renderSettingItem = (icon, title, subtitle, rightComponent) => (
    <View style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightComponent}
    </View>
  );

  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.headerTitle}>{t('settings_title')}</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Theme */}
        {renderSectionHeader(t('theme'))}
        {renderSettingItem(
          isDarkMode ? 'moon' : 'sunny',
          t('dark_mode'),
          isDarkMode ? 'On' : 'Off',
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: theme.colors.primaryLight }}
            thumbColor={isDarkMode ? theme.colors.primary : '#f4f3f4'}
          />
        )}
        
        {/* Language */}
        {renderSectionHeader(t('language'))}
        {renderSettingItem(
          'language',
          t('vietnamese'),
          '',
          <TouchableOpacity 
            style={[
              styles.languageButton,
              { backgroundColor: locale === 'vi' ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.primary }
            ]}
            onPress={() => handleChangeLanguage('vi')}
          >
            <Text style={{ color: locale === 'vi' ? '#fff' : theme.colors.primary }}>{locale === 'vi' ? '✓' : ''}</Text>
          </TouchableOpacity>
        )}
        {renderSettingItem(
          'language-outline',
          t('english'),
          '',
          <TouchableOpacity 
            style={[
              styles.languageButton,
              { backgroundColor: locale === 'en' ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.primary }
            ]}
            onPress={() => handleChangeLanguage('en')}
          >
            <Text style={{ color: locale === 'en' ? '#fff' : theme.colors.primary }}>{locale === 'en' ? '✓' : ''}</Text>
          </TouchableOpacity>
        )}
        
        {/* Notifications */}
        {renderSectionHeader(t('notifications'))}
        {renderSettingItem(
          'notifications',
          t('enable_notifications'),
          notificationsEnabled ? 'On' : 'Off',
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#767577', true: theme.colors.primaryLight }}
            thumbColor={notificationsEnabled ? theme.colors.primary : '#f4f3f4'}
          />
        )}
        
        {/* Shift Display */}
        {renderSectionHeader(t('shift_display'))}
        {renderSettingItem(
          'calendar',
          t('show_all_shifts'),
          '',
          <Switch
            value={showAllShifts}
            onValueChange={handleToggleShowAllShifts}
            trackColor={{ false: '#767577', true: theme.colors.primaryLight }}
            thumbColor={showAllShifts ? theme.colors.primary : '#f4f3f4'}
          />
        )}
        
        {/* About */}
        {renderSectionHeader(t('about'))}
        {renderSettingItem(
          'information-circle',
          t('app_name'),
          `${t('version')}: 1.0.0`,
          null
        )}
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  languageButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SettingsScreen;
