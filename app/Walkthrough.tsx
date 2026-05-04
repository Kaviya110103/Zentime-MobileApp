import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useRef, useState } from 'react';
import { View, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../components/AppTypography';
import Swiper from 'react-native-swiper';
import { useRouter } from 'expo-router';

const WALKTHROUGH_DONE_KEY = 'walkthroughCompleted';

const WalkthroughScreen = () => {
  const router = useRouter();
  const swiperRef = useRef<Swiper>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      image: require('../assets/images/walk1.png'),
      title: 'Welcome to ZenTime',
      description: 'Post your attendance with Time-In, Time-Out and Image capture'
    },
    {
      image: require('../assets/images/walk2.png'),
      title: 'Location Tracking',
      description: 'Your location will be tracked by admin, and attendance is allowed only inside the campus'
    },
    {
      image: require('../assets/images/walk3.png'),
      title: 'Get Started Now',
      description: 'Join thousands of satisfied users today'
    }
  ];

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      swiperRef.current?.scrollBy(1);
    } else {
      await AsyncStorage.setItem(WALKTHROUGH_DONE_KEY, 'true');
      router.replace('/EmployeeLogin');
    }
  };

  return (
    <View style={styles.container}>
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>
          {currentIndex === slides.length - 1? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
      <Swiper
        ref={swiperRef}
        loop={false}
        onIndexChanged={(index) => setCurrentIndex(index)}
        showsPagination={true}
        dotStyle={styles.dot} 
        activeDotStyle={styles.activeDot}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <Image source={slide.image} style={styles.fullscreenImage} />
            <View style={styles.overlay}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </Swiper>

    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  slide: {
    flex: 1
  },
  fullscreenImage: {
    width: width,
    height: height,
    resizeMode: 'cover',
    position: 'absolute'
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center'
  },
  description: {
    fontSize: 16,
    color: '#eee',
    textAlign: 'center',
    marginBottom: 100
  },
  dot: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 10,
    height: 10,
    borderRadius: 10,
    margin: 3,
     bottom: 40

  },
  activeDot: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 10,
    margin: 3,
    bottom: 40
  },
  button: {
    zIndex: 1,
    position: 'absolute',
    bottom: 250,
    alignSelf: 'center',
    backgroundColor: '#351153',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 4
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});

export default WalkthroughScreen;

