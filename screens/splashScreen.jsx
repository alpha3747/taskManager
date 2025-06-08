import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, Dimensions, Text} from 'react-native';

const SplashScreen = ({navigation}) => {
  const progress = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // logo splash
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    // progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start(() => navigation.replace('Home'));
  }, []);

  const width = Dimensions.get('window').width;

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.6],
  });
  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Animated.Image
          source={require('../assets/bg.png')}
          style={[
            styles.image,
            {
              opacity: logoOpacity,
              transform: [{scale: logoScale}],
            },
          ]}
          resizeMode="contain"
        />

        <View style={styles.progressBar}>
          <Animated.View
            style={[styles.progressFill, {width: progressWidth}]}
          />
        </View>
      </View>

      <Text style={styles.tagline}>Powered by WorkLabs</Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  centerContent: {
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  progressBar: {
    height: 10,
    width: '60%',
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00E6CC',
  },
  tagline: {
    color: '#00E6CC',
    fontSize: 16,
    fontWeight: '300',
  },
});
