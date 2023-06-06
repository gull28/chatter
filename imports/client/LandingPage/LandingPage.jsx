import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import auth from '@react-native-firebase/auth';

export const LandingPage = ({navigation}) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('hello :D');
      const unsubscribe = auth().onAuthStateChanged(user => {
        if (user) {
          console.log('user', user);
          navigation.navigate('MenuPage');
        } else {
          console.log('null', user);
          navigation.navigate('LoginPage');
        }
      });
      return () => unsubscribe();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Animatable.Text animation="bounceIn" style={styles.title}>
        Chatter
      </Animatable.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
});
