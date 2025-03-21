import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  SHIFTS: "shifts",
  CURRENT_SHIFT: "currentShift",
  WORK_STATUS: "workStatus",
  STATUS_HISTORY: "statusHistory",
  WEEKLY_STATUS: "weeklyStatus",
  STATUS_DETAILS: "statusDetails",
  NOTES: "notes",
  WORK_ENTRIES: "workEntries",
};

class DatabaseService {
  // Shifts
  static async getShifts() {
    try {
      const shiftsData = await AsyncStorage.getItem(STORAGE_KEYS.SHIFTS);
      return shiftsData ? JSON.parse(shiftsData) : [];
    } catch (error) {
      console.error("Error getting shifts:", error);
      throw error;
    }
  }

  static async saveShifts(shifts) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
    } catch (error) {
      console.error("Error saving shifts:", error);
      throw error;
    }
  }

  static async getCurrentShift() {
    try {
      const currentShiftData = await AsyncStorage.getItem(
        STORAGE_KEYS.CURRENT_SHIFT
      );
      return currentShiftData ? JSON.parse(currentShiftData) : null;
    } catch (error) {
      console.error("Error getting current shift:", error);
      throw error;
    }
  }

  static async saveCurrentShift(shift) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CURRENT_SHIFT,
        JSON.stringify(shift)
      );
    } catch (error) {
      console.error("Error saving current shift:", error);
      throw error;
    }
  }

  // Work Status
  static async getWorkStatus() {
    try {
      return (
        (await AsyncStorage.getItem(STORAGE_KEYS.WORK_STATUS)) || "inactive"
      );
    } catch (error) {
      console.error("Error getting work status:", error);
      throw error;
    }
  }

  static async saveWorkStatus(status) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WORK_STATUS, status);
    } catch (error) {
      console.error("Error saving work status:", error);
      throw error;
    }
  }

  // Status History
  static async getStatusHistory() {
    try {
      const historyData = await AsyncStorage.getItem(
        STORAGE_KEYS.STATUS_HISTORY
      );
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error("Error getting status history:", error);
      throw error;
    }
  }

  static async saveStatusHistory(history) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.STATUS_HISTORY,
        JSON.stringify(history)
      );
    } catch (error) {
      console.error("Error saving status history:", error);
      throw error;
    }
  }

  // Weekly Status
  static async getWeeklyStatus() {
    try {
      const weeklyData = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_STATUS);
      return weeklyData ? JSON.parse(weeklyData) : {};
    } catch (error) {
      console.error("Error getting weekly status:", error);
      throw error;
    }
  }

  static async saveWeeklyStatus(weeklyStatus) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.WEEKLY_STATUS,
        JSON.stringify(weeklyStatus)
      );
    } catch (error) {
      console.error("Error saving weekly status:", error);
      throw error;
    }
  }

  // Status Details
  static async getStatusDetails() {
    try {
      const detailsData = await AsyncStorage.getItem(
        STORAGE_KEYS.STATUS_DETAILS
      );
      return detailsData ? JSON.parse(detailsData) : {};
    } catch (error) {
      console.error("Error getting status details:", error);
      throw error;
    }
  }

  static async saveStatusDetails(details) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.STATUS_DETAILS,
        JSON.stringify(details)
      );
    } catch (error) {
      console.error("Error saving status details:", error);
      throw error;
    }
  }

  // Notes
  static async getNotes() {
    try {
      const notesData = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
      return notesData ? JSON.parse(notesData) : [];
    } catch (error) {
      console.error("Error getting notes:", error);
      throw error;
    }
  }

  static async saveNotes(notes) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (error) {
      console.error("Error saving notes:", error);
      throw error;
    }
  }

  // Work Entries
  static async getWorkEntries() {
    try {
      const entriesData = await AsyncStorage.getItem(STORAGE_KEYS.WORK_ENTRIES);
      return entriesData ? JSON.parse(entriesData) : [];
    } catch (error) {
      console.error("Error getting work entries:", error);
      throw error;
    }
  }

  static async saveWorkEntries(entries) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.WORK_ENTRIES,
        JSON.stringify(entries)
      );
    } catch (error) {
      console.error("Error saving work entries:", error);
      throw error;
    }
  }

  // Utility methods
  static async clearAllData() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error("Error clearing all data:", error);
      throw error;
    }
  }
}

export default DatabaseService;
