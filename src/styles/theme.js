import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { configureFonts } from 'react-native-paper';

// Font configuration
const fontConfig = {
  default: {
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
};

// Default theme (Light)
export const DefaultTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: '#4285F4',         // Google Blue
    primaryDark: '#3367D6',     // Darker Blue
    primaryLight: '#A8C7FA',    // Lighter Blue
    secondary: '#34A853',       // Google Green
    secondaryDark: '#0F9D58',   // Darker Green
    secondaryLight: '#7BCB96',  // Lighter Green
    error: '#EA4335',           // Google Red
    success: '#34A853',         // Google Green
    warning: '#FBBC04',         // Google Yellow
    info: '#4285F4',            // Google Blue
    background: '#F8F9FA',      // Light Grey Background
    surface: '#FFFFFF',         // White Surface
    text: '#202124',            // Dark Grey Text
    textSecondary: '#5F6368',   // Secondary Text
    disabled: '#9AA0A6',        // Disabled State
    placeholder: '#9AA0A6',     // Placeholder Text
    border: '#DADCE0',          // Border Color
    backdrop: 'rgba(0, 0, 0, 0.5)',
    divider: '#DADCE0',        // Divider Color
    card: '#FFFFFF',           // Card Background
    cardHeader: '#F8F9FA',     // Card Header
    statusBar: '#3367D6',      // Status Bar Color
    notification: '#EA4335',   // Notification Color
    
    // Home screen specific colors
    goWorkButton: '#34A853',    // Green
    checkInButton: '#4285F4',   // Blue
    checkOutButton: '#FBBC04',  // Yellow
    completeButton: '#9C27B0',  // Purple
    resetButton: '#EA4335',     // Red
  },
  fonts: configureFonts(fontConfig),
  roundness: 12,                // Increased roundness for modern look
  animation: {
    scale: 1.0,
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  elevation: {
    small: {
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
    },
    medium: {
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3.84,
    },
    large: {
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
    }
  }
};

// Dark theme
export const DarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: '#8AB4F8',         // Light Blue for Dark theme
    primaryDark: '#669DF6',     // Slightly darker blue
    primaryLight: '#ADC8FF',    // Very light blue
    secondary: '#81C995',       // Light Green
    secondaryDark: '#5BB974',   // Slightly darker green
    secondaryLight: '#A8DAB5',  // Very light green
    error: '#F28B82',           // Light Red
    success: '#81C995',         // Light Green
    warning: '#FDD663',         // Light Yellow
    info: '#8AB4F8',            // Light Blue
    background: '#202124',      // Dark Background
    surface: '#303134',         // Surface Color
    text: '#E8EAED',            // Light Text
    textSecondary: '#9AA0A6',   // Secondary Text
    disabled: '#5F6368',        // Disabled State
    placeholder: '#80868B',     // Placeholder Text
    border: '#5F6368',          // Border Color
    backdrop: 'rgba(0, 0, 0, 0.8)',
    divider: '#5F6368',         // Divider Color
    card: '#303134',            // Card Background
    cardHeader: '#202124',      // Card Header
    statusBar: '#000000',       // Status Bar Color
    notification: '#F28B82',    // Notification Color
    
    // Home screen specific colors
    goWorkButton: '#81C995',    // Light Green
    checkInButton: '#8AB4F8',   // Light Blue
    checkOutButton: '#FDD663',  // Light Yellow
    completeButton: '#D7AEFB',  // Light Purple
    resetButton: '#F28B82',     // Light Red
  },
  fonts: configureFonts(fontConfig),
  roundness: 12,               // Increased roundness for modern look
  animation: {
    scale: 1.0,
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  elevation: {
    small: {
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 2,
    },
    medium: {
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3.84,
    },
    large: {
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 5,
    }
  }
};
