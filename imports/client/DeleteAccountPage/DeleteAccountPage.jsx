import React, {useState} from 'react';
import {View, Text, TextInput, Button} from 'react-native';
import {firebase} from '@react-native-firebase/auth';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import firestore from '@react-native-firebase/firestore';
import {errorToast, successToast} from '../../helpers/helpers';

const db = firestore();

export const DeleteAccountPage = ({navigation}) => {
  const [password, setPassword] = useState('');

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
                successToast('Account deleted successfully!');
                navigation.navigate('LandingPage');
              });
          })
          .catch(error => {
            errorToast(error.message);
          });
      })
      .catch(error => {
        errorToast('Incorrect password');
      });
  };

  return (
    <View>
      <Text>Are you sure you want to delete your account?</Text>
      <TextInput
        placeholder="Enter password"
        placeholderTextColor="black"
        value={password}
        onChangeText={password => setPassword(password)}
        secureTextEntry={true}
      />
      <Button title="Delete Account" onPress={() => handleDeleteAccount()} />
    </View>
  );
};
