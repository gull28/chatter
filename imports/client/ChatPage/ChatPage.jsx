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
    const conversationRef = db.collection('conversations').doc(chatId);

    conversationRef.get().then(doc => {
      if (doc.exists) {
        const conversation = doc.data();
        const messages = conversation.messages || [];
        setMessages(messages);
      }
    });
  }, [chatId]);

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

  const handleContentSizeChange = () => {
    if (messages.length > 0 && !isScrolling) {
      flatListRef.current.scrollToEnd({animated: true});
    }
  };

  const handleLayout = () => {
    flatListRef.current.scrollToEnd({animated: true});
  };

  const handleRealtimeUpdates = snapshot => {
    const updatedConversation = snapshot.data();
    const updatedMessages = updatedConversation.messages;
    setMessages(updatedMessages);
  };

  // Add a listener to the conversation document to listen for changes
  useEffect(() => {
    const conversationRef = db.collection('conversations').doc(chatId);
    const unsubscribe = conversationRef.onSnapshot(handleRealtimeUpdates);

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    const conversationRef = db.collection('conversations').doc(chatId);
    conversationRef.onSnapshot(doc => {
      if (doc.exists) {
        const conversationData = doc.data();
        const messages = conversationData.messages || [];
        setMessages(messages);
      }
    });

    // Cleanup listener
    return () => conversationRef.onSnapshot(() => {});
  }, [chatId]);

  const renderMessage = ({item}) => {
    const {senderName, sendTime, content, sender, id} = item;
    return (
      <ChatMessage
        sender={senderName}
        senderId={sender}
        time={sendTime}
        message={content}
        currentUser={currentUser.uid}
        navigation={navigation}
      />
    );
  };

  const handleSendMessage = () => {
    if (newMessage.length === 0) {
      return; // Don't send empty messages
    }

    const conversationRef = db.collection('conversations').doc(chatId);
    const message = {
      id: Date.now().toString(),
      content: newMessage,
      sendTime: new Date().toISOString(),
      sender: currentUser,
      senderName: currentUserData.username,
    };

    conversationRef
      .update({
        messages: firestore.FieldValue.arrayUnion(message),
      })
      .then(() => {
        setNewMessage('');
      })
      .catch(error => {
        console.error('Error adding new message: ', error);
      });
  };
  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.navigate('MenuPage')}
          color="#2196F3"
        />
        <TouchableOpacity
          style={{flex: 1}}
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
          <Text>No messages yet</Text>
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 10,
        }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderRadius: 5,
            paddingHorizontal: 10,
          }}
          onChangeText={text => setNewMessage(text)}
          placeholder="Type a message"
          value={newMessage}
        />
        <Text
          style={{marginLeft: 10, color: 'blue'}}
          onPress={handleSendMessage}>
          Send
        </Text>
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
  },
});
