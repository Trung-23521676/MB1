import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const splashLogo = require('../../assets/images/splash.png');

export default function SplashScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/OnBoarding1');
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.splashContainer}>
      <Image source={splashLogo} style={styles.splashLogo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#6EB5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 180,
    height: 180,
  },
});