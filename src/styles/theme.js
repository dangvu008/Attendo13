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
    primary: '#6200ee',
    primaryDark: '#4b01d0',
    primaryLight: '#a58edd',
    secondary: '#03dac6',
    secondaryDark: '#00b5a6',
    secondaryLight: '#66fff9',
    error: '#B00020',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    disabled: '#9e9e9e',
    placeholder: '#9e9e9e',
    border: '#e0e0e0',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    divider: '#E0E0E0',
    card: '#FFFFFF',
    cardHeader: '#F5F5F5',
    statusBar: '#4b01d0',
    notification: '#f50057',
    
    // Home screen specific colors
    goWorkButton: '#4CAF50',  // Green
    checkInButton: '#2196F3',  // Blue
    checkOutButton: '#FF9800', // Orange
    completeButton: '#9C27B0', // Purple
    resetButton: '#ff5722',    // Deep Orange
  },
  fonts: configureFonts(fontConfig),
  roundness: 8,
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
};

// Dark theme
export const DarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: '#bb86fc',
    primaryDark: '#9965f4',
    primaryLight: '#cfafff',
    secondary: '#03dac6',
    secondaryDark: '#00b5a6',
    secondaryLight: '#66fff9',
    error: '#CF6679',
    success: '#81C784',
    warning: '#FFB74D',
    info: '#64B5F6',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#e0e0e0',
    textSecondary: '#a0a0a0',
    disabled: '#666666',
    placeholder: '#8f8f8f',
    border: '#333333',
    backdrop: 'rgba(0, 0, 0, 0.8)',
    divider: '#2E2E2E',
    card: '#2b2b2b',
    cardHeader: '#333333',
    statusBar: '#000000',
    notification: '#f55a8a',
    
    // Home screen specific colors
    goWorkButton: '#66bb6a',  // Green - lighter for dark mode
    checkInButton: '#42a5f5',  // Blue - lighter for dark mode
    checkOutButton: '#ffa726', // Orange - lighter for dark mode
    completeButton: '#ba68c8', // Purple - lighter for dark mode
    resetButton: '#ff7043',    // Deep Orange - lighter for dark mode
  },
  fonts: configureFonts(fontConfig),
  roundness: 8,
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
};
