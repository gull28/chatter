import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {firebase} from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import {BackButton} from '../../components/BackArrow';

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
    <View style={{flex: 1}}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} color="#2196F3" />
        <Text style={{marginTop: 16, fontSize: 24, fontWeight: 'bold'}}>
          {name}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={{marginTop: 16, fontSize: 16}}>{groupDescription}</Text>
        <TouchableOpacity
          onPress={joinGroup}
          style={{
            width: 250,
            marginTop: 16,
            backgroundColor: '#007AFF',
            borderRadius: 8,
            padding: 8,
            alignItems: 'center',
          }}>
          <Text style={{color: '#FFF', fontSize: 16, fontWeight: 'bold'}}>
            Join Group
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingRight: '35%',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
});
