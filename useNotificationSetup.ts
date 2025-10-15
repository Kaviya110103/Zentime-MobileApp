// useNotificationSetup.ts
import { useEffect, useState } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

export const useNotificationSetup = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    const register = async () => {
      if (!Device.isDevice) {
        Alert.alert('Must use physical device for push notifications');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (finalStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Push Notification permission not granted');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync();
      console.log('📱 Expo Push Token:', token.data); // Copy this for testing if needed
      setExpoPushToken(token.data);
    };

    register();
  }, []);

  return expoPushToken;
};
