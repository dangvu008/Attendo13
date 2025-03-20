import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Các ngôn ngữ được hỗ trợ
const resources = {
  en: {
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
    reset: 'Reset',
    exit: 'Exit',
    
    // Home screen
    goToWork: 'Go to Work',
    checkIn: 'Check In',
    checkOut: 'Check Out',
    complete: 'Complete',
    workCompleted: 'Work Completed',
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
    confirm_reset: 'Confirm Reset',
    confirm_reset_message: 'Are you sure you want to reset? All data will be cleared.',
    
    // Notes
    add_note: 'Add Note',
    edit_note: 'Edit Note',
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
    note_title: 'Title',
    note_title_placeholder: 'Enter title...',
    note_title_required: 'Title is required',
    note_title_too_long: 'Title is too long (max: {{max}} characters)',
    note_content: 'Content',
    note_content_placeholder: 'Enter content...',
    note_content_required: 'Content is required',
    note_content_too_long: 'Content is too long (max: {{max}} characters)',
    reminder_date: 'Reminder Date',
    reminder_time: 'Reminder Time',
    repeat_on: 'Repeat On',
    note_days: 'Select days to repeat',
    note_color: 'Color',
    note_tags: 'Tags',
    save_note_confirm: 'Do you want to save this note?',
    exit_note_confirm: 'Exit without saving?',
    continue_editing: 'Continue Editing',
    no_reminder: 'No reminder',
    reminder: 'Reminder',
    invalid_time: 'Invalid time',
    
    // Week days
    mon_short: 'Mon',
    tue_short: 'Tue',
    wed_short: 'Wed',
    thu_short: 'Thu',
    fri_short: 'Fri',
    sat_short: 'Sat',
    sun_short: 'Sun',
    
    // Tags
    tag_work: 'Work',
    tag_personal: 'Personal',
    tag_important: 'Important',
    tag_urgent: 'Urgent',
    
    // Settings
    notifications: 'Notifications',
    language: 'Language',
    theme: 'Theme',
    about: 'About',
    
    // Action history
    action_history: 'Action History',
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

    // Weekly status grid
    weekly_status: 'Weekly Status',
    status_full_work: 'Full Work',
    status_missing_check: 'Missing Check',
    status_early_late: 'Early/Late',
    status_leave: 'Leave',
    status_sick: 'Sick',
    status_holiday: 'Holiday',
    status_absent: 'Absent',
    status_unknown: 'Unknown',
    change_status: 'Change Status',
    select_status: 'Select Status',
    no_data_available: 'No data available for this date',
    check_in_time: 'Check-in Time',
    check_out_time: 'Check-out Time',
    total_hours: 'Total Hours',
    note: 'Note',
    day_details: 'Day Details',
    close: 'Close',
    view_details: 'View Details',
    work_duration: 'Work Duration',
    work_status: 'Work Status',
    hours: 'hours',
  },
  vi: {
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
    reset: 'Đặt lại',
    exit: 'Thoát',
    
    // Home screen
    goToWork: 'Đi làm',
    checkIn: 'Chấm công vào',
    checkOut: 'Chấm công ra',
    complete: 'Hoàn tất',
    workCompleted: 'Đã hoàn thành',
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
    confirm_reset: 'Xác nhận đặt lại',
    confirm_reset_message: 'Bạn có chắc chắn muốn đặt lại? Tất cả dữ liệu sẽ bị xóa.',
    
    // Notes
    add_note: 'Thêm ghi chú',
    edit_note: 'Sửa ghi chú',
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
    note_title: 'Tiêu đề',
    note_title_placeholder: 'Nhập tiêu đề...',
    note_title_required: 'Tiêu đề là bắt buộc',
    note_title_too_long: 'Tiêu đề quá dài (tối đa: {{max}} ký tự)',
    note_content: 'Nội dung',
    note_content_placeholder: 'Nhập nội dung...',
    note_content_required: 'Nội dung là bắt buộc',
    note_content_too_long: 'Nội dung quá dài (tối đa: {{max}} ký tự)',
    reminder_date: 'Ngày nhắc nhở',
    reminder_time: 'Giờ nhắc nhở',
    repeat_on: 'Lặp lại vào',
    note_days: 'Chọn các ngày lặp lại',
    note_color: 'Màu sắc',
    note_tags: 'Thẻ',
    save_note_confirm: 'Bạn có muốn lưu ghi chú này?',
    exit_note_confirm: 'Thoát mà không lưu?',
    continue_editing: 'Tiếp tục chỉnh sửa',
    no_reminder: 'Không có nhắc nhở',
    reminder: 'Nhắc nhở',
    invalid_time: 'Thời gian không hợp lệ',
    
    // Week days
    mon_short: 'T2',
    tue_short: 'T3',
    wed_short: 'T4',
    thu_short: 'T5',
    fri_short: 'T6',
    sat_short: 'T7',
    sun_short: 'CN',
    
    // Tags
    tag_work: 'Công việc',
    tag_personal: 'Cá nhân',
    tag_important: 'Quan trọng',
    tag_urgent: 'Khẩn cấp',
    
    // Settings
    notifications: 'Thông báo',
    language: 'Ngôn ngữ',
    theme: 'Giao diện',
    about: 'Thông tin',
    
    // Action history
    action_history: 'Lịch sử hành động',
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

    // Weekly status grid
    weekly_status: 'Trạng thái tuần này',
    status_full_work: 'Đủ công',
    status_missing_check: 'Thiếu chấm công',
    status_early_late: 'Vào muộn/ra sớm',
    status_leave: 'Nghỉ phép',
    status_sick: 'Nghỉ bệnh',
    status_holiday: 'Nghỉ lễ',
    status_absent: 'Vắng mặt',
    status_unknown: 'Chưa cập nhật',
    change_status: 'Thay đổi trạng thái',
    select_status: 'Chọn trạng thái',
    no_data_available: 'Không có dữ liệu cho ngày này',
    check_in_time: 'Giờ vào',
    check_out_time: 'Giờ ra',
    total_hours: 'Tổng giờ làm',
    note: 'Ghi chú',
    day_details: 'Chi tiết ngày',
    close: 'Đóng',
    view_details: 'Xem chi tiết',
    work_duration: 'Thời gian làm việc',
    work_status: 'Trạng thái làm việc',
    hours: 'giờ',
  }
};

// Khởi tạo i18n
const i18n = new I18n(resources);

// Mặc định cho fallback ngôn ngữ
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Thiết lập ngôn ngữ mặc định là ngôn ngữ của thiết bị
const deviceLocale = Localization.locale.split('-')[0];
i18n.locale = deviceLocale === 'vi' ? 'vi' : 'en';

// Hàm để tải ngôn ngữ từ storage
export const loadStoredLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem('userLanguage');
    if (storedLanguage) {
      i18n.locale = storedLanguage;
    }
  } catch (error) {
    console.error('Error loading stored language:', error);
  }
};

// Tải ngôn ngữ khi file được import
loadStoredLanguage();

export default i18n;
