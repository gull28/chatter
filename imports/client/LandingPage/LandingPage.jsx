import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {errorToast, successToast} from '../../helpers/helpers';
const db = firestore();

export const LandingPage = ({navigation}) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      const unsubscribe = auth().onAuthStateChanged(async user => {
        if (user) {
          const bannedUsersSnapshot = await db
            .collection('bannedUsers')
            .where('email', '==', user.uid)
            .get();

          if (bannedUsersSnapshot.exists) {
            errorToast('Access denied. Your account has been banned.');
            auth().signOut(); // Sign out the user
            return;
          }

          navigation.navigate('MenuPage');
        } else {
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
