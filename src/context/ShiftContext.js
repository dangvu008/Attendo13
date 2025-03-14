import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays, parseISO, differenceInMinutes, differenceInHours, subDays } from 'date-fns';
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
  const [notes, setNotes] = useState([]);
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

  // Save notes to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('notes', JSON.stringify(notes));
    }
  }, [notes, isLoading]);

  // Add a new shift
  const addShift = async (newShift) => {
    const updatedShifts = [...shifts, { ...newShift, id: Date.now().toString() }];
    setShifts(updatedShifts);
  };

  // Update an existing shift
  const updateShift = async (updatedShift) => {
    const updatedShifts = shifts.map(shift => 
      shift.id === updatedShift.id ? updatedShift : shift
    );
    setShifts(updatedShifts);
  };

  // Delete a shift
  const deleteShift = async (shiftId) => {
    const updatedShifts = shifts.filter(shift => shift.id !== shiftId);
    setShifts(updatedShifts);
    
    // If the deleted shift was the current one, reset current shift
    if (currentShift && currentShift.id === shiftId) {
      setCurrentShift(null);
    }
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
      timestamp: timestamp.getTime()
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

  // Reset the current day's work status
  const resetDayStatus = () => {
    setWorkStatus('inactive');
    
    // Update the weekly status for today to be a question mark
    const today = format(new Date(), 'yyyy-MM-dd');
    setWeeklyStatus(prev => ({
      ...prev,
      [today]: '?'
    }));
    
    // Add a reset entry to history
    const timestamp = new Date();
    const formattedDate = format(timestamp, 'yyyy-MM-dd');
    const formattedTime = format(timestamp, 'HH:mm:ss');
    
    const historyEntry = {
      id: Date.now().toString(),
      status: 'reset',
      date: formattedDate,
      time: formattedTime,
      timestamp: timestamp.getTime()
    };
    
    setStatusHistory(prev => [historyEntry, ...prev]);
  };

  // Get today's status from history
  const getTodayStatus = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayEntries = statusHistory.filter(entry => entry.date === today);
    return todayEntries;
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

  return (
    <ShiftContext.Provider value={{
      shifts,
      currentShift,
      workStatus,
      statusHistory,
      weeklyStatus,
      notes,
      isLoading,
      addShift,
      updateShift,
      deleteShift,
      applyShift,
      updateWorkStatus,
      updateWeeklyStatus,
      manualUpdateWeeklyStatus,
      addNote,
      updateNote,
      deleteNote,
      resetDayStatus,
      getTodayStatus,
      validateAction
    }}>
      {children}
    </ShiftContext.Provider>
  );
};
