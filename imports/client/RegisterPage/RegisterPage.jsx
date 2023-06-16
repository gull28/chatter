import React, {useEffect, useState} from 'react';
import {View, Text, SafeAreaView} from 'react-native';
import {StyleSheet, TextInput, TouchableOpacity} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth, {firebase} from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import {errorToast, successToast} from '../../helpers/helpers';

const db = firestore();

export const RegisterPage = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const register = async (email, password, username) => {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errorToast('Invalid email address');
        return;
      }

      if (username.length > 12 || username.length < 2) {
        errorToast(
          'Username should not exceed 12 characters and be less than 2',
        );
        return;
      }

      // Add a regular expression to check for bad symbols in the username
      const usernameRegex = /^[a-zA-Z0-9_-]+$/; // Only allows alphanumeric characters, underscores, and hyphens
      if (!usernameRegex.test(username)) {
        errorToast('Username contains invalid characters');
        return;
      }

      const bannedUsersSnapshot = await db
        .collection('bannedUsers')
        .where('email', '==', email)
        .get();

      if (!bannedUsersSnapshot.empty) {
        errorToast('Access denied. This email address has been banned.');
        return;
      }

      const usernameSnapshot = await db
        .collection('users')
        .where('username', '==', username)
        .get();

      if (!usernameSnapshot.empty) {
        errorToast('Username already taken!');
        return;
      }

      const {user} = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );

      await user.updateProfile({displayName: username});

      await db.collection('users').doc(user.uid).set({
        username: username,
        friends: [],
        email: email,
      });

      successToast(`Successfully registered user ${username}`);
      navigation.navigate('MenuPage');
    } catch (error) {
      errorToast(error.message);
    }
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
          placeholder="Username"
          placeholderTextColor="#2196F3"
          onChangeText={setUsername}
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
      <TouchableOpacity
        style={styles.loginBtn}
        onPress={() => register(email, password, username)}>
        <Text style={styles.loginText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerBtn}
        onPress={() => navigation.navigate('LoginPage')}>
        <Text style={styles.registerText}>Back to logging in?</Text>
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
