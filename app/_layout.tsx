// app/_layout.tsx
import { enableScreens } from 'react-native-screens';
enableScreens(); // ✅ MUST be called before any navigation

import React from 'react';
import { Stack } from 'expo-router';
import { EmployeeProvider } from '../context/EmployeeContext';

export default function Layout() {
  return (
    <EmployeeProvider>
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
