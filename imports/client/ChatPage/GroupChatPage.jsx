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

    const unsubscribe = conversationRef.onSnapshot(
      snapshot => {
        const conversationData = snapshot.data();
        setIsGroupOwner(conversationData.groupOwner === currentUser.uid);
        setIsUserGroupAdmin(conversationData.admins.includes(currentUser.uid));

        conversationData.id = chatId;
        setGroupName(conversationData.name);
        setUsersCount(conversationData.count);
        if (conversationData.accessibility) {
          setAccessible({label: 'Public', value: true});
        } else {
          setAccessible({label: 'Private', value: false});
        }
        setGroupDescription(conversationData.groupDescription);
        setChatInfo(conversationData);
        const messages = conversationData.messages || [];
        setMessages(messages);
      },
      error => {
        console.error('Error fetching chat messages:', error);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [chatId]);

  const handleLeaveGroup = async () => {
    try {
      if (isUserGroupAdmin) {
        const groupRef = db.collection('chatGroups').doc(chatId);
        await groupRef.update({
          participants: firestore.FieldValue.arrayRemove(currentUser.uid),
          admins: firestore.FieldValue.arrayRemove(currentUser),
        });
      } else {
        const groupRef = db.collection('chatGroups').doc(chatId);
        await groupRef.update({
          participants: firestore.FieldValue.arrayRemove(user.uid),
        });
      }
      setIsModalVisible(false);
      navigation.navigate('MenuPage');
    } catch (error) {
      console.log(error);
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

  useEffect(() => {
    console.log(accessible);
  }, [accessible]);

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
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Successfully deleted group!',
        visibilityTime: 2000,
        autoHide: true,
        topOffset: 30,
        bottomOffset: 40,
      });
    } catch (error) {
      console.log(error);
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

  const renderMessage = ({item}) => {
    const {senderName, sendTime, content, sender} = item;

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
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Group parameters successfully updated!',
          visibilityTime: 4000,
          autoHide: true,
          topOffset: 30,
          bottomOffset: 40,
        });
      });
  };

  const handleSendMessage = async () => {
    if (newMessage.length === 0) {
      return; // Don't send empty messages
    }

    const conversationRef = db.collection('chatGroups').doc(chatId);
    try {
      const message = {
        content: newMessage,
        sendTime: new Date().toISOString(),
        sender: currentUser.uid,
        senderName: currentUser.displayName, // Add sender's username to message object
      };

      conversationRef.update({
        messages: firestore.FieldValue.arrayUnion(message),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error adding new message: ', error);
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
    <SafeAreaView style={{flex: 1}}>
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
            <Text style={styles.headerTitle}>Edit group</Text>
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
          keyExtractor={item => item.id}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleLayout}
        />
      )}
      <View style={styles.footer}>
        <TextInput
          style={styles.input}
          onChangeText={text => setNewMessage(text)}
          placeholder="Type a message"
          value={newMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={isEditModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create New Chat Group</Text>
          <TextInput
            style={styles.input}
            placeholder="Group Name"
            value={groupName}
            onChangeText={text => setGroupName(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Number of Users"
            value={usersCount}
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
            style={styles.input}
            placeholder="Edit the description!"
            value={groupDescription}
            onChangeText={text => setGroupDescription(text)}
          />
          <TouchableOpacity
            style={styles.createButton}
            onPress={() =>
              handleUpdateGroup(
                usersCount,
                groupName,
                groupDescription,
                accessible.value,
              )
            }>
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleEditModalClose()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{chatInfo.name}</Text>
          <View style={{flex: 1, justifyContent: 'space-between'}}>
            <FriendsList
              navigation={navigation}
              getUserListData={async () => await getGroupParticipants(chatId)}
              isGroupList={true}
              groupInfo={chatInfo}
            />
            {isGroupOwner ? (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteGroup}>
                <Text style={styles.deleteButtonText}>Delete Group</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={handleLeaveGroup}>
                <Text style={styles.leaveButtonText}>Leave Group</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noMessagesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMessagesText: {
    fontSize: 18,
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
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: 'blue',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f44336',
    borderRadius: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
