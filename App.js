import React, { useState, useEffect } from "react";
import { StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { Provider as PaperProvider } from "react-native-paper";
import * as NotificationService from "./src/services/NotificationService";
import * as Notifications from "expo-notifications";
import notifee, { EventType } from "@notifee/react-native";
import BackgroundNotificationService from "./src/services/BackgroundNotificationService";

// Contexts
import { ThemeProvider } from "./src/context/ThemeContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import { LocalizationProvider } from "./src/context/LocalizationContext";
import { ShiftProvider } from "./src/context/ShiftContext";

// Navigation
import MainNavigator from "./src/navigation/MainNavigator";

// Prevent native splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load resources, make API calls, etc.
        // Artificially delay for a smooth startup experience
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Khởi tạo kênh thông báo cho Android
        await BackgroundNotificationService.createNotificationChannel();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide splash screen when ready
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  useEffect(() => {
    // Initialize notifications
    NotificationService.initializeNotifications();

    // Listen for incoming notifications
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Received notification:", notification);
      }
    );

    // Listen for notification interactions
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        NotificationService.handleNotificationResponse(response);
      });

    // Thiết lập listener cho Notifee (thông báo nền)
    const notifeeUnsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          console.log("Người dùng đã bỏ qua thông báo", detail.notification);
          break;
        case EventType.PRESS:
          console.log("Người dùng đã nhấn vào thông báo", detail.notification);
          BackgroundNotificationService.onNotificationInteraction(
            detail.notification
          );
          break;
      }
    });

    // Thiết lập xử lý thông báo khi ứng dụng ở nền
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log(
          "Người dùng đã nhấn vào thông báo (nền)",
          detail.notification
        );
      }
    });

    // Cleanup on unmount
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
      notifeeUnsubscribe();
    };
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <LocalizationProvider>
            <ShiftProvider>
              <View style={{ flex: 1 }}>
                <StatusBar style="auto" />
                <NavigationContainer>
                  <MainNavigator />
                </NavigationContainer>
              </View>
            </ShiftProvider>
          </LocalizationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
