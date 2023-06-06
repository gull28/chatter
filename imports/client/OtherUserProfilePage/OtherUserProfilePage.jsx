import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Toast from 'react-native-toast-message';
import auth, {firebase} from '@react-native-firebase/auth';
import {BackButton} from '../../components/BackArrow';
import {Dropdown} from '../../components/Dropdown';
import {successToast} from '../../helpers/helpers';

const db = firestore();

export const OtherUserProfilePage = ({route, navigation}) => {
  const {result} = route.params;
  const {username, id, email} = result;
  console.log(result);
  const currentUser = firebase.auth().currentUser;

  const items = [
    {label: '', value: ''},
    {label: 'Profanity', value: 'profanity'},
    {label: 'Racism or prejudice', value: 'racism'},
    {label: 'Threats or violence', value: 'threats'},
  ];

  const [isFriend, setIsFriend] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const userDocRef = db.collection('users').doc(currentUser.uid);
      const userDoc = await userDocRef.get();
      const blockedUsers = userDoc.get('blockedUsers') || [];
      const blockedUserIndex = blockedUsers.indexOf(String(id));

      const friends = userDoc.get('friends') || [];
      const friendIndex = friends.indexOf(String(id));

      if (blockedUserIndex >= 0) {
        // Remove the user from the blocked users list
        setIsBlocked(true);
      }

      if (friendIndex >= 0) {
        // Remove the friend if they're already in the list
        setIsFriend(true);
      }
    };

    fetchData();
  }, []);

  const handleReportModalClose = () => {
    setReportReason('');
    setComment('');
    setIsReportModalVisible(false);
  };

  const handleBlock = async () => {
    const currentUser = firebase.auth().currentUser;
    const userDocRef = db.collection('users').doc(currentUser.uid);
    const userDoc = await userDocRef.get();
    const blockedUsers = userDoc.get('blockedUsers') || [];
    const blockedUserIndex = blockedUsers.indexOf(String(id));

    if (blockedUserIndex >= 0) {
      // Remove the user from the blocked users list
      blockedUsers.splice(blockedUserIndex, 1);
      setIsBlocked(false);
    } else {
      // Add the user to the blocked users list
      blockedUsers.push(id);
      setIsBlocked(true);
    }

    await userDocRef.update({blockedUsers});
  };

  const handleAddFriend = async () => {
    const currentUser = firebase.auth().currentUser;
    const userDocRef = db.collection('users').doc(currentUser.uid);
    const userDoc = await userDocRef.get();
    const friends = userDoc.get('friends') || [];
    const friendIndex = friends.indexOf(String(id));

    if (friendIndex >= 0) {
      // Remove the friend if they're already in the list
      friends.splice(friendIndex, 1);
      setIsFriend(false);
    } else {
      // Add the friend if they're not already in the list
      friends.push(id);
      setIsFriend(true);
    }

    await userDocRef.update({friends});
  };

  async function findConversationId(currentUserUid, otherUserUid) {
    // Query the conversations collection for any documents with the current user as a participant
    const querySnapshot = await firebase
      .firestore()
      .collection('conversations')
      .where('participants', 'array-contains', currentUserUid)
      .get();

    // Loop through the documents in the query result
    for (const doc of querySnapshot.docs) {
      // Check if the document also contains the other user as a participant
      if (doc.data().participants.includes(otherUserUid)) {
        // If so, return the document ID
        return doc.id;
      }
    }

    // If no document was found, create a new conversation document
    const newConversationRef = firebase
      .firestore()
      .collection('conversations')
      .doc();
    const newConversationId = newConversationRef.id;

    await newConversationRef.set({
      participants: [currentUserUid, otherUserUid],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      messages: [],
    });

    return newConversationId;
  }

  const sendReport = async (comment, reason) => {
    console.log('userDati', {email, comment, reason});
    await db
      .collection('userReports')
      .doc()
      .set({
        comment,
        reason: reason,
        open: true,
        sendUser: currentUser.uid,
        reportedUsername: username,
        reportedUser: id,
        email,
      })
      .then(() => {
        handleReportModalClose();
        successToast('Successfully reported user!');
      });
  };

  const handleChat = async () => {
    const chatId = await findConversationId(
      firebase.auth().currentUser.uid,
      id,
    );
    navigation.navigate('ChatPage', {
      chatId,
      chatType: 'conversation',
      participantId: id,
    });
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} color="#2196F3" />
        <Text style={styles.title}>{username}</Text>
        <View style={{flex: 1}} />
      </View>
      <View style={styles.content}>
        <TouchableOpacity
          onPress={handleAddFriend}
          style={[
            styles.button,
            isFriend ? styles.removeFriendButton : styles.addFriendButton,
          ]}>
          <Text style={styles.buttonText}>
            {isFriend ? 'Remove Friend' : 'Add Friend'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleBlock}
          style={[
            styles.button,
            isBlocked ? styles.unblockButton : styles.blockButton,
          ]}>
          <Text style={styles.buttonText}>
            {isBlocked ? 'Unblock' : 'Block'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleChat}
          disabled={isBlocked}
          style={[
            styles.button,
            isBlocked ? styles.disabledButton : styles.chatButton,
          ]}>
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsReportModalVisible(true)}
          style={styles.reportButton}>
          <Text style={styles.buttonText}>Report</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={isReportModalVisible} animationType="fade">
        <View style={modalStyles.modalContainer}>
          <Text style={modalStyles.title}>Report User: {username}</Text>
          <View style={modalStyles.inputContainer}>
            <Dropdown
              options={items}
              selectedValue={reportReason}
              onValueChange={value => setReportReason(value)}
              containerStyle={modalStyles.dropdownContainer}
              dropdownStyle={modalStyles.dropdown}
            />
            <TextInput
              style={[modalStyles.input, modalStyles.textInput]}
              placeholder="Comment"
              value={comment}
              onChangeText={text => setComment(text)}
              multiline
              numberOfLines={4}
            />
          </View>

          {comment && (
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.reportButton]}
              onPress={() => sendReport(comment, reportReason)}>
              <Text style={modalStyles.buttonText}>Report User</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[modalStyles.button, modalStyles.cancelButton]}
            onPress={() => handleReportModalClose()}>
            <Text
              style={[modalStyles.buttonText, modalStyles.cancelButtonText]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addFriendButton: {
    backgroundColor: '#2196F3',
  },
  removeFriendButton: {
    backgroundColor: '#f44336',
  },
  blockButton: {
    backgroundColor: '#2196F3',
  },
  unblockButton: {
    backgroundColor: '#f44336',
  },
  chatButton: {
    backgroundColor: '#2196F3',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  reportButton: {
    backgroundColor: '#f44336',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    minWidth: 200,
  },
  input: {
    backgroundColor: '#eee',
    borderRadius: 4,
    padding: 8,
    marginVertical: 8,
    height: 80,
    textAlignVertical: 'top',
  },
});

const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'space-between', // Added to make cancel button stick to the bottom
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  dropdownContainer: {
    flex: 1,
    marginRight: 10,
  },
  dropdown: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  textInput: {
    minHeight: 100,
    marginTop: 10,
    color: '#000',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  reportButton: {
    backgroundColor: '#FF4136',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#000',
    marginBottom: 10,
  },
});
