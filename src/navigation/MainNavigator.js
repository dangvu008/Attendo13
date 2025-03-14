import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useLocalization } from '../context/LocalizationContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ShiftScreen from '../screens/ShiftScreen';
import NotesScreen from '../screens/NotesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MonthlyStatsScreen from '../screens/MonthlyStatsScreen';

const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  const { t } = useLocalization() || { t: key => key };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Shifts') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Stats') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Notes') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarLabel: t('home') }}
      />
      <Tab.Screen 
        name="Shifts" 
        component={ShiftScreen} 
        options={{ tabBarLabel: t('shifts') }}
      />
      <Tab.Screen 
        name="Stats" 
        component={MonthlyStatsScreen} 
        options={{ tabBarLabel: t('stats') }}
      />
      <Tab.Screen 
        name="Notes" 
        component={NotesScreen} 
        options={{ tabBarLabel: t('notes') }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ tabBarLabel: t('settings') }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
