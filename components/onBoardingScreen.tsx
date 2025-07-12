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
          subtitle: 'Lets get things done!',
        },
        {
          backgroundColor: '#121212',
          image: <Image source={require('../assets/intro1.png')} style={styles.image} />,
          title: 'Add Tasks Easily',
          subtitle: 'Enter a task name and optional description, then set a priority and due date to stay organized.',
        },
        {
          backgroundColor: '#121212',
          image: <Image source={require('../assets/intro2.jpg')} style={styles.image} />,
          title: 'Stay Notified',
          subtitle: 'Receive timely reminders for your tasks to ensure you never miss a deadline.',
        },
        {
          backgroundColor: '#121212',
          image: <Image source={require('../assets/intro3.jpg')} style={styles.image} />,
          title: 'Manage Your Tasks',
          subtitle: 'Swipe to edit or delete tasks, and tap to mark them as complete or incomplete.',
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
