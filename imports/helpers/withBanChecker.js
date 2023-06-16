import React, {useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import auth, {firebase} from '@react-native-firebase/auth';

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
            await auth().signOut();
            console.log('User is banned!');
          }
        });

      return () => unsubscribe();
    }, []);

    return <WrappedComponent navigation={navigation} route={route} />;
  };
};

export default withBanChecker;
