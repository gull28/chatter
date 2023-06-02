import React, {useState} from 'react';
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-toast-message';
import firestore from '@react-native-firebase/firestore';

import auth from '@react-native-firebase/auth';
import {errorToast, successToast} from '../../helpers/helpers';
const db = firestore();

export const LoginPage = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    auth()
      .signInWithEmailAndPassword(email, password)
      .then(async userCred => {
        const user = userCred.user;

        // Check if the user is an app admin
        const appAdminsSnapshot = await db
          .collection('appAdmins')
          .doc(user.uid)
          .get();
        if (appAdminsSnapshot.exists) {
          errorToast(
            'Access denied. You are not allowed to log in as an app admin.',
          );
          auth().signOut(); // Sign out the user
          return;
        }

        // Check if the user is banned
        const bannedUsersSnapshot = await db
          .collection('bannedUsers')
          .doc(user.uid)
          .get();
        if (bannedUsersSnapshot.exists) {
          errorToast('Access denied. Your account has been banned.');
          auth().signOut(); // Sign out the user
          return;
        }

        successToast('Logged in successfully!');
        navigation.navigate('MenuPage');
      })
      .catch(error => {
        if (error.code === 'auth/invalid-email') {
          errorToast('Invalid email address');
        } else if (error.code === 'auth/user-not-found') {
          errorToast('User not found');
        } else if (error.code === 'auth/wrong-password') {
          errorToast('Wrong password');
        } else {
          errorToast(error.message);
        }
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Chatter</Text>
      <View style={styles.inputView}>
        <TextInput
          style={styles.inputText}
          placeholder="Email"
          placeholderTextColor="#2196F3"
          onChangeText={setEmail}
        />
      </View>
      <View style={styles.inputView}>
        <TextInput
          style={styles.inputText}
          placeholder="Password"
          placeholderTextColor="#2196F3"
          secureTextEntry={true}
          onChangeText={setPassword}
        />
      </View>
      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerBtn}
        onPress={() => navigation.navigate('RegisterPage')}>
        <Text style={styles.registerText}>Register now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  logo: {
    fontWeight: 'bold',
    fontSize: 50,
    color: '#2196F3',
    marginBottom: 40,
  },
  inputView: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 25,
    height: 50,
    marginBottom: 20,
    justifyContent: 'center',
    padding: 20,
  },
  inputText: {
    height: 50,
    color: 'black',
  },
  loginBtn: {
    width: '80%',
    backgroundColor: '#2196F3',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 10,
  },
  loginText: {
    color: '#fff',
  },
  registerBtn: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  registerText: {
    color: '#2196F3',
  },
});
