import React, {useState, useEffect} from 'react';
import {FlatList, View, Text, SafeAreaView, TextInput} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth, {firebase} from '@react-native-firebase/auth';

const db = firestore();

export const ChatPage = ({navigation, route}) => {
  const {chatId, chatType, participantId} = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const currentUser = firebase.auth().currentUser.uid;

  useEffect(() => {
    const conversationRef = db.collection('conversations').doc(chatId);

    conversationRef.get().then(doc => {
      if (doc.exists) {
        const conversation = doc.data();
        const messages = conversation.messages;
        setMessages(messages);
      }
    });
  }, [chatId]);

  const handleRealtimeUpdates = snapshot => {
    console.log('Realtime update received:', snapshot);
    const updatedConversation = snapshot.data();
    const updatedMessages = updatedConversation.messages;
    setMessages(updatedMessages);
  };

  // Add a listener to the conversation document to listen for changes
  useEffect(() => {
    const conversationRef = db.collection('conversations').doc(chatId);
    conversationRef.onSnapshot(handleRealtimeUpdates);

    // Clean up the listener when the component unmounts
    return () => conversationRef.off('snapshot', handleRealtimeUpdates);
  }, [chatId]);

  const renderMessage = ({item}) => (
    <View style={{marginVertical: 10}}>
      <Text>{item.content}</Text>
    </View>
  );

  useEffect(() => {
    const conversationRef = db.collection('conversations').doc(chatId);
    conversationRef.onSnapshot(doc => {
      if (doc.exists) {
        const conversationData = doc.data();
        const messages = conversationData.messages;
        setMessages(messages);
      }
    });

    // Cleanup listener
    return () => conversationRef.onSnapshot(() => {});
  }, [chatId]);

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
      {messages && messages.length === 0 ? (
        <View style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
          <Text>No messages yet</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
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
