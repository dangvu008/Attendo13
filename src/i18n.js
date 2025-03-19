import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Các ngôn ngữ được hỗ trợ
const resources = {
  en: {
    translation: {
      // Common
      ok: 'OK',
      cancel: 'Cancel',
      yes: 'Yes',
      no: 'No',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      confirm: 'Confirm',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      
      // Home screen
      goToWork: 'Go to Work',
      checkIn: 'Check In',
      checkOut: 'Check Out',
      complete: 'Complete',
      action_required: 'Action required',
      action_confirmation: 'Are you sure you want to perform this action?',
      action_execution_error: 'There was an error executing the action.',
      work_status_error: 'Error loading work status',
      work_started: 'Work started',
      not_started_yet: 'Not started yet',
      
      // Time constraints
      too_early_check_in: 'It\'s too early to check in. Do you want to continue?',
      too_short_work_hours: 'You\'ve worked less than the required time. Do you want to check out anyway?',
      
      // Reset
      reset_work_status: 'Reset work status',
      reset_confirm: 'Are you sure you want to reset your work status for today? This action cannot be undone.',
      reset_success: 'Work status has been reset successfully.',
      reset_error: 'Error resetting work status',
      
      // Notes
      add_note: 'Add Note',
      note_placeholder: 'Enter your note here...',
      note_add_success: 'Note added successfully',
      note_add_error: 'Error adding note',
      note_empty: 'Note cannot be empty',
      note_edit: 'Edit Note',
      note_delete: 'Delete Note',
      note_delete_confirm: 'Are you sure you want to delete this note?',
      note_delete_success: 'Note deleted successfully',
      note_delete_error: 'Error deleting note',
      note_update_success: 'Note updated successfully',
      note_update_error: 'Error updating note',
      
      // Settings
      notifications: 'Notifications',
      language: 'Language',
      theme: 'Theme',
      about: 'About',
      
      // Action history
      history: 'Action History',
      no_history: 'No action history',
      
      // Work statistics
      statistics: 'Work Statistics',
      hours_worked: 'Hours Worked',
      regular_hours: 'Regular Hours',
      overtime_hours: 'Overtime Hours',
      total_hours: 'Total Hours',
      
      // Work status
      full_work: 'Full Work',
      rv_work: 'RV Work',
      absent: 'Absent',
      
      // Time periods
      today: 'Today',
      this_week: 'This Week',
      this_month: 'This Month',
      
      // Shifts
      shift: 'Shift',
      shift_morning: 'Morning Shift',
      shift_afternoon: 'Afternoon Shift',
      shift_night: 'Night Shift',
    }
  },
  vi: {
    translation: {
      // Common
      ok: 'OK',
      cancel: 'Hủy',
      yes: 'Có',
      no: 'Không',
      save: 'Lưu',
      edit: 'Sửa',
      delete: 'Xóa',
      confirm: 'Xác nhận',
      success: 'Thành công',
      error: 'Lỗi',
      warning: 'Cảnh báo',
      
      // Home screen
      goToWork: 'Đi làm',
      checkIn: 'Chấm công vào',
      checkOut: 'Chấm công ra',
      complete: 'Hoàn tất',
      action_required: 'Yêu cầu hành động',
      action_confirmation: 'Bạn có chắc chắn muốn thực hiện hành động này?',
      action_execution_error: 'Có lỗi xảy ra khi thực hiện hành động.',
      work_status_error: 'Lỗi khi tải trạng thái công việc',
      work_started: 'Đã bắt đầu làm việc',
      not_started_yet: 'Chưa bắt đầu',
      
      // Time constraints
      too_early_check_in: 'Bạn đang chấm công vào quá sớm. Bạn có muốn tiếp tục?',
      too_short_work_hours: 'Bạn đã làm việc ít hơn thời gian yêu cầu. Bạn vẫn muốn chấm công ra?',
      
      // Reset
      reset_work_status: 'Đặt lại trạng thái công việc',
      reset_confirm: 'Bạn có chắc chắn muốn đặt lại trạng thái công việc cho hôm nay? Hành động này không thể hoàn tác.',
      reset_success: 'Trạng thái công việc đã được đặt lại thành công.',
      reset_error: 'Lỗi khi đặt lại trạng thái công việc',
      
      // Notes
      add_note: 'Thêm ghi chú',
      note_placeholder: 'Nhập ghi chú của bạn...',
      note_add_success: 'Đã thêm ghi chú thành công',
      note_add_error: 'Lỗi khi thêm ghi chú',
      note_empty: 'Ghi chú không được để trống',
      note_edit: 'Sửa ghi chú',
      note_delete: 'Xóa ghi chú',
      note_delete_confirm: 'Bạn có chắc chắn muốn xóa ghi chú này?',
      note_delete_success: 'Đã xóa ghi chú thành công',
      note_delete_error: 'Lỗi khi xóa ghi chú',
      note_update_success: 'Đã cập nhật ghi chú thành công',
      note_update_error: 'Lỗi khi cập nhật ghi chú',
      
      // Settings
      notifications: 'Thông báo',
      language: 'Ngôn ngữ',
      theme: 'Giao diện',
      about: 'Thông tin',
      
      // Action history
      history: 'Lịch sử hành động',
      no_history: 'Không có lịch sử hành động',
      
      // Work statistics
      statistics: 'Thống kê công việc',
      hours_worked: 'Giờ làm việc',
      regular_hours: 'Giờ làm chính',
      overtime_hours: 'Giờ làm thêm',
      total_hours: 'Tổng giờ làm',
      
      // Work status
      full_work: 'Làm đủ',
      rv_work: 'Làm RV',
      absent: 'Vắng mặt',
      
      // Time periods
      today: 'Hôm nay',
      this_week: 'Tuần này',
      this_month: 'Tháng này',
      
      // Shifts
      shift: 'Ca làm',
      shift_morning: 'Ca sáng',
      shift_afternoon: 'Ca chiều',
      shift_night: 'Ca đêm',
    }
  }
};

// Khởi tạo i18n
const initI18n = async () => {
  let locale;
  try {
    // Cố gắng lấy ngôn ngữ từ AsyncStorage
    locale = await AsyncStorage.getItem('userLanguage');
  } catch (error) {
    console.error('Error loading language from storage:', error);
  }

  // Nếu không có ngôn ngữ được lưu, lấy ngôn ngữ của thiết bị
  if (!locale) {
    locale = Localization.locale.split('-')[0];
    // Nếu ngôn ngữ không được hỗ trợ, dùng tiếng Anh làm mặc định
    if (locale !== 'en' && locale !== 'vi') {
      locale = 'en';
    }
  }

  // Khởi tạo i18next
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: locale,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false
      },
      compatibilityJSON: 'v3'
    });

  return i18n;
};

// Khởi tạo i18n khi import module
initI18n();

// Hàm để lấy hook useTranslation và các hàm i18n khác
export const useTranslation = () => {
  return {
    t: (key, options) => i18n.t(key, options),
    i18n
  };
};

// Hàm để thay đổi ngôn ngữ
export const changeLanguage = async (language) => {
  try {
    await AsyncStorage.setItem('userLanguage', language);
    await i18n.changeLanguage(language);
    return true;
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

export default i18n;
