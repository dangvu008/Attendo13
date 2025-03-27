import AsyncStorage from "@react-native-async-storage/async-storage";

const MULTI_ACTION_BUTTON_KEY = "multi_action_button_enabled";

// Load multi-action button state
export const loadMultiActionButtonState = async () => {
  try {
    const state = await AsyncStorage.getItem(MULTI_ACTION_BUTTON_KEY);
    return state === null ? true : JSON.parse(state); // Default to true if not set
  } catch (error) {
    console.error("Error loading multi-action button state:", error);
    return true; // Default to true on error
  }
};

// Save multi-action button state
export const saveMultiActionButtonState = async (enabled) => {
  try {
    await AsyncStorage.setItem(
      MULTI_ACTION_BUTTON_KEY,
      JSON.stringify(enabled)
    );
    return true;
  } catch (error) {
    console.error("Error saving multi-action button state:", error);
    return false;
  }
};
