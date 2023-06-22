import React, {useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import {firebase} from '@react-native-firebase/auth';
import {errorToast} from './helpers';

const withUserPresence = WrappedComponent => {
  return ({navigation, route}) => {
    useEffect(() => {
      const userId = firebase.auth().currentUser.uid;

      const setUserOnline = async () => {
        try {
          await firestore()
            .collection('users')
            .doc(userId)
            .update({
              presence: {
                status: 'online',
                lastUpdated: firestore.FieldValue.serverTimestamp(),
              },
            });
        } catch (e) {
          errorToast('Error updating the user presence!');
        }
      };

      setUserOnline();

      const setUserOffline = async () => {
        try {
          await firestore()
            .collection('users')
            .doc(userId)
            .update({
              presence: {
                status: 'offline',
                lastUpdated: firestore.FieldValue.serverTimestamp(),
              },
            });
        } catch (e) {
          errorToast('Error setting user offline!');
        }
      };
      return () => setUserOffline();
    }, []);
    return <WrappedComponent navigation={navigation} route={route} />;
  };
};

export default withUserPresence;
