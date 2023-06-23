import React, {useEffect, useState} from 'react';
import {AppState} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {firebase} from '@react-native-firebase/auth';
import {errorToast} from './helpers';

const withUserPresence = WrappedComponent => {
  return ({navigation, route}) => {
    const [appState, setAppState] = useState(AppState.currentState);

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

      const handleAppStateChange = nextAppState => {
        if (
          appState === 'active' &&
          nextAppState.match(/inactive|background/)
        ) {
          // App is transitioning to the background or becoming inactive
          setUserOffline();
        }

        if (nextAppState === 'active') {
          // App is becoming active again
          setUserOnline();
        }

        setAppState(nextAppState);
      };

      // Subscribe to app state changes
      AppState.addEventListener('change', handleAppStateChange);

      // Set the initial user presence status
      setUserOnline();

      // Clean up the event listener when the component is unmounted
      return () => {
        setUserOffline();
        AppState.removeEventListener('change', handleAppStateChange);
      };
    }, []);

    return <WrappedComponent navigation={navigation} route={route} />;
  };
};

export default withUserPresence;
