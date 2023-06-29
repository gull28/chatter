import React, {useState, useEffect, useRef} from 'react';
import {
  FlatList,
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {firebase} from '@react-native-firebase/auth';
import {ChatMessage} from '../../components/ChatMessage';
import {FriendsList} from '../../components/FriendsList';
import {Dropdown} from '../../components/Dropdown';
import Toast from 'react-native-toast-message';
import {BackButton} from '../../components/BackArrow';
import {errorToast, successToast} from '../../helpers/helpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {leaveChatGroup} from '../../helpers/methods';

const db = firestore();

export const GroupChatPage = ({navigation, route}) => {
  const {chatId} = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [chatInfo, setChatInfo] = useState({});
  const [isGroupOwner, setIsGroupOwner] = useState(false);
  const [isUserGroupAdmin, setIsUserGroupAdmin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [usersCount, setUsersCount] = useState('');
  const [accessible, setAccessible] = useState(false);
  const [groupDescription, setGroupDescription] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false); // Flag to track if a message is currently being sent
  const [remainingMessageCount, setRemainingMessageCount] = useState(5); // Number of remaining messages allowed within the time window
  const [isSendAllowed, setIsSendAllowed] = useState(true); // Flag to track if sending messages is allowed
  const [storedMessages, setStoredMessages] = useState([]);

  const flatListRef = useRef(null);

  const currentUser = firebase.auth().currentUser;

  const items = [
    {label: 'Public', value: true},
    {label: 'Private', value: false},
  ];

  const handleContentSizeChange = () => {
    if (!isScrolling) {
      flatListRef.current.scrollToEnd({animated: true});
    }
  };

  const handleLayout = () => {
    flatListRef.current.scrollToEnd({animated: true});
  };
  useEffect(() => {
    const conversationRef = db.collection('chatGroups').doc(chatId);
    const messagesRef = conversationRef.collection('messages'); // Reference to the messages subcollection

    const unsubscribeConversation = conversationRef.onSnapshot(snapshot => {
      const conversationData = snapshot.data();
      setIsGroupOwner(conversationData.groupOwner === currentUser.uid);
      setIsUserGroupAdmin(conversationData.admins.includes(currentUser.uid));
      const isBanned = conversationData.bannedUsers.includes(currentUser.uid);
      conversationData.id = chatId;
      setGroupName(conversationData.name);
      setUsersCount(conversationData.count);
      if (conversationData.accessibility) {
        setAccessible({label: 'Public', value: true});
      } else {
        setAccessible({label: 'Private', value: false});
      }

      if (isBanned) {
        navigation.navigate('MenuPage');
      }
      setGroupDescription(conversationData.groupDescription);
      setChatInfo(conversationData);
    });

    const unsubscribeMessages = messagesRef
      .orderBy('sendTime')
      .onSnapshot(snapshot => {
        const messages = snapshot.docs.map(doc => {
          const messageData = doc.data();
          const updatedMessage = {id: doc.id, ...messageData};

          if (
            messageData.usersRead &&
            !messageData.usersRead.includes(currentUser.uid)
          ) {
            updatedMessage.usersRead = [
              ...messageData.usersRead,
              currentUser.uid,
            ];
          } else if (!messageData.usersRead) {
            updatedMessage.usersRead = [currentUser.uid];
          }

          return updatedMessage;
        });

        // commit the changes using batch
        const batch = db.batch();
        messages.forEach(message => {
          const messageRef = messagesRef.doc(message.id);
          batch.update(messageRef, {usersRead: message.usersRead});
        });
        batch.commit();

        setMessages(messages);
      });
    return () => {
      unsubscribeConversation();
      unsubscribeMessages();
    };
  }, [chatId]);

  const handleEditModalClose = () => {
    setIsEditModalVisible(false);
    if (chatInfo.accessibility) {
      setAccessible({label: 'Public', value: true});
    } else {
      setAccessible({label: 'Private', value: false});
    }
    setGroupDescription(chatInfo.groupDescription);
    setGroupName(chatInfo.name);
    setUsersCount(chatInfo.count);
  };

  const handleDeleteGroup = async () => {
    try {
      const groupRef = db.collection('chatGroups').doc(chatId);
      await groupRef.delete();
      setIsModalVisible(false);
      navigation.navigate('MenuPage');
      successToast('Successfully deleted group!');
    } catch (error) {
      errorToast(error.message);
    }
  };

  const renderMessage = ({item}) => {
    const {senderName, sendTime, content, sender, email} = item;
    const showThird = isUserGroupAdmin || isGroupOwner;
    return (
      <ChatMessage
        sender={senderName}
        senderId={sender}
        time={sendTime}
        message={content}
        currentUser={currentUser.uid}
        groupInfo={chatInfo}
        groupMessage={true}
        showThird={showThird}
        navigation={navigation}
      />
    );
  };

  const handleUpdateGroup = async (
    usersCount,
    groupName,
    groupDescription,
    accessibility,
  ) => {
    if (!accessibility) {
      errorToast('Enter accessibility');
      return;
    }

    if (usersCount < 2 || usersCount > 2000) {
      // Handle invalid count
      errorToast('Invalid users count!');
      return;
    }

    if (groupName.length > 25 || !/^[a-zA-Z0-9\s]+$/.test(groupName)) {
      // Handle invalid name
      errorToast('Invalid group name!');
      return;
    }

    if (groupDescription.length > 400) {
      // Handle invalid description
      errorToast('Invalid description');
      return;
    }

    const docRef = db.collection('chatGroups').doc(chatId);
    docRef
      .update({
        count: usersCount,
        name: groupName,
        groupDescription,
        accessibility,
      })
      .then(() => {
        navigation.navigate('MenuPage');
        successToast('Group parameters successfully updated!');
      });
  };

  const handleSendMessage = async () => {
    if (newMessage.length === 0) {
      return; // Don't send empty messages
    }

    const messagesRef = db
      .collection('chatGroups')
      .doc(chatId)
      .collection('messages'); // Reference to the messages subcollection

    if (!isSendAllowed) {
      errorToast(
        'You have reached the message sending limit. Please wait before sending more messages.',
      );
      return; // Don't send the message if the limit has been reached
    }

    if (isSendingMessage) {
      return; // Don't send another message while a message is being sent
    }

    setIsSendingMessage(true);

    try {
      const message = {
        content: newMessage,
        sendTime: new Date().toISOString(),
        sender: currentUser.uid,
        senderName: currentUser.displayName, // Add sender's username to message object
        usersRead: [currentUser.uid], // Add sender's uid to the usersRead array
      };

      await messagesRef.add(message); // Add the message to the messages subcollection

      setNewMessage('');

      setRemainingMessageCount(prevCount => prevCount - 1);

      if (remainingMessageCount === 1) {
        // Disable sending messages when the limit is reached
        setIsSendAllowed(false);

        setTimeout(() => {
          setIsSendAllowed(true);
          setRemainingMessageCount(5);
        }, 10000);
      }
    } catch (error) {
      errorToast(error.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getGroupParticipants = async groupId => {
    const userDocRef = firestore().collection('chatGroups').doc(groupId);
    const userDoc = await userDocRef.get();
    const participants = userDoc.get('participants') || [];

    const chunkedParticipants = chunkArray(participants, 10);
    const participantSnapshots = [];

    for (const chunk of chunkedParticipants) {
      const chunkSnapshots = await firestore()
        .collection('users')
        .where(firebase.firestore.FieldPath.documentId(), 'in', chunk)
        .get();
      participantSnapshots.push(...chunkSnapshots.docs);
    }

    const userFriendsNames = participantSnapshots.map(doc => ({
      id: doc.id,
      username: doc.data().username,
      email: doc.data().email,
    }));
    return userFriendsNames;
  };

  function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
  return (
    <SafeAreaView style={{flex: 1, paddingBottom: 10}}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.navigate('MenuPage')}
          color="#2196F3"
        />
        <TouchableOpacity
          style={{flex: 1}}
          onPress={() => setIsModalVisible(true)}>
          <Text style={styles.headerTitle}>{chatInfo.name}</Text>
        </TouchableOpacity>
        {isGroupOwner && (
          <TouchableOpacity
            style={{flex: 1}}
            onPress={() => setIsEditModalVisible(true)}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
      {messages && messages.length === 0 ? (
        <View style={styles.noMessagesContainer}>
          <Text style={styles.noMessagesText}>No messages yet</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => `${item.sender}-${item.sendTime}`}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleLayout}
        />
      )}
      <View style={styles.footer}>
        <TextInput
          style={styles.input}
          placeholderTextColor="black"
          onChangeText={text => setNewMessage(text)}
          placeholder="Type a message"
          value={newMessage}
          editable={isSendAllowed} // Disable editing if sending messages is not allowed
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={isEditModalVisible} animationType="slide">
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>Edit group parameters</Text>
          </View>
          <View style={modalStyles.contentContainer2}>
            <TextInput
              style={modalStyles.input}
              placeholderTextColor="black"
              placeholder="Group Name"
              value={groupName}
              onChangeText={text => setGroupName(text)}
            />
            <TextInput
              style={modalStyles.input}
              placeholder="Number of Users"
              value={usersCount}
              placeholderTextColor="black"
              keyboardType="phone-pad"
              contextMenuHidden={true}
              onChangeText={text => setUsersCount(text)}
            />
            <Dropdown
              options={items}
              selectedValue={accessible}
              onValueChange={value => setAccessible(value)}
            />
            <TextInput
              style={modalStyles.descriptionInput}
              placeholder="Edit the description!"
              placeholderTextColor="black"
              value={groupDescription}
              multiline={true}
              onChangeText={text => setGroupDescription(text)}
            />
            <View
              style={{
                flex: 1,
                alignContent: 'flex-end',
                justifyContent: 'flex-end',
              }}>
              <TouchableOpacity
                style={modalStyles.createButton}
                onPress={() =>
                  handleUpdateGroup(
                    usersCount,
                    groupName,
                    groupDescription,
                    accessible.value,
                  )
                }>
                <Text style={modalStyles.createButtonText}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{...modalStyles.cancelButton, margin: 0}}
                onPress={() => handleEditModalClose()}>
                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Toast />
      </Modal>
      <Modal visible={isModalVisible} animationType="slide">
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>{chatInfo.name}</Text>
          </View>
          <View style={modalStyles.contentContainer}>
            <FriendsList
              navigation={navigation}
              getUserListData={async () => await getGroupParticipants(chatId)}
              isGroupList={true}
              groupInfo={chatInfo}
            />
            {isGroupOwner ? (
              <>
                <TouchableOpacity
                  style={modalStyles.deleteButton}
                  onPress={() => setShowConfirmDelete(true)}>
                  <Text style={modalStyles.deleteButtonText}>Delete Group</Text>
                </TouchableOpacity>
                {showConfirmDelete && (
                  <>
                    <Text style={modalStyles.confirmText}>
                      Are you sure you want to delete this group?
                    </Text>
                    <TouchableOpacity
                      style={modalStyles.deleteButton}
                      onPress={handleDeleteGroup}>
                      <Text style={modalStyles.deleteButtonText}>
                        Confirm Delete
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={modalStyles.cancelButton}
                      onPress={() => setShowConfirmDelete(false)}>
                      <Text style={modalStyles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              <TouchableOpacity
                style={modalStyles.leaveButton}
                onPress={() =>
                  leaveChatGroup(isUserGroupAdmin, chatId, currentUser).then(
                    () => {
                      setIsModalVisible(false);
                      navigation.navigate('MenuPage');
                    },
                  )
                }>
                <Text style={modalStyles.leaveButtonText}>Leave Group</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={modalStyles.cancelButton}
              onPress={() => setIsModalVisible(false)}>
              <Text style={modalStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000', // Set the color to black
  },
  editButton: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#2196F3', // Set the color to #2196F3
  },
  noMessagesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMessagesText: {
    fontSize: 18,
    color: '#000', // Set the color to black
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: '#000', // Set the color to black
    backgroundColor: 'white',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#2196F3',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f2f2f2',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },

  contentContainer: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 1,
    paddingTop: 5,
  },
  contentContainer2: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 10,
    paddingTop: 5,
  },

  input: {
    width: '100%',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    color: '#000',
    backgroundColor: 'white',
  },
  createButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
  },
  descriptionInput: {
    height: 120,
    width: '100%',
    paddingHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    textAlignVertical: 'top',
    marginTop: 10,
    marginBottom: 10,
    color: '#000',
    backgroundColor: 'white',
  },
  createButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 5,
    margin: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  leaveButton: {
    backgroundColor: '#f44336',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 5,
    margin: 10,
  },
  leaveButtonText: {
    color: '#FFFFFF', // Set the color to #2196F3
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    margin: 10,
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
