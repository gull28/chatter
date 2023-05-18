import React, {useEffect, useState} from 'react';
import {View, Text, SafeAreaView} from 'react-native';
import {StyleSheet, TextInput, TouchableOpacity} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth, {firebase} from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';

const db = firestore();

export const RegisterPage = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isValidPhoneNumber, setIsValidPhoneNumber] = useState(false);

  useState(() => {
    console.log(firebase);
  });
  const register = async (email, password, username, phoneNumber) => {
    try {
      const {user} = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );

      await user.updateProfile({displayName: username});

      await db.collection('users').doc(user.uid).set({
        username: username,
        phoneNumber: phoneNumber,
        friends: [],
        email: email,
      });
      navigation.navigate('MenuPage');

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Successfully registered user ${username}`,
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 30,
        bottomOffset: 40,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 30,
        bottomOffset: 40,
      });
    }
  };
  const handlePhoneNumberChange = value => {
    // phone number validation regex
    const phoneRegex = /^[+]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    setPhoneNumber(value);
    setIsValidPhoneNumber(phoneRegex.test(value));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registration</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={text => setEmail(text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={text => setUsername(text)}
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, !isValidPhoneNumber && styles.invalid]}
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={text => handlePhoneNumberChange(text)}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={text => setPassword(text)}
        secureTextEntry
      />
      <TouchableOpacity
        style={[styles.button, !isValidPhoneNumber && styles.disabled]}
        onPress={() => register(email, password, username, phoneNumber)}
        disabled={!isValidPhoneNumber}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button]}
        onPress={() => navigation.navigate('LoginPage')}>
        <Text style={styles.buttonText}>Go back to Logging in</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2196F3',
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
    color: '#333',
  },
  invalid: {
    borderColor: 'red',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  disabled: {
    backgroundColor: '#a9a9a9',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
