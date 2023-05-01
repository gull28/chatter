import React, {useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {firebase} from '@react-native-firebase/auth';
import {Toast} from 'react-native-toast-message/lib/src/Toast';

const db = firestore();
export const ViewGroup = ({navigation, route}) => {
  const {groupData} = route.params;
  const {groupDescription, name, id} = groupData;

  const user = firebase.auth().currentUser;

  const onClose = () => {
    navigation.goBack();
  };

  const joinGroup = async () => {
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
  };

  return (
    <View style={{flex: 1, padding: 16}}>
      <TouchableOpacity onPress={onClose}>
        <Text style={{fontSize: 16, fontWeight: 'bold'}}>Back</Text>
      </TouchableOpacity>
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
