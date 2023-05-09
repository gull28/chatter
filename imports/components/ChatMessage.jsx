import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Dropdown from './Dropdown';
import {Toast} from 'react-native-toast-message/lib/src/Toast';

const moment = require('moment');

const db = firestore();

const ChatMessage = ({
  navigation,
  senderId,
  sender,
  time,
  message,
  currentUser,
  showThird,
  groupInfo = {},
  groupMessage = false,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userData, setUserData] = useState({});
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const handlePress = () => {
    if (senderId !== currentUser) {
      setShowOptions(!showOptions);
    }
  };

  const items = [
    {label: '', value: ''},
    {label: 'Profanity', value: 'profanity'},
    {label: 'Racism or prejudice', value: 'racism'},
    {label: 'Threats or violence', value: 'threats'},
  ];
  useEffect(() => {
    const getUserData = async () => {
      const userDocRef = db.collection('users').doc(senderId);
      const userRef = await userDocRef.get();
      const userData = userRef.data();
      userData.id = senderId;
      setUserData(userData);
    };
    getUserData();
  }, [showOptions]);

  const handleBan = (chatGroupId, friendId) => {
    if (groupMessage) {
      const userId = friendId; // user to be banned
      const chatGroupsRef = db.collection('chatGroups').doc(groupInfo.id);
      // Check if current user is an admin
      // Remove all messages that contain the banned user's id
      // Remove the banned user from the admins and participants arrays
      chatGroupsRef
        .get()
        .then(doc => {
          if (!doc.exists) {
            console.log(`Chat group with id ${chatGroupId} does not exist`);
            return;
          }

          const data = doc.data();
          const admins = data.admins || [];
          const participants = data.participants || [];

          const batch = firestore().batch();

          if (admins.includes(userId)) {
            batch.update(chatGroupsRef, {
              admins: firestore.FieldValue.arrayRemove(userId),
            });
          }

          if (participants.includes(userId)) {
            batch.update(chatGroupsRef, {
              participants: firestore.FieldValue.arrayRemove(userId),
            });
          }

          batch.update(chatGroupsRef, {
            messages: firestore.FieldValue.arrayRemove(
              ...data.messages.filter(message => message.sender === userId),
            ),
          });

          batch
            .commit()
            .then(() => {
              navigation.navigate('MenuPage');
            })
            .catch(error => {
              console.error(
                `Error banning user with id ${userId} from chat group ${chatGroupId}: ${error}`,
              );
            });
        })
        .catch(error => {
          console.error(
            `Error retrieving chat group with id ${chatGroupId}: ${error}`,
          );
        });
    }
  };

  const handleReportModalClose = () => {
    setReportReason('');
    setIsReportModalVisible(false);
  };

  const sendReport = async (message, reason) => {
    await db
      .collection('userReports')
      .doc()
      .set({
        message,
        reason: reason.value,
        open: true,
        sendUser: currentUser,
      })
      .then(() => {
        handleReportModalClose();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Successfully reported user message!',
          visibilityTime: 2000,
          autoHide: true,
          topOffset: 30,
          bottomOffset: 40,
        });
      });
  };

  const sendTime = moment(time).fromNow();

  const messageStyle = {
    alignSelf: currentUser === senderId ? 'flex-end' : 'flex-start',
    backgroundColor: currentUser === senderId ? '#DCF8C6' : '#E5E5EA',
  };

  const senderTextStyle = {
    fontWeight: 'bold',
    marginBottom: 5,
    color: currentUser === senderId ? '#145C14' : '#000000',
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress}>
        <View style={[styles.messageContainer, messageStyle]}>
          <Text style={[styles.sender, senderTextStyle]}>{sender}</Text>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.time}>{sendTime}</Text>
        </View>
      </TouchableOpacity>
      {showOptions && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.option}
            onPress={() =>
              navigation.navigate('OtherUserProfilePage', {result: userData})
            }>
            <Text>View profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={() => setIsReportModalVisible(true)}>
            <Text>Report message</Text>
          </TouchableOpacity>
          {showThird && (
            <TouchableOpacity
              style={styles.option}
              onPress={() => setIsModalVisible(true)}>
              <Text>Ban user</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <Modal visible={isReportModalVisible} animationType="fade">
        <View style={modalStyles.modalContainer}>
          <Text style={modalStyles.title}>Report User: {sender}</Text>
          <Text style={modalStyles.message}>{message}</Text>
          <Dropdown
            options={items}
            selectedValue={reportReason}
            onValueChange={value => setReportReason(value)}
          />
          {reportReason && (
            <TouchableOpacity
              style={modalStyles.button}
              onPress={() => sendReport(message, reportReason)}>
              <Text style={modalStyles.buttonText}>Report Message</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[modalStyles.button, modalStyles.cancelButton]}
            onPress={() => handleReportModalClose()}>
            <Text style={modalStyles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={isModalVisible} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            onPress={() => {
              handleBan(groupInfo.id, senderId);
            }}>
            <Text style={styles.modalTitle}>Ban user {sender}?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsModalVisible(false)}>
            <Text style={styles.modalTitle}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  messageContainer: {
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxWidth: '80%',
  },
  sender: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  message: {
    fontSize: 16,
  },
  time: {
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  optionsContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 10,
  },
  modalButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

const modalStyles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ChatMessage;
