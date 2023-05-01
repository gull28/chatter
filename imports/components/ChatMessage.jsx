import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const ChatMessage = ({sender, time, message}) => {
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.sender}>{sender}</Text>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  messageContainer: {
    backgroundColor: '#E5E5EA',
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
});

export default ChatMessage;
