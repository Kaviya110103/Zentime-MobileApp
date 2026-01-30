import React, { useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, Animated, Image, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { EmployeeContext } from '../context/EmployeeContext'; // adjust path if needed

export default function Index() {
  const imageAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { employee } = useContext(EmployeeContext);
  useEffect(() => {
    // Animate logo and text
    Animated.timing(imageAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    });

    // Navigate after animation completes
    const timer = setTimeout(() => {
      if (employee) {
        router.push('/EmployeeLogin'); // user logged in → go to main screen
      } else {
        router.push('/Walkthrough'); // user not logged in → show walkthrough
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [employee]);

  const isDarkMode = colorScheme === 'dark';

  return (
    <View  //div
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#000' : '#fff' },
      ]}
    >
      <Animated.Image
        source={require('../assets/images/icon.png')}
        style={[
          styles.image,
          {
            opacity: imageAnim,
            transform: [{ scale: imageAnim }],
          },
        ]}
        resizeMode="contain"
      />

      <Animated.Text style={[styles.text, { opacity: textAnim }]}>
        ZenTime
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 220,
    height: 220,
    marginBottom: 20,
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textShadowColor: '#aaa',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 5,
  },
});
