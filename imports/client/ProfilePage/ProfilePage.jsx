import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {firebase} from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import auth from '@react-native-firebase/auth';

const db = firestore();

export const ProfilePage = ({navigation, route}) => {
  const {user} = route.params;

  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');

  const userData = async () => {
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        return userDoc.data();
      } else {
        console.log('User data not found');
      }
    } catch (error) {
      console.log('Error retrieving user data: ', error);
    }
  };

  useEffect(() => {
    const getUserData = async () => {
      const {username, phoneNumber} = await userData();

      setUsername(username);
      setPhoneNumber(phoneNumber);
    };

    getUserData();
  }, []);

  const handleUserLogout = async () => {
    try {
      await auth().signOut();
      navigation.navigate('LoginPage');
    } catch (error) {
      console.log(error);
    }
  };

  const handleUsernameChange = username => {
    setUsername(username);
  };

  const handleOldPasswordChange = oldPassword => {
    setOldPassword(oldPassword);
  };

  const handleNewPasswordChange = newPassword => {
    setNewPassword(newPassword);
  };

  const saveChanges = async (
    newPassword,
    currentPassword,
    username,
    phoneNumber,
  ) => {
    if (
      newPassword.trim() !== '' &&
      currentPassword.trim() !== '' &&
      newPassword.trim() !== currentPassword.trim()
    ) {
      try {
        const user = firebase.auth().currentUser;
        const credential = firebase.auth.EmailAuthProvider.credential(
          user.email,
          currentPassword,
        );
        await user.reauthenticateWithCredential(credential);

        await user.updatePassword(newPassword);

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Password successfully updated!',
          visibilityTime: 4000,
          autoHide: true,
          topOffset: 30,
          bottomOffset: 40,
        });

        navigation.navigate('MenuPage', {user});
        console.log('Password successfully updated!');
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Password error!',
          visibilityTime: 4000,
          autoHide: true,
          topOffset: 30,
          bottomOffset: 40,
        });
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Password must not be empty or the same as your last password!',
        visibilityTime: 4000,
        autoHide: true,
        topOffset: 30,
        bottomOffset: 40,
      });
    }

    if (!username || !phoneNumber) {
      console.log('Please provide a valid username and phone number.');
      return;
    }

    if (!username || (!phoneNumber && username === userData.username)) {
      console.log(
        'The new username cannot be the same as the current username.',
      );
      return;
    } else {
      try {
        await db.collection('users').doc(user.uid).update({
          username: username,
          phoneNumber: phoneNumber,
        });
        console.log('Changes saved successfully');
      } catch (error) {
        console.log('Error saving changes: ', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}>
          <Text style={styles.exitButtonText}>X</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile Page</Text>
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email:</Text>
        <Text>{user.email}</Text>
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Username:</Text>
        <TextInput
          value={username}
          onChangeText={username => handleUsernameChange(username)}
          placeholder="Enter username"
          style={styles.input}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Old password:</Text>
        <TextInput
          value={oldPassword}
          onChangeText={oldPassword => handleOldPasswordChange(oldPassword)}
          placeholder="Enter old password"
          style={styles.input}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>New password:</Text>
        <TextInput
          value={newPassword}
          onChangeText={newPassword => handleNewPasswordChange(newPassword)}
          placeholder="Enter new password"
          style={styles.input}
        />
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          saveChanges(newPassword, oldPassword, username, phoneNumber)
        }>
        <Text style={styles.exitButtonText}>Save changes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.badButton}
        onPress={() => navigation.navigate('DeleteAccountPage')}>
        <Text style={styles.exitButtonText}>Delete account</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.badButton}
        onPress={() => handleUserLogout()}>
        <Text style={styles.exitButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  button: {
    backgroundColor: '#0084ff',
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badButton: {
    backgroundColor: '#ED4337',
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: 'gray',
  },
});
