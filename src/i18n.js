import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18n-js";
import { I18nManager } from "react-native";

// Các ngôn ngữ được hỗ trợ
const resources = {
  en: {
    // Common
    ok: "OK",
    cancel: "Cancel",
    yes: "Yes",
    no: "No",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    confirm: "Confirm",
    success: "Success",
    error: "Error",
    warning: "Warning",
    reset: "Reset",
    exit: "Exit",

    // Home screen
    goToWork: "Go to Work",
    checkIn: "Check In",
    checkOut: "Check Out",
    complete: "Complete",
    workCompleted: "Work Completed",
    action_required: "Action required",
    action_confirmation: "Are you sure you want to perform this action?",
    action_execution_error: "An error occurred while performing the action.",
    work_status_error: "Error loading work status",
    work_started: "Work started",
    not_started_yet: "Not started yet",
    checked_in: "Checked in",
    checked_out: "Checked out",

    // Time constraints
    too_early_check_in: "It's too early to check in. Do you want to continue?",
    too_short_work_hours:
      "You've worked less than the required time. Do you want to check out anyway?",
    time_validation_check_in:
      "You should wait at least 5 minutes after going to work before checking in. Do you want to continue anyway?",
    time_validation_check_out:
      "You should work at least 2 hours before checking out. Do you want to continue anyway?",
    minimum_time_notice: "Minimum time not reached",

    // Reset
    reset_work_status: "Reset Work Status",
    reset_confirm:
      "Are you sure you want to reset your work status for today? This action cannot be undone.",
    reset_success: "Work status has been reset successfully.",
    reset_error: "Error resetting work status",
    confirm_reset: "Confirm Reset",
    confirm_reset_message:
      "Are you sure you want to reset? All data will be deleted.",

    // Notes
    add_note: "Add Note",
    edit_note: "Edit Note",
    note_placeholder: "Enter your note here...",
    note_add_success: "Note added successfully",
    note_add_error: "Error adding note",
    note_empty: "Note cannot be empty",
    note_edit: "Edit Note",
    note_delete: "Delete Note",
    note_delete_confirm: "Are you sure you want to delete this note?",
    note_delete_success: "Note deleted successfully",
    note_delete_error: "Error deleting note",
    note_update_success: "Note updated successfully",
    note_update_error: "Error updating note",
    note_title: "Title",
    note_title_placeholder: "Enter title...",
    note_title_required: "Title is required",
    note_title_too_long: "Title is too long (max: {{max}} characters)",
    note_content: "Content",
    note_content_placeholder: "Enter content...",
    note_content_required: "Content is required",
    note_content_too_long: "Content is too long (max: {{max}} characters)",
    reminder_date: "Reminder Date",
    reminder_time: "Reminder Time",
    repeat_on: "Repeat On",
    note_days: "Select days to repeat",
    note_color: "Color",
    note_tags: "Tags",
    save_note_confirm: "Do you want to save this note?",
    exit_note_confirm: "Exit without saving?",
    continue_editing: "Continue Editing",
    no_reminder: "No reminder",
    reminder: "Reminder",
    invalid_time: "Invalid time",

    // Day names and abbreviations
    mon_short: "Mon",
    tue_short: "Tue",
    wed_short: "Wed",
    thu_short: "Thu",
    fri_short: "Fri",
    sat_short: "Sat",
    sun_short: "Sun",

    // Tag names
    tag_work: "Work",
    tag_personal: "Personal",
    tag_important: "Important",
    tag_urgent: "Urgent",

    // Form validation and messages
    confirm_reset: "Reset Form",
    confirm_reset_message:
      "Are you sure you want to reset the form? All unsaved changes will be lost.",
    reset: "Reset",
    confirm: "Confirm",
    exit_note_confirm:
      "You have unsaved changes. Are you sure you want to exit?",
    continue_editing: "Continue Editing",
    exit: "Exit",
    note_title_required: "Title is required",
    note_content_required: "Content is required",
    note_title_placeholder: "Enter title...",
    note_content_placeholder: "Enter content...",

    // Alerts and confirmations
    alert_title: "Alert",
    success: "Success",
    error: "Error",
    warning: "Warning",
    information: "Information",
    confirm_action: "Confirm Action",

    // Settings
    notifications: "Notifications",
    language: "Language",
    theme: "Theme",
    about: "About",
    notification_settings: "Notification Settings",
    notification_sound: "Sound",
    notification_vibration: "Vibration",
    appearance: "Appearance",
    dark_mode: "Dark Mode",
    language_settings: "Language Settings",
    reset_app: "Reset App",
    reset_app_confirm:
      "This will reset all app data. This action cannot be undone.",
    reset_app_success: "App data has been reset successfully",
    app_version: "App Version",
    enable_notifications: "Enable Notifications",
    reminder_type: "Reminder Type",
    reminder_type_none: "None",
    reminder_type_before: "Before work only",
    reminder_type_after: "After work only",
    reminder_type_both: "Before and after work",

    // General actions
    save_changes: "Save Changes",
    discard_changes: "Discard Changes",
    loading: "Loading...",

    // Settings Screen
    settings_title: "Settings",
    general_settings: "General Settings",
    language: "Language",
    dark_mode_description: "Enable dark theme for the app",
    shift_reminders: "Shift Reminders",
    shift_reminder_description: "Get notified about your shifts",
    version: "Version",
    confirm_delete: "Confirm Delete",
    notifications_enabled: "Enable Notifications",
    notifications_enabled_description: "Receive alerts about your shifts",
    notification_sound_description: "Play sound with notifications",
    notification_vibration_description: "Vibrate with notifications",
    currently_applied: "Currently Applied",
    delete_shift_error: "Error deleting shift",

    // Menu items
    home: "Home",
    shifts: "Shifts",
    stats: "Stats",
    notes: "Notes",
    settings: "Settings",

    // Reminder types
    reminder_type_none: "None",
    reminder_type_before_5_min: "5 min before",
    reminder_type_before_15_min: "15 min before",
    reminder_type_before_30_min: "30 min before",

    // Action history
    action_history: "Action History",
    no_history: "No action history",

    // Work statistics
    statistics: "Work Statistics",
    hours_worked: "Hours Worked",
    regular_hours: "Regular Hours",
    overtime_hours: "Overtime Hours",
    total_hours: "Total Hours",

    // Work status
    full_work: "Full Work",
    rv_work: "RV Work",
    absent: "Absent",

    // Time periods
    today: "Today",
    this_week: "This Week",
    this_month: "This Month",

    // Shifts
    shift: "Shift",
    shift_morning: "Morning Shift",
    shift_afternoon: "Afternoon Shift",
    shift_night: "Night Shift",

    // Weekly status grid
    weekly_status: "Weekly Status",
    status_full_work: "Complete Work",
    status_missing_check: "Missing Check",
    status_early_late: "Early/Late",
    status_leave: "On Leave",
    status_sick: "Sick Leave",
    status_holiday: "Holiday",
    status_absent: "Absent",
    status_unknown: "Unknown",
    check_in_time: "Check-in",
    check_out_time: "Check-out",
    work_time: "Work Time",
    status_details: "Status Details",
    change_status: "Change Status",
    no_data: "No data",
    select_status: "Select Status",
    future_date: "Future date",

    // Time validations
    time_validation_check_in:
      "You are checking in at an unusual time. Do you want to continue?",
    time_validation_check_out:
      "You are checking out at an unusual time. Do you want to continue?",
    must_go_work_first_message: "You must start work before checking in.",
    must_check_in_first_message: "You must check in before checking out.",
    must_check_out_first_message: "You must check out before completing work.",
    early_departure_success: "Early departure recorded successfully.",
    late_check_in_warning: "You are checking in late.",
    early_check_out_warning: "You are checking out early.",
    work_completed_success: "Work completed successfully.",

    // Notes section
    notes: "Notes",
    no_notes: "No notes to display",

    // Confirmations
    confirm_action: "Confirm Action",
    reset_confirmation_message:
      "This will reset your work status for today. All check-in data will be deleted.",
    confirm_reset: "Confirm Reset",
    confirm_reset_message:
      "Are you sure you want to reset? All data will be deleted.",
    action_confirmation: "Are you sure you want to perform this action?",

    // Action status messages
    must_go_work_first_message: "You must start work before checking in.",
    must_check_in_first_message: "You must check in before checking out.",
    must_check_out_first_message: "You must check out before completing work.",
    action_execution_error: "An error occurred while performing the action.",

    // Reset messages
    reset_work_status: "Reset Work Status",
    reset_confirm:
      "Are you sure you want to reset your work status for today? This action cannot be undone.",
    reset_success: "Work status has been reset successfully.",
    reset_error: "Error resetting work status",

    // Shift management
    shift_name: "Shift Name",
    shift_name_required: "Shift name is required",
    shift_name_special_chars: "Shift name contains invalid characters",
    shift_name_max_length: "Shift name cannot exceed 200 characters",
    shift_name_duplicate: "Shift name already exists",
    shift_times_required: "Shift times are required",
    shift_duplicate: "Shift with same times already exists",
    shift_applied: "Shift applied successfully",
    shift_applied_error: "Failed to apply shift",
    shift_apply_error: "Error applying shift",
    confirm_reset_form_message:
      "Are you sure you want to reset the form? All unsaved changes will be lost.",

    // Buttons
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    apply: "Apply",
    cancel: "Cancel",

    // Shift confirmations
    delete_shift_confirm: "Are you sure you want to delete this shift?",
    save_shift_confirm: "Do you want to save this shift?",
    save_shift_error: "Failed to save shift",
    delete_shift_error: "Error deleting shift",
    shift_applied: "Shift applied successfully",
    shift_applied_error: "Failed to apply shift",
    shift_apply_error: "Error applying shift",
  },
  vi: {
    // Common
    ok: "OK",
    cancel: "Hủy",
    yes: "Có",
    no: "Không",
    save: "Lưu",
    edit: "Sửa",
    delete: "Xóa",
    confirm: "Xác nhận",
    success: "Thành công",
    error: "Lỗi",
    warning: "Cảnh báo",
    reset: "Đặt lại",
    exit: "Thoát",

    // Home screen
    goToWork: "Đi làm",
    checkIn: "Chấm công vào",
    checkOut: "Chấm công ra",
    complete: "Hoàn tất",
    workCompleted: "Đã Hoàn Thành",
    action_required: "Cần Thao Tác",
    action_confirmation: "Bạn có chắc chắn muốn thực hiện thao tác này?",
    action_execution_error: "Đã xảy ra lỗi khi thực hiện thao tác.",
    work_status_error: "Lỗi khi tải trạng thái công việc",
    work_started: "Bắt đầu làm việc",
    not_started_yet: "Chưa bắt đầu",
    checked_in: "Đã chấm công vào",
    checked_out: "Đã chấm công ra",
    work_completed: "Đã hoàn thành",

    // Time constraints
    too_early_check_in: "Bạn đang chấm công vào quá sớm. Bạn có muốn tiếp tục?",
    too_short_work_hours:
      "Bạn đã làm việc ít hơn thời gian yêu cầu. Bạn vẫn muốn chấm công ra?",
    time_validation_check_in:
      "Bạn nên đợi ít nhất 5 phút sau khi đi làm trước khi chấm công vào. Bạn có muốn tiếp tục?",
    time_validation_check_out:
      "Bạn nên làm việc ít nhất 2 giờ trước khi chấm công ra. Bạn có muốn tiếp tục?",
    minimum_time_notice: "Thời gian tối thiểu chưa đạt",

    // Reset
    reset_work_status: "Đặt lại trạng thái công việc",
    reset_confirm:
      "Bạn có chắc chắn muốn đặt lại trạng thái công việc cho hôm nay? Hành động này không thể hoàn tác.",
    reset_success: "Trạng thái công việc đã được đặt lại thành công.",
    reset_error: "Lỗi khi đặt lại trạng thái công việc",
    confirm_reset: "Xác nhận đặt lại",
    confirm_reset_message:
      "Bạn có chắc chắn muốn đặt lại? Tất cả dữ liệu sẽ bị xóa.",

    // Notes
    add_note: "Thêm ghi chú",
    edit_note: "Sửa ghi chú",
    note_placeholder: "Nhập ghi chú của bạn...",
    note_add_success: "Đã thêm ghi chú thành công",
    note_add_error: "Lỗi khi thêm ghi chú",
    note_empty: "Ghi chú không được để trống",
    note_edit: "Sửa ghi chú",
    note_delete: "Xóa ghi chú",
    note_delete_confirm: "Bạn có chắc chắn muốn xóa ghi chú này?",
    note_delete_success: "Đã xóa ghi chú thành công",
    note_delete_error: "Lỗi khi xóa ghi chú",
    note_update_success: "Đã cập nhật ghi chú thành công",
    note_update_error: "Lỗi khi cập nhật ghi chú",
    note_title: "Tiêu đề",
    note_title_placeholder: "Nhập tiêu đề...",
    note_title_required: "Tiêu đề là bắt buộc",
    note_title_too_long: "Tiêu đề quá dài (tối đa 30 ký tự)",
    note_content: "Nội dung",
    note_content_placeholder: "Nhập nội dung...",
    note_content_required: "Nội dung là bắt buộc",
    note_content_too_long: "Nội dung quá dài (tối đa 30 ký tự)",
    reminder_date: "Ngày nhắc nhở",
    reminder_time: "Giờ nhắc nhở",
    repeat_on: "Lặp lại vào",
    note_days: "Chọn các ngày lặp lại",
    note_color: "Màu sắc",
    note_tags: "Thẻ",
    save_note_confirm: "Bạn có muốn lưu ghi chú này?",
    exit_note_confirm: "Thoát mà không lưu?",
    continue_editing: "Tiếp tục chỉnh sửa",
    no_reminder: "Không có nhắc nhở",
    reminder: "Nhắc nhở",
    invalid_time: "Thời gian không hợp lệ",

    // Day names and abbreviations
    mon_short: "T2",
    tue_short: "T3",
    wed_short: "T4",
    thu_short: "T5",
    fri_short: "T6",
    sat_short: "T7",
    sun_short: "CN",

    // Tag names
    tag_work: "Công việc",
    tag_personal: "Cá nhân",
    tag_important: "Quan trọng",
    tag_urgent: "Khẩn cấp",

    // Form validation and messages
    confirm_reset: "Đặt Lại Form",
    confirm_reset_message:
      "Bạn có chắc muốn đặt lại form? Tất cả thay đổi chưa lưu sẽ bị mất.",
    reset: "Đặt lại",
    confirm: "Xác nhận",
    exit_note_confirm: "Bạn có thay đổi chưa lưu. Bạn có chắc muốn thoát?",
    continue_editing: "Tiếp tục chỉnh sửa",
    exit: "Thoát",
    note_title_required: "Tiêu đề là bắt buộc",
    note_content_required: "Nội dung là bắt buộc",
    note_title_placeholder: "Nhập tiêu đề...",
    note_content_placeholder: "Nhập nội dung...",

    // Alerts and confirmations
    alert_title: "Thông báo",
    success: "Thành công",
    error: "Lỗi",
    warning: "Cảnh báo",
    information: "Thông tin",
    confirm_action: "Xác nhận hành động",

    // Settings
    notifications: "Thông báo",
    language: "Ngôn ngữ",
    theme: "Giao diện",
    about: "Thông tin",
    notification_settings: "Cài đặt thông báo",
    notification_sound: "Âm thanh",
    notification_vibration: "Rung",
    appearance: "Giao diện",
    dark_mode: "Chế độ tối",
    language_settings: "Cài đặt ngôn ngữ",
    reset_app: "Đặt lại ứng dụng",
    reset_app_confirm:
      "Thao tác này sẽ đặt lại tất cả dữ liệu ứng dụng. Điều này không thể hoàn tác.",
    reset_app_success: "Dữ liệu ứng dụng đã được đặt lại thành công",
    app_version: "Phiên bản ứng dụng",
    enable_notifications: "Bật thông báo",
    reminder_type: "Loại nhắc nhở",
    reminder_type_none: "Không",
    reminder_type_before: "Chỉ trước giờ làm",
    reminder_type_after: "Chỉ sau giờ làm",
    reminder_type_both: "Trước và sau giờ làm",

    // General actions
    save_changes: "Lưu thay đổi",
    discard_changes: "Hủy thay đổi",
    loading: "Đang tải...",

    // Settings Screen
    settings_title: "Cài Đặt",
    general_settings: "Cài Đặt Chung",
    language: "Ngôn Ngữ",
    dark_mode_description: "Bật chế độ tối cho ứng dụng",
    shift_reminders: "Nhắc Nhở Ca Làm",
    shift_reminder_description: "Nhận thông báo về ca làm việc của bạn",
    version: "Phiên Bản",
    confirm_delete: "Xác Nhận Xóa",
    notifications_enabled: "Bật Thông Báo",
    notifications_enabled_description: "Nhận cảnh báo về ca làm việc của bạn",
    notification_sound_description: "Phát âm thanh với thông báo",
    notification_vibration_description: "Rung khi có thông báo",
    currently_applied: "Đang Áp Dụng",
    delete_shift_error: "Lỗi khi xóa ca làm việc",

    // Menu items
    home: "Trang Chủ",
    shifts: "Ca Làm",
    stats: "Thống Kê",
    notes: "Ghi Chú",
    settings: "Cài Đặt",

    // Reminder types
    reminder_type_none: "Không",
    reminder_type_before_5_min: "5 phút trước",
    reminder_type_before_15_min: "15 phút trước",
    reminder_type_before_30_min: "30 phút trước",

    // Action history
    action_history: "Lịch sử hành động",
    no_history: "Không có lịch sử hành động",

    // Work statistics
    statistics: "Thống kê công việc",
    hours_worked: "Giờ làm việc",
    regular_hours: "Giờ làm chính",
    overtime_hours: "Giờ làm thêm",
    total_hours: "Tổng giờ làm",

    // Work status
    full_work: "Làm đủ",
    rv_work: "Làm RV",
    absent: "Vắng mặt",

    // Time periods
    today: "Hôm nay",
    this_week: "Tuần này",
    this_month: "Tháng này",

    // Shifts
    shift: "Ca làm",
    shift_morning: "Ca sáng",
    shift_afternoon: "Ca chiều",
    shift_night: "Ca đêm",

    // Weekly status grid
    weekly_status: "Trạng thái tuần",
    status_full_work: "Đủ công",
    status_missing_check: "Thiếu chấm công",
    status_early_late: "Vào muộn/Ra sớm",
    status_leave: "Nghỉ phép",
    status_sick: "Nghỉ bệnh",
    status_holiday: "Nghỉ lễ",
    status_absent: "Vắng không lý do",
    status_unknown: "Chưa cập nhật",
    check_in_time: "Giờ vào",
    check_out_time: "Giờ ra",
    work_time: "Thời gian làm việc",
    status_details: "Chi tiết trạng thái",
    change_status: "Thay đổi trạng thái",
    no_data: "Không có dữ liệu",
    select_status: "Chọn trạng thái",
    future_date: "Ngày trong tương lai",

    // Time validations
    time_validation_check_in:
      "Bạn đang chấm công vào vào thời điểm bất thường. Bạn có muốn tiếp tục?",
    time_validation_check_out:
      "Bạn đang chấm công ra vào thời điểm bất thường. Bạn có muốn tiếp tục?",
    must_go_work_first_message:
      "Bạn phải bắt đầu đi làm trước khi chấm công vào.",
    must_check_in_first_message:
      "Bạn phải chấm công vào trước khi chấm công ra.",
    must_check_out_first_message:
      "Bạn phải chấm công ra trước khi hoàn thành công việc.",
    early_departure_success: "Đã ghi nhận việc ra về sớm.",
    late_check_in_warning: "Bạn đang chấm công vào muộn.",
    early_check_out_warning: "Bạn đang chấm công ra sớm.",
    work_completed_success: "Công việc đã hoàn thành thành công.",

    // Notes section
    notes: "Ghi chú",
    no_notes: "Chưa có ghi chú nào",

    // Confirmations
    confirm_action: "Xác Nhận Thao Tác",
    reset_confirmation_message:
      "Điều này sẽ đặt lại trạng thái làm việc của bạn hôm nay. Tất cả dữ liệu chấm công sẽ bị xóa.",
    confirm_reset: "Xác Nhận Đặt Lại",
    confirm_reset_message:
      "Bạn có chắc chắn muốn đặt lại? Tất cả dữ liệu sẽ bị xóa.",
    action_confirmation: "Bạn có chắc chắn muốn thực hiện thao tác này?",

    // Action status messages
    must_go_work_first_message:
      "Bạn phải bắt đầu đi làm trước khi chấm công vào.",
    must_check_in_first_message:
      "Bạn phải chấm công vào trước khi chấm công ra.",
    must_check_out_first_message:
      "Bạn phải chấm công ra trước khi hoàn thành công việc.",
    action_execution_error: "Đã xảy ra lỗi khi thực hiện thao tác.",

    // Reset messages
    reset_work_status: "Đặt Lại Trạng Thái Công Việc",
    reset_confirm:
      "Bạn có chắc chắn muốn đặt lại trạng thái công việc cho hôm nay? Hành động này không thể hoàn tác.",
    reset_success: "Trạng thái công việc đã được đặt lại thành công.",
    reset_error: "Lỗi khi đặt lại trạng thái công việc",

    // Shift management
    shift_name: "Tên Ca",
    shift_name_required: "Tên ca là bắt buộc",
    shift_name_special_chars: "Tên ca chứa ký tự không hợp lệ",
    shift_name_max_length: "Tên ca không được vượt quá 200 ký tự",
    shift_name_duplicate: "Tên ca đã tồn tại",
    shift_times_required: "Thời gian ca là bắt buộc",
    shift_duplicate: "Ca làm việc với thời gian tương tự đã tồn tại",
    shift_applied: "Đã áp dụng ca làm việc thành công",
    shift_applied_error: "Lỗi khi áp dụng ca làm việc",
    shift_apply_error: "Lỗi khi áp dụng ca làm việc",
    confirm_reset_form_message:
      "Bạn có chắc chắn muốn đặt lại biểu mẫu? Tất cả các thay đổi chưa lưu sẽ bị mất.",

    // Monthly stats screen
    monthly_stats: "Thống kê tháng",
    date: "Ngày",
    day_of_week: "Thứ",
    check_in: "Giờ vào",
    check_out: "Giờ ra",
    regular_hours: "Giờ thường",
    overtime: "Tăng ca",
    total_worked_time: "Tổng thởi gian làm việc",

    // Notes screen
    notes_title: "Ghi chú",
    add_note: "Thêm ghi chú",
    edit_note: "Sửa ghi chú",
    note_title: "Tiêu đề",
    note_content: "Nội dung",
    search: "Tìm kiếm",
    no_notes_yet: "Chưa có ghi chú nào",
    add_new_note_hint: "Nhấn + để thêm ghi chú mới",
    note_fields_required: "Tiêu đề và nội dung là bắt buộc",
    note_title_too_long: "Tiêu đề quá dài (tối đa {{max}} ký tự)",
    note_content_too_long: "Nội dung quá dài (tối đa {{max}} ký tự)",
    note_title_duplicate: "Ghi chú với tiêu đề này đã tồn tại",
    save_note_confirm: "Lưu ghi chú này?",
    save_note_error: "Không thể lưu ghi chú",
    delete_note_confirm: "Xóa ghi chú này?",
    delete_note_error: "Không thể xóa ghi chú",

    // Shift screen specific
    shift_title: "Ca Làm Việc",
    shifts_title: "Ca Làm Việc",
    shift_name_special_chars: "Tên ca chứa ký tự không hợp lệ",
    shift_name_max_length: "Tên ca quá dài (tối đa 200 ký tự)",
    shift_times_required: "Thời gian bắt đầu và kết thúc là bắt buộc",
    save_shift_confirm: "Bạn có muốn lưu ca làm việc này?",
    save_shift_error: "Lỗi khi lưu ca làm việc",
    apply_shift_confirm: "Áp dụng ca làm việc này?",
    shift_applied: "Đã áp dụng ca làm việc thành công",
    shift_applied_error: "Lỗi khi áp dụng ca làm việc",
    shift_apply_error: "Lỗi khi áp dụng ca làm việc",
    no_shifts: "Không có ca làm việc nào",
    confirm_reset_form_message:
      "Bạn có chắc chắn muốn đặt lại biểu mẫu? Tất cả các thay đổi chưa lưu sẽ bị mất.",

    // Buttons
    save: "Lưu",
    edit: "Sửa",
    delete: "Xóa",
    apply: "Áp dụng",
    cancel: "Hủy",

    // Shift confirmations
    delete_shift_confirm: "Bạn có chắc chắn muốn xóa ca làm việc này?",
    save_shift_confirm: "Bạn có muốn lưu ca làm việc này?",
    save_shift_error: "Lỗi khi lưu ca làm việc",
    delete_shift_error: "Lỗi khi xóa ca làm việc",
    shift_applied: "Đã áp dụng ca làm việc thành công",
    shift_applied_error: "Lỗi khi áp dụng ca làm việc",
    shift_apply_error: "Lỗi khi áp dụng ca làm việc",
  },
};

// Add all the translations that were missing in the screenshots
const translations = {
  en: {
    // Existing translations...
    work_completed: "Work Completed",
    shifts_title: "Shifts",
    shift_start_time: "Start Time",
    shift_end_time: "End Time",
    departure_time: "Departure Time",
    // Add any other missing translations
  },
  vi: {
    // Existing translations...
    work_completed: "Hoàn thành công việc",
    shifts_title: "Ca làm việc",
    shift_start_time: "Giờ bắt đầu",
    shift_end_time: "Giờ kết thúc",
    departure_time: "Giờ khởi hành",
    // Add any other missing translations
  },
};

i18n.translations = translations;
i18n.fallbacks = true;
i18n.defaultLocale = "en";

// Make sure this is set from stored preference if available
const setDefaultLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem("userLanguage");
    if (storedLanguage) {
      i18n.locale = storedLanguage;
    } else {
      i18n.locale = "en";
    }
  } catch (error) {
    console.error("Error setting default language:", error);
    i18n.locale = "en";
  }
};

setDefaultLanguage();

export default i18n;
export { loadStoredLanguage, setAppLanguage };
