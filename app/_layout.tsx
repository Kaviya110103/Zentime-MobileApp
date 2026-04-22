// app/_layout.tsx
import { enableScreens } from 'react-native-screens';
enableScreens(); // ✅ MUST be called before any navigation

import React, { useContext, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Entypo,
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { EmployeeProvider } from '../context/EmployeeContext';
import { EmployeeContext } from '../context/EmployeeContext';
import { useNotificationSetup } from '../useNotificationSetup';
import { buildApiUrl } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationRegistrar = () => {
  const expoPushToken = useNotificationSetup();
  const { employee } = useContext(EmployeeContext);
  const [lastRegisteredToken, setLastRegisteredToken] = useState<string | null>(null);

  useEffect(() => {
    if (!expoPushToken) return;
    AsyncStorage.setItem('expoPushToken', expoPushToken).catch((err) => {
      console.warn('Failed to cache push token:', err);
    });
  }, [expoPushToken]);

  useEffect(() => {
    if (!employee?.id || !expoPushToken || expoPushToken === lastRegisteredToken) return;

    const register = async () => {
      try {
        await fetch(buildApiUrl(`/api/employees/${employee.id}/push-token`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: expoPushToken }),
        });
        setLastRegisteredToken(expoPushToken);
      } catch (err) {
        console.warn('Failed to register push token:', err);
      }
    };

    register();
  }, [employee, expoPushToken, lastRegisteredToken]);

  return null;
};

export default function Layout() {
  const [fontsLoaded] = useFonts({
    ...Feather.font,
    ...FontAwesome5.font,
    ...MaterialIcons.font,
    ...MaterialCommunityIcons.font,
    ...Ionicons.font,
    ...Entypo.font,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <EmployeeProvider>
      <NotificationRegistrar />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#351153',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="EmployeeLogin" options={{ headerShown: false }} />
        <Stack.Screen name="WelcomeBack" options={{ headerShown: false }} />
        <Stack.Screen name="MarkAttendance" options={{ headerShown: false }} />
        <Stack.Screen name="Calendarprinting" options={{ headerShown: false }} />
        <Stack.Screen name="EmployeeProfile" options={{ headerShown: false }} />
        <Stack.Screen name="MarkTimeIn" options={{ title: 'Mark Time In' }} />
        <Stack.Screen name="MarkTimeOut" options={{ title: 'Mark Time Out' }} />
        <Stack.Screen name="EmployeePermission" options={{ headerShown: false }} />
        <Stack.Screen name="LeavePermission" options={{ headerShown: false }} />
        <Stack.Screen name="AllAnnouncements" options={{ headerShown: false }} />
        <Stack.Screen name="EmployeeCalendar" options={{ headerShown: false }} />
        <Stack.Screen name="EmployeeLeavePermission" options={{ headerShown: false }} />
        <Stack.Screen name="LocationTest" options={{ headerShown: false }} />
        {/* <Stack.Scr    een name="Leaverequest" options={{ headerShown: false }} /> */}
        <Stack.Screen name="Walkthrough" options={{ headerShown: false }} />
        <Stack.Screen name="ClientReg" options={{ headerShown: false }} />
        <Stack.Screen name="Testback" options={{ headerShown: false }} />
      </Stack>
    </EmployeeProvider>
  );
}
