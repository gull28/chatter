import React, {useState, useEffect, useRef} from 'react';
import {
  FlatList,
  View,
  Text,
  SafeAreaView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth, {firebase} from '@react-native-firebase/auth';
import {ChatMessage} from '../../components/ChatMessage';
import {BackButton} from '../../components/BackArrow';
import {errorToast} from '../../helpers/helpers';

const db = firestore();

export const ChatPage = ({navigation, route}) => {
  const {chatId, chatType, participantId} = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const [participantInfo, setParticipantInfo] = useState({});
  const [currentUserData, setCurrentUserData] = useState({});

  const currentUser = firebase.auth().currentUser.uid;
  const flatListRef = useRef(null);

  useEffect(() => {
    const getUserData = async () => {
      const userDocRef = db.collection('users').doc(participantId);
      const userDataRefDoc = await userDocRef.get();
      const userData = userDataRefDoc.data();
      setParticipantInfo(userData);
    };

    const getCurrentUserData = async () => {
      const userDocRef = db.collection('users').doc(currentUser);
      const userDataRefDoc = await userDocRef.get();
      const userData = userDataRefDoc.data();
      setCurrentUserData(userData);
    };

    getCurrentUserData();
    getUserData();
  }, [participantId]);

  useEffect(() => {
    const conversationRef = db
      .collection('conversations')
      .doc(chatId)
      .collection('messages');

    const unsubscribe = conversationRef
      .orderBy('sendTime')
      .onSnapshot(snapshot => {
        const updatedMessages = [];
        snapshot.forEach(doc => {
          updatedMessages.push(doc.data());
        });
        setMessages(updatedMessages);
      });

    return () => {
      unsubscribe();
    };
  }, [chatId]);

  const handleContentSizeChange = () => {
    if (messages.length > 0 && !isScrolling) {
      flatListRef.current.scrollToEnd({animated: true});
    }
  };

  const handleLayout = () => {
    flatListRef.current.scrollToEnd({animated: true});
  };

  const renderMessage = ({item}) => {
    const {senderName, sendTime, content, sender, id, email} = item;
    return (
      <ChatMessage
        key={sendTime}
        sender={senderName}
        senderId={sender}
        email={email}
        time={sendTime}
        message={content}
        currentUser={currentUser.uid}
        navigation={navigation}
      />
    );
  };

  const handleSendMessage = async () => {
    if (newMessage.length === 0) {
      return; // Don't send empty messages
    }

    if (newMessage.length > 1000) {
      errorToast('Message exceeds the maximum limit of 1000 characters');
      return; // Don't send the message if it exceeds the limit
    }

    const conversationRef = db
      .collection('conversations')
      .doc(chatId)
      .collection('messages');

    try {
      const message = {
        id: Date.now().toString(),
        content: newMessage,
        sendTime: new Date().toISOString(),
        sender: currentUser,
        senderName: currentUserData.username,
      };

      await conversationRef.add(message); // Add the message to the messages subcollection

      setNewMessage('');
    } catch (error) {
      errorToast(error.message);
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.navigate('MenuPage')}
          color="#2196F3"
        />
        <TouchableOpacity
          style={{flex: 1, alignItems: 'center'}}
          onPress={() => {
            navigation.navigate('OtherUserProfilePage', {
              result: participantInfo,
            });
          }}>
          <Text style={styles.headerTitle}>{participantInfo.username}</Text>
        </TouchableOpacity>
      </View>
      {messages && messages.length === 0 ? (
        <View style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
          <Text style={{color: 'black'}}>No messages yet</Text>
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 10,
          margin: 7,
        }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderRadius: 5,
            paddingHorizontal: 10,
            color: '#111',
            backgroundColor: 'white',
          }}
          placeholderTextColor="black"
          onChangeText={text => setNewMessage(text)}
          placeholder="Type a message"
          value={newMessage}
        />
        <View style={styles.sendButton}>
          <Text style={styles.sendButtonText} onPress={handleSendMessage}>
            Send
          </Text>
        </View>
      </View>
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
    color: '#000',
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
