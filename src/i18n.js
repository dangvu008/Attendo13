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
    
    // Day names and abbreviations
    mon_short: 'Mon',
    tue_short: 'Tue',
    wed_short: 'Wed',
    thu_short: 'Thu',
    fri_short: 'Fri',
    sat_short: 'Sat',
    sun_short: 'Sun',
    
    // Tag names
    tag_work: 'Work',
    tag_personal: 'Personal',
    tag_important: 'Important',
    tag_urgent: 'Urgent',
    
    // Form validation and messages
    confirm_reset: 'Reset Form',
    confirm_reset_message: 'Are you sure you want to reset the form? All unsaved changes will be lost.',
    reset: 'Reset',
    confirm: 'Confirm',
    exit_note_confirm: 'You have unsaved changes. Are you sure you want to exit?',
    continue_editing: 'Continue Editing',
    exit: 'Exit',
    note_title_required: 'Title is required',
    note_content_required: 'Content is required',
    note_title_placeholder: 'Enter title...',
    note_content_placeholder: 'Enter content...',
    
    // Alerts and confirmations
    alert_title: 'Alert',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    information: 'Information',
    confirm_action: 'Confirm Action',
    
    // Settings
    notifications: 'Notifications',
    language: 'Language',
    theme: 'Theme',
    about: 'About',
    notification_settings: 'Notification Settings',
    notification_sound: 'Sound',
    notification_vibration: 'Vibration',
    appearance: 'Appearance',
    dark_mode: 'Dark Mode',
    language_settings: 'Language Settings',
    reset_app: 'Reset App',
    reset_app_confirm: 'This will reset all app data. This action cannot be undone.',
    reset_app_success: 'App data has been reset successfully',
    app_version: 'App Version',
    enable_notifications: 'Enable Notifications',
    reminder_type: 'Reminder Type',
    reminder_type_none: 'None',
    reminder_type_before: 'Before work only',
    reminder_type_after: 'After work only',
    reminder_type_both: 'Before and after work',
    
    // General actions
    save_changes: 'Save Changes',
    discard_changes: 'Discard Changes',
    loading: 'Loading...',
    
    // Settings Screen
    settings_title: 'Settings',
    general_settings: 'General Settings',
    language: 'Language',
    dark_mode_description: 'Enable dark theme for the app',
    shift_reminders: 'Shift Reminders',
    shift_reminder_description: 'Get notified about your shifts',
    version: 'Version',
    confirm_delete: 'Confirm Delete',
    notifications_enabled: 'Enable Notifications',
    notifications_enabled_description: 'Receive alerts about your shifts',
    notification_sound_description: 'Play sound with notifications',
    notification_vibration_description: 'Vibrate with notifications',
    currently_applied: 'Currently Applied',
    delete_shift_error: 'Error deleting shift',
    
    // Reminder types
    reminder_type_none: 'None',
    reminder_type_before_5_min: '5 min before',
    reminder_type_before_15_min: '15 min before',
    reminder_type_before_30_min: '30 min before',
    
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
    status_full_work: 'Full workday',
    status_missing_check: 'Missing check',
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
    work_duration: 'Work duration: ',
    work_status: 'Work Status',
    hours: 'hours',
    
    // Time validations
    time_validation_check_in: 'You are checking in at an unusual time. Do you want to continue?',
    time_validation_check_out: 'You are checking out at an unusual time. Do you want to continue?',
    must_go_work_first_message: 'You must go to work first before checking in.',
    must_check_in_first_message: 'You must check in first before checking out.',
    must_check_out_first_message: 'You must check out first before completing work.',
    early_departure_success: 'Early departure recorded successfully.',
    late_check_in_warning: 'You are checking in late.',
    early_check_out_warning: 'You are checking out early.',
    work_completed_success: 'Work completed successfully.',
    
    // Notes section
    notes: 'Notes',
    no_notes: 'No notes to display',
    
    // Confirmations
    confirm_action: 'Confirm Action',
    reset_confirmation_message: 'This will reset your work status for today. All check-in/out data will be cleared.',
    
    // Shift management
    shift_name: 'Shift Name',
    shift_start_time: 'Start Time',
    shift_end_time: 'End Time',
    shift_departure_time: 'Departure Time',
    shift_reminders: 'Reminders',
    shift_before_work: 'Before Work',
    shift_after_work: 'After Work',
    shift_days: 'Applied Days',
    shift_actions: 'Actions',
    add_shift: 'Add Shift',
    edit_shift: 'Edit Shift',
    delete_shift: 'Delete Shift',
    delete_shift_confirm: 'Are you sure you want to delete this shift?',
    shift_name_required: 'Shift name is required',
    shift_name_invalid: 'Shift name contains invalid characters',
    shift_name_too_long: 'Shift name is too long (max 30 characters)',
    shift_time_required: 'Time is required',
    shift_time_invalid: 'Invalid time format (HH:MM)',
    shift_saved: 'Shift saved successfully',
    shift_deleted: 'Shift deleted successfully',
    shift_duplicate: 'A shift with this name already exists',
    shift_show_button: 'Show action button',
    shift_active: 'Active',
    shift_minutes: 'minutes',
    select_minutes: 'Select Minutes',
    apply_shift: 'Apply Shift',
    day_shift: 'Day Shift',
    
    // Monthly stats screen
    monthly_stats: 'Monthly Stats',
    date: 'Date',
    day_of_week: 'Day',
    check_in: 'Check In',
    check_out: 'Check Out',
    regular_hours: 'Regular',
    overtime: 'Overtime',
    total_worked_time: 'Total Worked Time',
    
    // Notes screen
    notes_title: 'Notes',
    add_note: 'Add Note',
    edit_note: 'Edit Note',
    note_title: 'Title',
    note_content: 'Content',
    search: 'Search',
    no_notes_yet: 'No notes yet',
    add_new_note_hint: 'Tap + to add a new note',
    note_fields_required: 'Title and content are required',
    note_title_too_long: 'Title is too long (max {{max}} characters)',
    note_content_too_long: 'Content is too long (max {{max}} characters)',
    note_title_duplicate: 'A note with this title already exists',
    save_note_confirm: 'Save this note?',
    save_note_error: 'Failed to save note',
    delete_note_confirm: 'Delete this note?',
    delete_note_error: 'Failed to delete note',
    
    // Shift screen specific
    shift_title: 'Shifts',
    shift_name_special_chars: 'Shift name contains invalid characters',
    shift_name_max_length: 'Shift name is too long (max 200 characters)',
    shift_times_required: 'Start and end times are required',
    save_shift_confirm: 'Do you want to save this shift?',
    save_shift_error: 'Failed to save shift',
    apply_shift_confirm: 'Apply this shift?',
    shift_applied_success: 'Shift applied successfully',
    shift_applied_error: 'Failed to apply shift',
    day_mon: 'Monday',
    day_tue: 'Tuesday',
    day_wed: 'Wednesday',
    day_thu: 'Thursday',
    day_fri: 'Friday',
    day_sat: 'Saturday',
    day_sun: 'Sunday',
    reminder_time: 'Reminder Time',
    
    // Buttons
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    apply: 'Apply',
    cancel: 'Cancel',
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
    note_title_too_long: 'Tiêu đề quá dài (tối đa 30 ký tự)',
    note_content: 'Nội dung',
    note_content_placeholder: 'Nhập nội dung...',
    note_content_required: 'Nội dung là bắt buộc',
    note_content_too_long: 'Nội dung quá dài (tối đa 30 ký tự)',
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
    
    // Day names and abbreviations
    mon_short: 'T2',
    tue_short: 'T3',
    wed_short: 'T4',
    thu_short: 'T5',
    fri_short: 'T6',
    sat_short: 'T7',
    sun_short: 'CN',
    
    // Tag names
    tag_work: 'Công việc',
    tag_personal: 'Cá nhân',
    tag_important: 'Quan trọng',
    tag_urgent: 'Khẩn cấp',
    
    // Form validation and messages
    confirm_reset: 'Đặt Lại Form',
    confirm_reset_message: 'Bạn có chắc muốn đặt lại form? Tất cả thay đổi chưa lưu sẽ bị mất.',
    reset: 'Đặt lại',
    confirm: 'Xác nhận',
    exit_note_confirm: 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn thoát?',
    continue_editing: 'Tiếp tục chỉnh sửa',
    exit: 'Thoát',
    note_title_required: 'Tiêu đề là bắt buộc',
    note_content_required: 'Nội dung là bắt buộc',
    note_title_placeholder: 'Nhập tiêu đề...',
    note_content_placeholder: 'Nhập nội dung...',
    
    // Alerts and confirmations
    alert_title: 'Thông báo',
    success: 'Thành công',
    error: 'Lỗi',
    warning: 'Cảnh báo',
    information: 'Thông tin',
    confirm_action: 'Xác nhận hành động',
    
    // Settings
    notifications: 'Thông báo',
    language: 'Ngôn ngữ',
    theme: 'Giao diện',
    about: 'Thông tin',
    notification_settings: 'Cài đặt thông báo',
    notification_sound: 'Âm thanh',
    notification_vibration: 'Rung',
    appearance: 'Giao diện',
    dark_mode: 'Chế độ tối',
    language_settings: 'Cài đặt ngôn ngữ',
    reset_app: 'Đặt lại ứng dụng',
    reset_app_confirm: 'Thao tác này sẽ đặt lại tất cả dữ liệu ứng dụng. Điều này không thể hoàn tác.',
    reset_app_success: 'Dữ liệu ứng dụng đã được đặt lại thành công',
    app_version: 'Phiên bản ứng dụng',
    enable_notifications: 'Bật thông báo',
    reminder_type: 'Loại nhắc nhở',
    reminder_type_none: 'Không',
    reminder_type_before: 'Chỉ trước giờ làm',
    reminder_type_after: 'Chỉ sau giờ làm',
    reminder_type_both: 'Trước và sau giờ làm',
    
    // General actions
    save_changes: 'Lưu thay đổi',
    discard_changes: 'Hủy thay đổi',
    loading: 'Đang tải...',
    
    // Settings Screen
    settings_title: 'Cài đặt',
    general_settings: 'Cài đặt chung',
    language: 'Ngôn ngữ',
    dark_mode_description: 'Bật chế độ tối cho ứng dụng',
    shift_reminders: 'Nhắc nhở ca làm việc',
    shift_reminder_description: 'Nhận thông báo về ca làm việc của bạn',
    version: 'Phiên bản',
    confirm_delete: 'Xác nhận xóa',
    notifications_enabled: 'Bật thông báo',
    notifications_enabled_description: 'Nhận thông báo về ca làm việc',
    notification_sound_description: 'Phát âm thanh khi có thông báo',
    notification_vibration_description: 'Rung khi có thông báo',
    currently_applied: 'Đang áp dụng',
    delete_shift_error: 'Lỗi khi xóa ca làm việc',
    
    // Reminder types
    reminder_type_none: 'Không',
    reminder_type_before_5_min: '5 phút trước',
    reminder_type_before_15_min: '15 phút trước',
    reminder_type_before_30_min: '30 phút trước',
    
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
    status_early_late: 'Đi sớm/muộn',
    status_leave: 'Nghỉ phép',
    status_sick: 'Nghỉ bệnh',
    status_holiday: 'Nghỉ lễ',
    status_absent: 'Vắng mặt',
    status_unknown: 'Không xác định',
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
    work_duration: 'Đã đi làm ',
    work_status: 'Trạng thái làm việc',
    hours: 'giờ',
    
    // Time validations
    time_validation_check_in: 'Bạn đang chấm công vào vào thời điểm bất thường. Bạn có muốn tiếp tục?',
    time_validation_check_out: 'Bạn đang chấm công ra vào thời điểm bất thường. Bạn có muốn tiếp tục?',
    must_go_work_first_message: 'Bạn phải bắt đầu đi làm trước khi chấm công vào.',
    must_check_in_first_message: 'Bạn phải chấm công vào trước khi chấm công ra.',
    must_check_out_first_message: 'Bạn phải chấm công ra trước khi hoàn thành công việc.',
    early_departure_success: 'Đã ghi nhận việc ra về sớm.',
    late_check_in_warning: 'Bạn đang chấm công vào muộn.',
    early_check_out_warning: 'Bạn đang chấm công ra sớm.',
    work_completed_success: 'Công việc đã hoàn thành thành công.',
    
    // Notes section
    notes: 'Ghi chú',
    no_notes: 'Chưa có ghi chú nào',
    
    // Confirmations
    confirm_action: 'Xác nhận hành động',
    reset_confirmation_message: 'Điều này sẽ đặt lại trạng thái làm việc của bạn hôm nay. Tất cả dữ liệu chấm công sẽ bị xóa.',
    
    // Shift management
    shift_name: 'Tên Ca',
    shift_start_time: 'Giờ Bắt Đầu',
    shift_end_time: 'Giờ Kết Thúc',
    shift_departure_time: 'Giờ Ra Về',
    shift_reminders: 'Nhắc Nhở',
    shift_before_work: 'Trước Giờ Làm',
    shift_after_work: 'Sau Giờ Làm',
    shift_days: 'Ngày Áp Dụng',
    shift_actions: 'Thao Tác',
    add_shift: 'Thêm Ca',
    edit_shift: 'Sửa Ca',
    delete_shift: 'Xóa Ca',
    delete_shift_confirm: 'Bạn có chắc chắn muốn xóa ca này?',
    shift_name_required: 'Tên ca là bắt buộc',
    shift_name_invalid: 'Tên ca chứa ký tự không hợp lệ',
    shift_name_too_long: 'Tên ca quá dài (tối đa 30 ký tự)',
    shift_time_required: 'Giờ là bắt buộc',
    shift_time_invalid: 'Định dạng giờ không hợp lệ (HH:MM)',
    shift_saved: 'Đã lưu ca thành công',
    shift_deleted: 'Đã xóa ca thành công',
    shift_duplicate: 'Ca với tên này đã tồn tại',
    shift_show_button: 'Hiển thị nút thao tác',
    shift_active: 'Hoạt động',
    shift_minutes: 'phút',
    select_minutes: 'Chọn Phút',
    apply_shift: 'Áp Dụng Ca',
    day_shift: 'Ca Ngày',
    
    // Monthly stats screen
    monthly_stats: 'Thống kê tháng',
    date: 'Ngày',
    day_of_week: 'Thứ',
    check_in: 'Giờ vào',
    check_out: 'Giờ ra',
    regular_hours: 'Giờ thường',
    overtime: 'Tăng ca',
    total_worked_time: 'Tổng thởi gian làm việc',
    
    // Notes screen
    notes_title: 'Ghi chú',
    add_note: 'Thêm ghi chú',
    edit_note: 'Sửa ghi chú',
    note_title: 'Tiêu đề',
    note_content: 'Nội dung',
    search: 'Tìm kiếm',
    no_notes_yet: 'Chưa có ghi chú nào',
    add_new_note_hint: 'Nhấn + để thêm ghi chú mới',
    note_fields_required: 'Tiêu đề và nội dung là bắt buộc',
    note_title_too_long: 'Tiêu đề quá dài (tối đa {{max}} ký tự)',
    note_content_too_long: 'Nội dung quá dài (tối đa {{max}} ký tự)',
    note_title_duplicate: 'Ghi chú với tiêu đề này đã tồn tại',
    save_note_confirm: 'Lưu ghi chú này?',
    save_note_error: 'Không thể lưu ghi chú',
    delete_note_confirm: 'Xóa ghi chú này?',
    delete_note_error: 'Không thể xóa ghi chú',
    
    // Shift screen specific
    shift_title: 'Ca làm việc',
    shift_name_special_chars: 'Tên ca chứa ký tự không hợp lệ',
    shift_name_max_length: 'Tên ca quá dài (tối đa 200 ký tự)',
    shift_times_required: 'Thời gian bắt đầu và kết thúc là bắt buộc',
    save_shift_confirm: 'Bạn có muốn lưu ca này?',
    save_shift_error: 'Không thể lưu ca làm việc',
    apply_shift_confirm: 'Áp dụng ca này?',
    shift_applied_success: 'Đã áp dụng ca thành công',
    shift_applied_error: 'Không thể áp dụng ca',
    day_mon: 'Thứ Hai',
    day_tue: 'Thứ Ba',
    day_wed: 'Thứ Tư',
    day_thu: 'Thứ Năm',
    day_fri: 'Thứ Sáu',
    day_sat: 'Thứ Bảy',
    day_sun: 'Chủ Nhật',
    reminder_time: 'Thời gian nhắc nhở',
    
    // Buttons
    save: 'Lưu',
    edit: 'Sửa',
    delete: 'Xóa',
    apply: 'Áp dụng',
    cancel: 'Hủy',
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
