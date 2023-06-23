import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React, {useEffect} from 'react';
import {LandingPage} from './imports/client/LandingPage/LandingPage';
import {LoginPage} from './imports/client/LoginPage/LoginPage';
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
import {MenuPage} from './imports/client/MenuPage/MenuPage';
import withBanChecker from './imports/helpers/withBanChecker';
import withUserPresence from './imports/helpers/withUserPresence';
// npx react-native start
// npx react-native run-android
const Stack = createNativeStackNavigator();
const App = () => {
  const BanCheckerMenuPage = withBanChecker(MenuPage);
  const BanCheckerProfilePage = withBanChecker(ProfilePage);
  const BanCheckerDeleteAccountPage = withBanChecker(DeleteAccountPage);
  const BanCheckerOtherUserProfilePage = withBanChecker(OtherUserProfilePage);
  const BanCheckerChatPage = withBanChecker(ChatPage);
  const BanCheckerGroupChatPage = withBanChecker(GroupChatPage);
  const BanCheckerViewGroup = withBanChecker(ViewGroup);
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
            component={BanCheckerMenuPage}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ProfilePage"
            component={BanCheckerProfilePage}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="DeleteAccountPage"
            component={BanCheckerDeleteAccountPage}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="OtherUserProfilePage"
            component={BanCheckerOtherUserProfilePage}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name={'ChatPage'}
            component={BanCheckerChatPage}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name={'GroupChatPage'}
            component={BanCheckerGroupChatPage}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name={'ViewGroup'}
            component={BanCheckerViewGroup}
            options={{headerShown: false}}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  );
};

export default withUserPresence(App);
