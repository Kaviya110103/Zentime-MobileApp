import { useEffect, useState } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';

export const useNotificationSetup = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    const register = async () => {
      try {
        if (!Device.isDevice) {
          Alert.alert('Must use physical device for push notifications');
          return;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
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

        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;

        if (!projectId) {
          console.warn('EAS projectId is missing. Push token cannot be generated in APK builds.');
          return;
        }

        const token = await Notifications.getExpoPushTokenAsync({ projectId });
        console.log('Expo Push Token:', token.data);
        setExpoPushToken(token.data);
      } catch (error) {
        console.warn('Failed to register for push notifications:', error);
      }
    };

    register();
  }, []);

  return expoPushToken;
};
