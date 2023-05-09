import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';

export const LandingPage = ({navigation}) => {
  const fadeInAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeInAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
    navigation.navigate('LoginPage');
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.textContainer, {opacity: fadeInAnim}]}>
        <Text style={styles.title}>Welcome to my app!</Text>
        <Text style={styles.subtitle}>This is the landing page.</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#777',
  },
});
