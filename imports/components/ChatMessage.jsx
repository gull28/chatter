import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {Dropdown} from './Dropdown';
import {errorToast, successToast} from '../helpers/helpers';
import {firebase} from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';

const moment = require('moment');

const db = firestore();

export const ChatMessage = ({
  navigation,
  senderId,
  sender,
  time,
  message,
  showThird,
  groupInfo = {},
  groupMessage = false,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userEmail, setUserEmail] = useState({});
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const currentUser = firebase.auth().currentUser.uid;

  const handlePress = () => {
    setShowOptions(!showOptions);
  };

  useEffect(() => {
    const userDoc = db.collection('users').doc(senderId);
    userDoc.get().then(doc => {
      setUserEmail(doc.data().email);
    });
  }, [senderId]);
  const items = [
    {label: '', value: ''},
    {label: 'Profanity', value: 'profanity'},
    {label: 'Racism or prejudice', value: 'racism'},
    {label: 'Threats or violence', value: 'threats'},
  ];

  const handleBan = async (chatGroupId, friendId) => {
    if (groupMessage) {
      const userId = friendId; // user to be banned
      const chatGroupsRef = db.collection('chatGroups').doc(groupInfo.id);

      try {
        const chatGroupsSnapshot = await chatGroupsRef.get();

        if (!chatGroupsSnapshot.exists) {
          return;
        }

        const data = chatGroupsSnapshot.data();
        const admins = data.admins || [];
        const participants = data.participants || [];

        const batch = db.batch();

        if (admins.includes(userId)) {
          batch.update(chatGroupsRef, {
            admins: admins.firestore.FieldValue.arrayRemove(userId),
          });
        }

        if (participants.includes(userId)) {
          batch.update(chatGroupsRef, {
            participants: admins.firestore.FieldValue.arrayRemove(userId),
          });
        }

        const messagesSubcollectionRef = chatGroupsRef.collection('messages');
        const messagesQuerySnapshot = await messagesSubcollectionRef
          .where('sender', '==', userId)
          .get();

        messagesQuerySnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        navigation.navigate('MenuPage');
      } catch (error) {
        errorToast(
          `Error banning user with id ${userId} from chat group ${chatGroupId}: ${error}`,
        );
      }
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
        reportedUsername: sender,
        reportedUser: senderId,
        email: userEmail,
      })
      .then(() => {
        handleReportModalClose();
        successToast('Successfully reported user message!');
      });
  };

  const sendTime = moment(time).fromNow();
  const messageStyle = {
    alignSelf: currentUser === senderId ? 'flex-end' : 'flex-start',
    backgroundColor: currentUser === senderId ? '#b6edfc' : '#E5E5EA',
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
            onPress={() => {
              navigation.navigate('OtherUserProfilePage', {
                result: {username: sender, id: senderId, email: userEmail},
              });
            }}>
            <Text style={{color: 'black'}}>View profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={() => setIsReportModalVisible(true)}>
            <Text style={{color: 'black'}}>Report message</Text>
          </TouchableOpacity>
          {showThird && (
            <TouchableOpacity
              style={styles.option}
              onPress={() => setIsModalVisible(true)}>
              <Text style={{color: 'black'}}>Ban user</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <Modal visible={isReportModalVisible} animationType="fade">
        <View style={modalStyles.modalContainer}>
          <Text style={modalStyles.title}>Report User: {sender} message</Text>
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
    color: '#000000', // Updated color to black
  },
  message: {
    fontSize: 16,
    color: '#000000', // Updated color to black
  },
  time: {
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 5,
    color: '#000000', // Updated color to black
  },
  optionsContainer: {
    marginTop: 10,
    flexDirection: 'row',
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
    color: '#000000', // Updated color to black
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 10,
    color: '#000000', // Updated color to black
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
    color: '#000000', // Updated color to black
  },
  message: {
    fontSize: 16,
    marginBottom: 10,
    color: '#000000', // Updated color to black
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
