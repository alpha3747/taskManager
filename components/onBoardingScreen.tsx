import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';

type OnboardingScreenProps = {
  navigation: StackNavigationProp<any>;
  onDone?: () => void;
};

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const handleFinish = async () => {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    navigation.replace('Home');
  };

  return (
    <Onboarding
      onDone={handleFinish}
      onSkip={handleFinish}
      pages={[
        {
          backgroundColor: '#121212',
          image: <Image source={require('../assets/intro1.png')} style={styles.image} />,
          title: 'Welcome to WorkLabs',
          subtitle: 'Organize your tasks efficiently with ease!',
        },
        {
          backgroundColor: '#121212',
          image: <Image source={require('../assets/intro2.jpg')} style={styles.image} />,
          title: 'Stay on Track',
          subtitle: 'Get reminders before your tasks become overdue!',
        },
        {
          backgroundColor: '#121212',
          image: <Image source={require('../assets/intro3.jpg')} style={styles.image} />,
          title: 'Get Started Now',
          subtitle: 'Add your first task and take control of your schedule!',
        },
      ]}
      titleStyles={styles.title}
      subTitleStyles={styles.subtitle}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    width: 200,
    height: 200,
  },
  title: {
    color: '#00E6CC',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
  },
});

export default OnboardingScreen;
