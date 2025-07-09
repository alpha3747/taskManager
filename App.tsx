import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SplashScreen from './components/splashScreen';
import HomeScreen from './components/homeScreen';
import OnboardingScreen from './components/onBoardingScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  const [isAppReady, setAppReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    const prepareApp = async () => {
      const onboarded = await AsyncStorage.getItem('hasOnboarded');
      setHasOnboarded(onboarded === 'true');

      await new Promise(resolve => setTimeout(resolve, 1000));

      setAppReady(true);
    };

    prepareApp();
  }, []);

  if (!isAppReady) return <SplashScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={hasOnboarded === false ? 'Onboarding' : 'Home'}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;


// import React, {useEffect, useState} from 'react';
// import {NavigationContainer} from '@react-navigation/native';
// import {createNativeStackNavigator} from '@react-navigation/native-stack';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// import SplashScreen from './components/splashScreen';
// import HomeScreen from './components/homeScreen';
// import OnboardingScreen from './components/onBoardingScreen'; // if you have one

// const Stack = createNativeStackNavigator();

// const App = () => {
//   const [isAppReady, setAppReady] = useState(false);
//   const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

//   useEffect(() => {
//     const prepareApp = async () => {
//       const onboarded = await AsyncStorage.getItem('hasOnboarded');
//       setHasOnboarded(onboarded === 'true');

//       await new Promise(resolve => setTimeout(resolve, 1000));

//       setAppReady(true);
//     };

//     prepareApp();
//   }, []);

//   if (!isAppReady) return <SplashScreen />;

//   return (
//     <NavigationContainer>
//       <Stack.Navigator
//         screenOptions={{headerShown: false}}
//         initialRouteName={hasOnboarded === false ? 'Onboarding' : 'Home'}>
//         <Stack.Screen name="Onboarding" component={OnboardingScreen} />
//         <Stack.Screen name="Home" component={HomeScreen} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default App;
