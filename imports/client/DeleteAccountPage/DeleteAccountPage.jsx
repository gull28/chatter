import React, {useState} from 'react';
import {View, Text, TextInput, Button} from 'react-native';
import {firebase} from '@react-native-firebase/auth';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import firestore from '@react-native-firebase/firestore';

const db = firestore();

export const DeleteAccountPage = ({navigation}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleDeleteAccount = () => {
    const user = firebase.auth().currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(
      user.email,
      password,
    );

    user
      .reauthenticateWithCredential(credential)
      .then(() => {
        user
          .delete()
          .then(() => {
            db.collection('users')
              .doc(user.uid)
              .delete()
              .then(() => {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: 'Account deleted successfully!',
                  visibilityTime: 3000,
                  autoHide: true,
                  topOffset: 30,
                  bottomOffset: 40,
                });

                navigation.navigate('LandingPage');
              });
          })
          .catch(error => {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: error,
              visibilityTime: 3000,
              autoHide: true,
              topOffset: 30,
              bottomOffset: 40,
            });
          });
      })
      .catch(error => {
        setError('Incorrect password');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Incorrect password',
          visibilityTime: 3000,
          autoHide: true,
          topOffset: 30,
          bottomOffset: 40,
        });
      });
  };

  return (
    <View>
      <Text>Are you sure you want to delete your account?</Text>
      <TextInput
        placeholder="Enter password"
        value={password}
        onChangeText={password => setPassword(password)}
        secureTextEntry={true}
      />
      <Text style={{color: 'red'}}>{error}</Text>
      <Button title="Delete Account" onPress={() => handleDeleteAccount()} />
    </View>
  );
};
