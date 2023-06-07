import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React, {useEffect} from 'react';
import {LandingPage} from './imports/client/LandingPage/LandingPage';
import {LoginPage} from './imports/client/LoginPage/LoginPage';
import {MenuPage} from './imports/client/MenuPage/MenuPage';
import {RegisterPage} from './imports/client/RegisterPage/RegisterPage';
import {ProfilePage} from './imports/client/ProfilePage/ProfilePage';
import Toast from 'react-native-toast-message';
import {DeleteAccountPage} from './imports/client/DeleteAccountPage/DeleteAccountPage';
import {OtherUserProfilePage} from './imports/client/OtherUserProfilePage/OtherUserProfilePage';
import {ChatPage} from './imports/client/ChatPage/ChatPage';
import {GroupChatPage} from './imports/client/ChatPage/GroupChatPage';
import {ViewGroup} from './imports/client/ViewGroup/ViewGroup';
import {errorToast} from './imports/helpers/helpers';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// npx react-native start
// npx react-native run-android

const Stack = createNativeStackNavigator();

const App = ({navigation}) => {
  const checkUserBanned = async () => {
    const currentUser = auth().currentUser;

    if (currentUser) {
      const bannedUsersRef = firestore().collection('bannedUsers');
      const snapshot = await bannedUsersRef.doc(currentUser.uid).get();

      if (snapshot.exists) {
        // User is banned, redirect to LoginPage
        // Replace 'LoginPage' with the actual screen/component name
        errorToast('You have been banned for bad behaviour!');
        await auth().signOut();
        navigation.navigate('LoginPage');
      }
    }
  };

  useEffect(() => {
    checkUserBanned();
  }, []);

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerBackVisible: false}}>
          <Stack.Screen
            name="LandingPage"
            component={LandingPage}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="LoginPage"
            component={LoginPage}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="RegisterPage"
            component={RegisterPage}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="MenuPage"
            component={MenuPage}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ProfilePage"
            component={ProfilePage}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="DeleteAccountPage"
            component={DeleteAccountPage}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="OtherUserProfilePage"
            component={OtherUserProfilePage}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name={'ChatPage'}
            component={ChatPage}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name={'GroupChatPage'}
            component={GroupChatPage}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name={'ViewGroup'}
            component={ViewGroup}
            options={{headerShown: false}}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  );
};
export default App;
