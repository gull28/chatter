import React, {useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {firebase} from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';

const db = firestore();
export const ViewGroup = ({navigation, route}) => {
  const {groupData} = route.params;
  const {groupDescription, name, id, count, bannedUsers, participants} =
    groupData;

  const user = firebase.auth().currentUser;

  const isBanned = bannedUsers.includes(user.uid);
  const isFull = participants.length >= count;

  const joinGroup = async () => {
    if (isBanned) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'You are banned from this group.',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 30,
        bottomOffset: 40,
      });
    } else if (isFull) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'This group is already full.',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 30,
        bottomOffset: 40,
      });
    } else {
      // join the group
      try {
        const groupRef = db.collection('chatGroups').doc(id);
        await groupRef.update({
          participants: firestore.FieldValue.arrayUnion(user.uid),
        });
        navigation.navigate('GroupChatPage', {chatId: id});
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
    }
  };

  return (
    <View style={{flex: 1, padding: 16}}>
      <BackButton onPress={() => navigation.goBack()} color="#2196F3" />
      <Text style={{marginTop: 16, fontSize: 24, fontWeight: 'bold'}}>
        {name}
      </Text>
      <Text style={{marginTop: 16, fontSize: 16}}>{groupDescription}</Text>
      <TouchableOpacity
        onPress={joinGroup}
        style={{
          marginTop: 16,
          backgroundColor: '#007AFF',
          borderRadius: 8,
          padding: 8,
        }}>
        <Text style={{color: '#FFF', fontSize: 16, fontWeight: 'bold'}}>
          Join Group
        </Text>
      </TouchableOpacity>
    </View>
  );
};
