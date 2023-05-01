import React, {useState, useEffect, useRef} from 'react';
import {
  FlatList,
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth, {firebase} from '@react-native-firebase/auth';
import ChatMessage from '../../components/ChatMessage';

const db = firestore();

export const GroupChatPage = ({navigation, route}) => {
  const {chatId} = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const flatListRef = useRef(null);

  const handleContentSizeChange = () => {
    if (!isScrolling) {
      flatListRef.current.scrollToEnd({animated: true});
    }
  };

  const handleLayout = () => {
    flatListRef.current.scrollToEnd({animated: true});
  };
  const currentUser = firebase.auth().currentUser;

  console.log('chatId', chatId);

  useEffect(() => {
    const conversationRef = db.collection('chatGroups').doc(chatId);
    const unsubscribe = conversationRef.onSnapshot(
      snapshot => {
        const conversationData = snapshot.data();
        const messages = conversationData.messages || [];
        setMessages(messages);
      },
      error => {
        console.error('Error fetching chat messages:', error);
      },
    );
    return unsubscribe;
  }, [chatId]);

  const renderMessage = ({item}) => {
    const {senderName, sendTime, content} = item;
    return (
      <ChatMessage sender={senderName} time={sendTime} message={content} />
    );
  };

  const handleSendMessage = async () => {
    if (newMessage.length === 0) {
      return; // Don't send empty messages
    }

    const conversationRef = db.collection('chatGroups').doc(chatId);
    try {
      const message = {
        id: Date.now().toString(),
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

  return (
    <SafeAreaView style={{flex: 1}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 15,
        }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{fontSize: 18}}>{'< '}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{flex: 1}}
          onPress={() => console.log('Clicked group name')}>
          <Text style={{fontSize: 18, fontWeight: 'bold', textAlign: 'center'}}>
            Group Name
          </Text>
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
