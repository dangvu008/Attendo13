import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, isToday, parseISO, isBefore, isAfter, addMinutes, differenceInMinutes, addDays, isSameDay, endOfMonth } from 'date-fns';
import { vi } from '../utils/viLocale';
import * as NotificationService from '../services/NotificationService';
import { useLocalization } from './LocalizationContext';

const ShiftContext = createContext();

export const useShift = () => useContext(ShiftContext);

export const ShiftProvider = ({ children }) => {
  const { t } = useLocalization();
  const [shifts, setShifts] = useState([]);
  const [currentShift, setCurrentShift] = useState(null);
  const [workStatus, setWorkStatus] = useState('inactive'); // inactive, go_work, check_in, check_out, complete
  const [statusHistory, setStatusHistory] = useState([]);
  const [weeklyStatus, setWeeklyStatus] = useState({});
  const [statusDetails, setStatusDetails] = useState({});
  const [notes, setNotes] = useState([]);
  const [workEntries, setWorkEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from storage on initial render
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load shifts
        const shiftsData = await AsyncStorage.getItem('shifts');
        if (shiftsData) {
          setShifts(JSON.parse(shiftsData));
        } else {
          // Create default shifts if none exist
          const defaultShifts = createDefaultShifts();
          setShifts(defaultShifts);
          await AsyncStorage.setItem('shifts', JSON.stringify(defaultShifts));
        }

        // Load current shift
        const currentShiftData = await AsyncStorage.getItem('currentShift');
        if (currentShiftData) {
          setCurrentShift(JSON.parse(currentShiftData));
        } else {
          // Set default current shift
          const defaultShift = createDefaultShifts()[0];
          setCurrentShift(defaultShift);
          await AsyncStorage.setItem('currentShift', JSON.stringify(defaultShift));
        }

        // Load work status
        const workStatusData = await AsyncStorage.getItem('workStatus');
        if (workStatusData) {
          setWorkStatus(workStatusData);
        }

        // Load status history
        const statusHistoryData = await AsyncStorage.getItem('statusHistory');
        if (statusHistoryData) {
          setStatusHistory(JSON.parse(statusHistoryData));
        } else {
          // Create fake status history if none exists
          const fakeHistory = createFakeStatusHistory();
          setStatusHistory(fakeHistory);
          await AsyncStorage.setItem('statusHistory', JSON.stringify(fakeHistory));
        }

        // Load weekly status
        const weeklyStatusData = await AsyncStorage.getItem('weeklyStatus');
        if (weeklyStatusData) {
          setWeeklyStatus(JSON.parse(weeklyStatusData));
        } else {
          // Create fake weekly status if none exists
          const fakeWeeklyStatus = createFakeWeeklyStatus();
          setWeeklyStatus(fakeWeeklyStatus);
          await AsyncStorage.setItem('weeklyStatus', JSON.stringify(fakeWeeklyStatus));
        }

        // Load status details
        const statusDetailsData = await AsyncStorage.getItem('statusDetails');
        if (statusDetailsData) {
          setStatusDetails(JSON.parse(statusDetailsData));
        }

        // Load notes
        const notesData = await AsyncStorage.getItem('notes');
        if (notesData) {
          setNotes(JSON.parse(notesData));
        } else {
          // Create fake notes if none exist
          const fakeNotes = createFakeNotes();
          setNotes(fakeNotes);
          await AsyncStorage.setItem('notes', JSON.stringify(fakeNotes));
        }
        
        // Load work entries for monthly stats
        const workEntriesData = await AsyncStorage.getItem('workEntries');
        if (workEntriesData) {
          setWorkEntries(JSON.parse(workEntriesData));
        } else {
          // Create fake work entries if none exist
          const fakeWorkEntries = createFakeWorkEntries();
          setWorkEntries(fakeWorkEntries);
          await AsyncStorage.setItem('workEntries', JSON.stringify(fakeWorkEntries));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Create default shifts
  const createDefaultShifts = () => {
    return [
      {
        id: '1',
        name: 'Ca Ngày',
        startWorkTime: '08:00',
        endWorkTime: '17:00',
        departureTime: '07:00',
        remindBeforeWork: 30, // minutes
        remindAfterWork: 15, // minutes
        showSignButton: true,
        isActive: true,
        appliedDays: [1, 2, 3, 4, 5] // Monday to Friday
      },
      {
        id: '2',
        name: 'Ca Đêm',
        startWorkTime: '19:00',
        endWorkTime: '04:00',
        departureTime: '18:00',
        remindBeforeWork: 30,
        remindAfterWork: 15,
        showSignButton: true,
        isActive: false,
        appliedDays: [1, 2, 3, 4, 5]
      },
      {
        id: '3',
        name: 'Ca Hành Chính',
        startWorkTime: '08:00',
        endWorkTime: '17:30',
        departureTime: '07:15',
        remindBeforeWork: 45,
        remindAfterWork: 15,
        showSignButton: true,
        isActive: false,
        appliedDays: [1, 2, 3, 4, 5]
      },
      {
        id: '4',
        name: 'Ca 1',
        startWorkTime: '06:00',
        endWorkTime: '14:00',
        departureTime: '05:15',
        remindBeforeWork: 30,
        remindAfterWork: 15,
        showSignButton: true,
        isActive: false,
        appliedDays: [1, 2, 3, 4, 5, 6]
      },
      {
        id: '5',
        name: 'Ca 2',
        startWorkTime: '14:00',
        endWorkTime: '22:00',
        departureTime: '13:15',
        remindBeforeWork: 30,
        remindAfterWork: 15,
        showSignButton: true,
        isActive: false,
        appliedDays: [1, 2, 3, 4, 5, 6]
      },
      {
        id: '6',
        name: 'Ca 3',
        startWorkTime: '22:00',
        endWorkTime: '06:00',
        departureTime: '21:15',
        remindBeforeWork: 30,
        remindAfterWork: 15,
        showSignButton: true,
        isActive: false,
        appliedDays: [1, 2, 3, 4, 5, 6]
      }
    ];
  };

  // Create fake status history
  const createFakeStatusHistory = () => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    const twoDaysAgo = subDays(today, 2);
    
    // Format dates for history entries
    const todayFormatted = format(today, 'yyyy-MM-dd');
    const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd');
    const twoDaysAgoFormatted = format(twoDaysAgo, 'yyyy-MM-dd');
    
    return [
      // Today's history entries (if morning, make just go_work, if afternoon, add check_in)
      {
        id: '1',
        status: 'go_work',
        date: todayFormatted,
        time: format(subDays(new Date(), 0), 'HH:mm:ss'),
        timestamp: subDays(new Date(), 0).getTime()
      },
      // Yesterday's complete history
      {
        id: '2',
        status: 'go_work',
        date: yesterdayFormatted,
        time: '07:45:22',
        timestamp: new Date(yesterdayFormatted + 'T07:45:22').getTime()
      },
      {
        id: '3',
        status: 'check_in',
        date: yesterdayFormatted,
        time: '08:05:10',
        timestamp: new Date(yesterdayFormatted + 'T08:05:10').getTime()
      },
      {
        id: '4',
        status: 'check_out',
        date: yesterdayFormatted,
        time: '17:15:33',
        timestamp: new Date(yesterdayFormatted + 'T17:15:33').getTime()
      },
      {
        id: '5',
        status: 'complete',
        date: yesterdayFormatted,
        time: '17:20:15',
        timestamp: new Date(yesterdayFormatted + 'T17:20:15').getTime()
      },
      // Two days ago with incomplete history (missing check_out)
      {
        id: '6',
        status: 'go_work',
        date: twoDaysAgoFormatted,
        time: '07:50:42',
        timestamp: new Date(twoDaysAgoFormatted + 'T07:50:42').getTime()
      },
      {
        id: '7',
        status: 'check_in',
        date: twoDaysAgoFormatted,
        time: '08:02:19',
        timestamp: new Date(twoDaysAgoFormatted + 'T08:02:19').getTime()
      },
    ];
  };

  // Create fake weekly status
  const createFakeWeeklyStatus = () => {
    const today = new Date();
    const weeklyStatus = {};
    
    // Fill past 7 days with different statuses
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dateKey = format(day, 'yyyy-MM-dd');
      
      if (i === 0) {
        // Today - default to ? or current status if exists
        weeklyStatus[dateKey] = '?';
      } else if (i === 1) {
        // Yesterday - complete
        weeklyStatus[dateKey] = '✓';
      } else if (i === 2) {
        // 2 days ago - incomplete
        weeklyStatus[dateKey] = '!';
      } else if (i === 3) {
        // 3 days ago - vacation
        weeklyStatus[dateKey] = 'P';
      } else if (i === 4) {
        // 4 days ago - sick
        weeklyStatus[dateKey] = 'B';
      } else if (i === 5) {
        // 5 days ago - came late
        weeklyStatus[dateKey] = 'RV';
      } else if (i === 6) {
        // 6 days ago - absent
        weeklyStatus[dateKey] = 'X';
      }
    }
    
    return weeklyStatus;
  };

  // Create fake notes
  const createFakeNotes = () => {
    const now = new Date();
    
    return [
      {
        id: '1',
        title: 'Họp nhóm dự án',
        content: 'Chuẩn bị tài liệu báo cáo tiến độ và các vấn đề gặp phải trong quá trình phát triển.',
        reminderTime: addDays(now, 1).toISOString(),
        weekDays: [1, 3, 5], // Monday, Wednesday, Friday
        createdAt: now.toISOString()
      },
      {
        id: '2',
        title: 'Kiểm tra hệ thống bảo mật',
        content: 'Rà soát lại các lỗ hổng bảo mật tiềm ẩn và cập nhật phiên bản mới nhất của các thư viện.',
        reminderTime: addDays(now, 2).toISOString(),
        weekDays: [2, 4], // Tuesday, Thursday
        createdAt: subDays(now, 1).toISOString()
      },
      {
        id: '3',
        title: 'Ghi chú 2',
        content: 'deoeolkfjldddddddd',
        reminderTime: addDays(now, 3).toISOString(),
        weekDays: [5, 6], // Friday, Saturday
        createdAt: subDays(now, 2).toISOString()
      },
      {
        id: '4',
        title: 'Ghi vhu',
        content: 'contentntnt',
        reminderTime: addDays(now, 4).toISOString(),
        weekDays: [0, 1, 6], // Sunday, Monday, Saturday
        createdAt: subDays(now, 3).toISOString()
      },
    ];
  };

  // Create fake work entries for monthly statistics
  const createFakeWorkEntries = () => {
    const today = new Date();
    const entries = [];
    
    // Create entries for the past 30 days
    for (let i = 0; i < 30; i++) {
      const date = subDays(today, i);
      const dayOfWeek = getDay(date);
      
      // Skip weekends with 80% probability
      if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() < 0.8) {
        continue;
      }
      
      // Random check-in time between 7:00 and 9:00
      const checkInHour = 7 + Math.floor(Math.random() * 2);
      const checkInMinute = Math.floor(Math.random() * 60);
      
      // Random check-out time between 17:00 and 19:00
      const checkOutHour = 17 + Math.floor(Math.random() * 2);
      const checkOutMinute = Math.floor(Math.random() * 60);
      
      // Random OT hours
      const hasOT = Math.random() < 0.4;
      
      const entry = {
        id: `entry-${date.getTime()}`,
        date: format(date, 'yyyy-MM-dd'),
        checkIn: `${checkInHour.toString().padStart(2, '0')}:${checkInMinute.toString().padStart(2, '0')}`,
        checkOut: `${checkOutHour.toString().padStart(2, '0')}:${checkOutMinute.toString().padStart(2, '0')}`,
        regularHours: 8,
        otHours: hasOT ? {
          ot150: hasOT ? parseFloat((Math.random() * 2).toFixed(1)) : 0,
          ot200: hasOT && Math.random() < 0.3 ? parseFloat((Math.random() * 1.5).toFixed(1)) : 0,
          ot300: hasOT && Math.random() < 0.1 ? parseFloat((Math.random() * 1).toFixed(1)) : 0
        } : null
      };
      
      entries.push(entry);
    }
    
    return entries;
  };

  // Get work entries for a specific month
  const getMonthlyWorkEntries = (date) => {
    const targetMonth = date.getMonth();
    const targetYear = date.getFullYear();
    
    return workEntries.filter(entry => {
      const entryDate = parseISO(entry.date);
      return entryDate.getMonth() === targetMonth && entryDate.getFullYear() === targetYear;
    });
  };

  // Add a new work entry
  const addWorkEntry = async (entry) => {
    try {
      const newEntry = {
        id: `entry-${new Date().getTime()}`,
        ...entry
      };
      
      const updatedEntries = [...workEntries, newEntry];
      setWorkEntries(updatedEntries);
      await AsyncStorage.setItem('workEntries', JSON.stringify(updatedEntries));
      
      return true;
    } catch (error) {
      console.error('Error adding work entry:', error);
      return false;
    }
  };

  // Update a work entry
  const updateWorkEntry = async (id, updatedData) => {
    try {
      const updatedEntries = workEntries.map(entry => 
        entry.id === id ? { ...entry, ...updatedData } : entry
      );
      
      setWorkEntries(updatedEntries);
      await AsyncStorage.setItem('workEntries', JSON.stringify(updatedEntries));
      
      return true;
    } catch (error) {
      console.error('Error updating work entry:', error);
      return false;
    }
  };

  // Delete a work entry
  const deleteWorkEntry = async (id) => {
    try {
      const updatedEntries = workEntries.filter(entry => entry.id !== id);
      
      setWorkEntries(updatedEntries);
      await AsyncStorage.setItem('workEntries', JSON.stringify(updatedEntries));
      
      return true;
    } catch (error) {
      console.error('Error deleting work entry:', error);
      return false;
    }
  };

  // Save shifts to storage whenever they change
  useEffect(() => {
    if (!isLoading && shifts.length > 0) {
      AsyncStorage.setItem('shifts', JSON.stringify(shifts));
    }
  }, [shifts, isLoading]);

  // Save current shift to storage whenever it changes
  useEffect(() => {
    if (!isLoading && currentShift) {
      AsyncStorage.setItem('currentShift', JSON.stringify(currentShift));
    }
  }, [currentShift, isLoading]);

  // Save work status to storage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('workStatus', workStatus);
    }
  }, [workStatus, isLoading]);

  // Save status history to storage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('statusHistory', JSON.stringify(statusHistory));
    }
  }, [statusHistory, isLoading]);

  // Save weekly status to storage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('weeklyStatus', JSON.stringify(weeklyStatus));
    }
  }, [weeklyStatus, isLoading]);

  // Save status details to storage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('statusDetails', JSON.stringify(statusDetails));
    }
  }, [statusDetails, isLoading]);

  // Save notes to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('notes', JSON.stringify(notes));
    }
  }, [notes, isLoading]);

  // Save work entries to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('workEntries', JSON.stringify(workEntries));
    }
  }, [workEntries, isLoading]);

  // Update a shift
  const updateShift = async (shiftId, updatedShift) => {
    try {
      const updatedShifts = shifts.map(shift => 
        shift.id === shiftId ? { ...shift, ...updatedShift } : shift
      );
      setShifts(updatedShifts);
      await AsyncStorage.setItem('shifts', JSON.stringify(updatedShifts));
      
      // If this is the current shift, update it
      if (currentShift && currentShift.id === shiftId) {
        const updatedCurrentShift = { ...currentShift, ...updatedShift };
        setCurrentShift(updatedCurrentShift);
        await AsyncStorage.setItem('currentShift', JSON.stringify(updatedCurrentShift));
        
        // Update reminders for the current shift
        const settings = await NotificationService.loadNotificationSettings();
        if (settings.reminderType !== 'none') {
          await NotificationService.scheduleShiftReminders(
            updatedCurrentShift, 
            settings.reminderType
          );
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating shift:', error);
      return false;
    }
  };

  // Set the current shift and schedule reminders
  const setCurrentShiftAndScheduleReminders = async (shift) => {
    try {
      // Cancel any existing reminders
      await NotificationService.cancelAllShiftNotifications();
      
      // Update current shift
      setCurrentShift(shift);
      await AsyncStorage.setItem('currentShift', JSON.stringify(shift));
      
      // Schedule new reminders if enabled
      const settings = await NotificationService.loadNotificationSettings();
      if (settings.reminderType !== 'none') {
        await NotificationService.scheduleShiftReminders(
          shift, 
          settings.reminderType
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error setting current shift:', error);
      return false;
    }
  };

  // Reset work status and clear reminders
  const resetWorkStatus = async () => {
    try {
      // Cancel reminders
      await NotificationService.cancelAllShiftNotifications();
      
      // Reset status
      setWorkStatus('inactive');
      await AsyncStorage.setItem('workStatus', 'inactive');
      
      // Update status details
      const newStatusDetails = { ...statusDetails };
      newStatusDetails[format(new Date(), 'yyyy-MM-dd')] = {
        status: 'inactive',
        timestamp: new Date().toISOString(),
      };
      setStatusDetails(newStatusDetails);
      await AsyncStorage.setItem('statusDetails', JSON.stringify(newStatusDetails));
      
      return true;
    } catch (error) {
      console.error('Error resetting work status:', error);
      return false;
    }
  };

  // Add a new shift
  const addShift = async (newShift) => {
    try {
      // Xác thực dữ liệu trước khi thêm
      if (!validateShiftData(newShift)) {
        return false;
      }
      
      const shiftToAdd = { 
        ...newShift, 
        id: Date.now().toString(),
        // Đảm bảo các trường mới luôn có giá trị mặc định nếu không có
        departureTime: newShift.departureTime || '',
        remindBeforeWork: newShift.remindBeforeWork || 15,
        remindAfterWork: newShift.remindAfterWork || 15,
        showSignButton: newShift.showSignButton !== undefined ? newShift.showSignButton : true,
        appliedDays: newShift.appliedDays || [1, 2, 3, 4, 5]
      };
      
      const updatedShifts = [...shifts, shiftToAdd];
      setShifts(updatedShifts);
      await AsyncStorage.setItem('shifts', JSON.stringify(updatedShifts));
      return true;
    } catch (error) {
      console.error('Error adding shift:', error);
      return false;
    }
  };

  // Delete a shift
  const deleteShift = async (shiftId) => {
    try {
      // Kiểm tra xem có phải đang xóa ca làm việc hiện tại không
      const isCurrentShift = shifts.find(shift => shift.id === shiftId && shift.active);
      
      const updatedShifts = shifts.filter(shift => shift.id !== shiftId);
      setShifts(updatedShifts);
      await AsyncStorage.setItem('shifts', JSON.stringify(updatedShifts));
      
      // Nếu xóa ca làm việc hiện tại, đặt ca đầu tiên trong danh sách làm ca hiện tại
      if (isCurrentShift && updatedShifts.length > 0) {
        const newCurrentShift = { ...updatedShifts[0], active: true };
        const finalShifts = updatedShifts.map((shift, index) => 
          index === 0 ? newCurrentShift : { ...shift, active: false }
        );
        
        setShifts(finalShifts);
        setCurrentShift(newCurrentShift);
        await AsyncStorage.setItem('shifts', JSON.stringify(finalShifts));
        await AsyncStorage.setItem('currentShift', JSON.stringify(newCurrentShift));
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting shift:', error);
      return false;
    }
  };

  // Validate shift data
  const validateShiftData = (shift) => {
    // Kiểm tra các trường bắt buộc
    if (!shift.name || !shift.name.trim()) {
      return false;
    }
    
    if (!shift.startWorkTime || !shift.endWorkTime) {
      return false;
    }
    
    // Kiểm tra tên ca làm việc (không chứa ký tự đặc biệt)
    const specialCharsRegex = /[^\p{L}\p{N}\s.,\-_()]/u;
    if (specialCharsRegex.test(shift.name)) {
      return false;
    }
    
    // Kiểm tra độ dài tên ca làm việc
    if (shift.name.length > 200) {
      return false;
    }
    
    // Kiểm tra tên ca làm việc trùng lặp
    const existingShift = shifts.find(s => 
      s.name.toLowerCase() === shift.name.toLowerCase() && s.id !== shift.id
    );
    
    if (existingShift) {
      return false;
    }
    
    return true;
  };

  // Kiểm tra ca làm việc trùng lặp
  const isDuplicateShift = (shift) => {
    return shifts.some(s => {
      // Bỏ qua chính nó
      if (s.id === shift.id) {
        return false;
      }
      
      // So sánh tất cả các thuộc tính quan trọng
      const isSameTime = 
        s.startWorkTime === shift.startWorkTime &&
        s.endWorkTime === shift.endWorkTime &&
        s.departureTime === shift.departureTime;
      
      const isSameSettings = 
        s.remindBeforeWork === shift.remindBeforeWork &&
        s.remindAfterWork === shift.remindAfterWork &&
        s.showSignButton === shift.showSignButton;
      
      const isSameAppliedDays = 
        JSON.stringify(s.appliedDays || []) === JSON.stringify(shift.appliedDays || []);
      
      return isSameTime && isSameSettings && isSameAppliedDays;
    });
  };

  // Apply a shift for the current week
  const applyShift = async (shiftId) => {
    // Set all shifts to inactive
    const updatedShifts = shifts.map(shift => ({
      ...shift,
      isActive: shift.id === shiftId
    }));
    
    setShifts(updatedShifts);
    
    // Set the current shift
    const selectedShift = updatedShifts.find(shift => shift.id === shiftId);
    setCurrentShift(selectedShift);
  };

  // Update work status and record in history
  const updateWorkStatus = (newStatus) => {
    const timestamp = new Date();
    const formattedDate = format(timestamp, 'yyyy-MM-dd');
    const formattedTime = format(timestamp, 'HH:mm:ss');
    
    // Update status
    setWorkStatus(newStatus);
    
    // Record in history
    const historyEntry = {
      id: Date.now().toString(),
      status: newStatus,
      date: formattedDate,
      time: formattedTime,
      timestamp: timestamp.toISOString()
    };
    
    setStatusHistory(prev => [historyEntry, ...prev]);
    
    // Update weekly status
    updateWeeklyStatus(newStatus, formattedDate);
  };

  // Update the weekly status grid
  const updateWeeklyStatus = (status, date) => {
    let newStatus = '?'; // Default status
    
    switch (status) {
      case 'go_work':
        newStatus = '!'; // Started work but not checked in yet
        break;
      case 'check_in':
        newStatus = '!'; // Checked in but not checked out yet
        break;
      case 'check_out':
        newStatus = '✓'; // Completed work day
        break;
      case 'complete':
        newStatus = '✓'; // Completed with sign-off
        break;
      default:
        newStatus = '?';
    }
    
    setWeeklyStatus(prev => ({
      ...prev,
      [date]: newStatus
    }));
  };

  // Update the weekly status based on status history
  const updateWeeklyStatusFromHistory = async (history) => {
    try {
      const newWeeklyStatus = { ...weeklyStatus };
      const newStatusDetails = { ...statusDetails };
      
      // Process status history
      history.forEach(entry => {
        const date = new Date(entry.timestamp);
        const dateKey = format(date, 'yyyy-MM-dd');
        
        // Skip future dates
        if (date > new Date()) return;
        
        // Process depending on status
        if (entry.status === 'complete') {
          newWeeklyStatus[dateKey] = '✓'; // Full work day completed
        } else if (entry.status === 'check_out') {
          // Check if both check-in and check-out exist
          const hasCheckIn = history.some(h => 
            h.status === 'check_in' && 
            format(new Date(h.timestamp), 'yyyy-MM-dd') === dateKey
          );
          
          if (hasCheckIn) {
            newWeeklyStatus[dateKey] = '✓'; // Full day
          } else {
            newWeeklyStatus[dateKey] = '!'; // Missing check-in
          }
        } else if (entry.status === 'check_in') {
          if (!newWeeklyStatus[dateKey] || newWeeklyStatus[dateKey] === '?') {
            newWeeklyStatus[dateKey] = 'RV'; // Checked in but not out yet
          }
        } else if (entry.status === 'go_work') {
          if (!newWeeklyStatus[dateKey] || newWeeklyStatus[dateKey] === '?') {
            newWeeklyStatus[dateKey] = '!'; // Started but incomplete
          }
        }
        
        // Update status details for this date
        if (!newStatusDetails[dateKey]) {
          newStatusDetails[dateKey] = {
            checkInTime: null,
            checkOutTime: null,
            totalHours: null,
            note: null
          };
        }
        
        // Update specific time details
        if (entry.status === 'check_in') {
          newStatusDetails[dateKey].checkInTime = format(new Date(entry.timestamp), 'HH:mm');
        } else if (entry.status === 'check_out') {
          newStatusDetails[dateKey].checkOutTime = format(new Date(entry.timestamp), 'HH:mm');
          
          // Calculate total hours if we have both check-in and check-out
          const checkInEntry = history.find(h => 
            h.status === 'check_in' && 
            format(new Date(h.timestamp), 'yyyy-MM-dd') === dateKey
          );
          
          if (checkInEntry) {
            const checkInTime = new Date(checkInEntry.timestamp);
            const checkOutTime = new Date(entry.timestamp);
            const hours = differenceInHours(checkOutTime, checkInTime);
            const minutes = differenceInMinutes(checkOutTime, checkInTime) % 60;
            
            newStatusDetails[dateKey].totalHours = `${hours}h ${minutes}m`;
          }
        }
      });
      
      setWeeklyStatus(newWeeklyStatus);
      setStatusDetails(newStatusDetails);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('weeklyStatus', JSON.stringify(newWeeklyStatus));
      await AsyncStorage.setItem('statusDetails', JSON.stringify(newStatusDetails));
      
    } catch (error) {
      console.error('Error updating weekly status:', error);
    }
  };

  // Update manual status for a specific date
  const updateDayStatus = async (date, status) => {
    try {
      const newWeeklyStatus = { ...weeklyStatus };
      newWeeklyStatus[date] = status;
      
      setWeeklyStatus(newWeeklyStatus);
      await AsyncStorage.setItem('weeklyStatus', JSON.stringify(newWeeklyStatus));
      return true;
    } catch (error) {
      console.error('Error updating day status:', error);
      return false;
    }
  };

  // Add a new note
  const addNote = (note) => {
    const newNote = {
      id: Date.now().toString(),
      ...note,
      createdAt: new Date().toISOString()
    };
    
    setNotes(prev => [newNote, ...prev]);
  };

  // Update an existing note
  const updateNote = (updatedNote) => {
    setNotes(prev => 
      prev.map(note => note.id === updatedNote.id ? updatedNote : note)
    );
  };

  // Delete a note
  const deleteNote = (noteId) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  // Cập nhật thông tin chi tiết trạng thái
  const updateStatusDetails = (date, details) => {
    try {
      const formattedDate = typeof date === 'string' ? date : format(date || new Date(), 'yyyy-MM-dd');
      
      // Cập nhật trạng thái chi tiết
      const updatedDetails = {
        ...(statusDetails[formattedDate] || {}),
        ...details,
        lastUpdated: new Date().toISOString()
      };
      
      // Cập nhật state
      const newStatusDetails = {
        ...statusDetails,
        [formattedDate]: updatedDetails
      };
      
      setStatusDetails(newStatusDetails);
      
      // Lưu vào storage
      AsyncStorage.setItem('statusDetails', JSON.stringify(newStatusDetails));
      
      return true;
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin chi tiết:', error);
      return false;
    }
  };

  // New function: getMonthlyWorkStats
  const getMonthlyWorkStats = (year, month) => {
    // Calculate statistics for each day of the specified month
    const startDate = new Date(year, month - 1, 1);
    const endDate = endOfMonth(startDate);
    let stats = [];
    let current = startDate;
    while (current <= endDate) {
      // Assuming workEntries is available in the context state and each entry has a 'date' field in ISO format
      let count = workEntries.filter(entry => {
        return isSameDay(parseISO(entry.date), current);
      }).length;
      stats.push({
        date: format(current, 'dd/MM/yyyy'),
        count: count
      });
      current = addDays(current, 1);
    }
    return stats;
  };

  // Check into shift function
  const checkIntoShift = () => {
    const now = new Date();
    
    // Update work status to checked in
    updateWorkStatus('check_in');
    
    // Create a new entry for the current date
    const formattedDate = format(now, 'yyyy-MM-dd');
    const newDetails = {
      ...(statusDetails[formattedDate] || {}),
      checkInTime: now.toISOString(),
      status: 'check_in'
    };
    
    // Update status details
    setStatusDetails(prev => ({
      ...prev,
      [formattedDate]: newDetails
    }));
    
    // Save to storage
    AsyncStorage.setItem('statusDetails', JSON.stringify({
      ...statusDetails,
      [formattedDate]: newDetails
    }));
    
    return true;
  };
  
  // Check out from shift function
  const checkOutFromShift = () => {
    const now = new Date();
    
    // Update work status to checked out
    updateWorkStatus('check_out');
    
    // Create a new entry for the current date
    const formattedDate = format(now, 'yyyy-MM-dd');
    const todayDetails = statusDetails[formattedDate] || {};
    
    const newDetails = {
      ...todayDetails,
      checkOutTime: now.toISOString(),
      status: 'check_out'
    };
    
    // Calculate work duration if check-in time exists
    if (todayDetails.checkInTime) {
      const checkInTime = parseISO(todayDetails.checkInTime);
      const workDurationMinutes = differenceInMinutes(now, checkInTime);
      newDetails.workDurationMinutes = workDurationMinutes;
    }
    
    // Update status details
    setStatusDetails(prev => ({
      ...prev,
      [formattedDate]: newDetails
    }));
    
    // Save to storage
    AsyncStorage.setItem('statusDetails', JSON.stringify({
      ...statusDetails,
      [formattedDate]: newDetails
    }));
    
    return true;
  };
  
  // Complete the shift (sign off)
  const completeShift = () => {
    const now = new Date();
    
    // Update work status to complete
    updateWorkStatus('complete');
    
    // Create a new entry for the current date
    const formattedDate = format(now, 'yyyy-MM-dd');
    const todayDetails = statusDetails[formattedDate] || {};
    
    const newDetails = {
      ...todayDetails,
      completeTime: now.toISOString(),
      status: 'complete'
    };
    
    // Update status details
    setStatusDetails(prev => ({
      ...prev,
      [formattedDate]: newDetails
    }));
    
    // Save to storage
    AsyncStorage.setItem('statusDetails', JSON.stringify({
      ...statusDetails,
      [formattedDate]: newDetails
    }));
    
    return true;
  };

  // Get today's status from history
  const getTodayStatus = () => {
    const today = new Date();
    // Filter status history for today's entries and sort by latest first
    return statusHistory
      .filter(entry => isToday(parseISO(entry.timestamp)))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // Validate actions based on time differences
  const validateAction = (action, lastActionTimestamp) => {
    if (!lastActionTimestamp) return true;
    
    const now = new Date();
    const lastTime = new Date(lastActionTimestamp);
    
    if (action === 'check_in' && differenceInMinutes(now, lastTime) < 5) {
      return false; // Less than 5 minutes since last action
    }
    
    if (action === 'check_out' && differenceInHours(now, lastTime) < 2) {
      return false; // Less than 2 hours since check in
    }
    
    return true;
  };

  // Manual update of weekly status (for grid interactions)
  const manualUpdateWeeklyStatus = (date, status) => {
    setWeeklyStatus(prev => ({
      ...prev,
      [date]: status
    }));
  };

  // Reset day status
  const resetDayStatus = (date) => {
    try {
      const formattedDate = typeof date === 'string' ? date : format(date || new Date(), 'yyyy-MM-dd');
      
      // Remove the status for this day
      const newStatusDetails = { ...statusDetails };
      delete newStatusDetails[formattedDate];
      
      // Update state
      setStatusDetails(newStatusDetails);
      
      // Remove from weekly status grid
      const newWeeklyStatus = { ...weeklyStatus };
      delete newWeeklyStatus[formattedDate];
      setWeeklyStatus(newWeeklyStatus);
      
      // Update storage
      AsyncStorage.setItem('statusDetails', JSON.stringify(newStatusDetails));
      AsyncStorage.setItem('weeklyStatus', JSON.stringify(newWeeklyStatus));
      
      // If today, also reset work status
      if (isToday(typeof date === 'string' ? parseISO(date) : (date || new Date()))) {
        setWorkStatus('inactive');
        AsyncStorage.setItem('workStatus', 'inactive');
      }
      
      return true;
    } catch (error) {
      console.error('Lỗi khi reset trạng thái:', error);
      return false;
    }
  };

  return (
    <ShiftContext.Provider
      value={{
        workStatus,
        statusHistory,
        statusDetails,
        weeklyStatus,
        notes,
        currentShift,
        updateWorkStatus,
        getTodayStatus,
        validateAction,
        getMonthlyWorkStats,
        checkIntoShift, 
        checkOutFromShift,
        completeShift,
        updateWorkStatus,
        updateStatusDetails,
        resetDayStatus,
        addNote,
        updateNote,
        deleteNote,
        setCurrentShift,
        manualUpdateWeeklyStatus,
        workEntries,
        getTodayStatus
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
};

export default ShiftProvider;
