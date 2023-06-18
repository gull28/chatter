import React, {useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import auth, {firebase} from '@react-native-firebase/auth';
import {errorToast} from './helpers';

const withBanChecker = WrappedComponent => {
  return ({navigation, route}) => {
    useEffect(() => {
      const currentUser = firebase.auth().currentUser;
      const unsubscribe = firestore()
        .collection('bannedUsers')
        .doc(currentUser.uid)
        .onSnapshot(async snapshot => {
          if (snapshot.exists) {
            navigation.navigate('LoginPage');
            errorToast('You have been banned!');
          } else {
            return;
          }
        });

      return () => unsubscribe();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <WrappedComponent navigation={navigation} route={route} />;
  };
};

export default withBanChecker;
