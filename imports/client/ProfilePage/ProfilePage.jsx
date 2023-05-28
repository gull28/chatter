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
import {BackButton} from '../../components/BackArrow';

const db = firestore();

export const ProfilePage = ({navigation, route}) => {
  const {user} = route.params;

  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');

  const userData = async () => {
    try {
      const userDoc = await db.collection('users').doc(user).get();
      if (userDoc.exists) {
        return userDoc.data();
      } else {
      }
    } catch (error) {}
  };

  useEffect(() => {
    const getUserData = async () => {
      const {username, phoneNumber, email} = await userData();

      setEmail(email);
      setUsername(username);
      setPhoneNumber(phoneNumber);
    };

    getUserData();
  }, []);

  const handleUserLogout = async () => {
    try {
      await auth().signOut();
      navigation.navigate('LoginPage');
    } catch (error) {}
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
          email,
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

        navigation.navigate('MenuPage');
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
      return;
    }

    if (!username || (!phoneNumber && username === userData.username)) {
      return;
    } else {
      try {
        await db.collection('users').doc(user).update({
          username: username,
          phoneNumber: phoneNumber,
        });
      } catch (error) {}
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} color="#2196F3" />
        <Text style={styles.title}>Profile Page</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.infoText}>{email}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Username:</Text>
        <TextInput
          value={username}
          onChangeText={username => handleUsernameChange(username)}
          placeholder="Enter username"
          style={styles.input}
        />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Old password:</Text>
        <TextInput
          value={oldPassword}
          onChangeText={oldPassword => handleOldPasswordChange(oldPassword)}
          placeholder="Enter old password"
          secureTextEntry={true}
          style={styles.input}
        />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>New password:</Text>
        <TextInput
          value={newPassword}
          onChangeText={newPassword => handleNewPasswordChange(newPassword)}
          placeholder="Enter new password"
          secureTextEntry={true}
          style={styles.input}
        />
      </View>
      <TouchableOpacity
        onPress={() =>
          saveChanges(newPassword, oldPassword, username, phoneNumber)
        }
        style={styles.saveButton}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('DeleteAccountPage')}
        style={styles.deleteButton}>
        <Text style={styles.buttonText}>Delete Account</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleUserLogout()}
        style={styles.logoutButton}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2196F3',
  },
  infoContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
  },
  deleteButton: {
    backgroundColor: '#ff0000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  logoutButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
