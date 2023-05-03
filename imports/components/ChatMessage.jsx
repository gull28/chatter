import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';

const ChatMessage = ({sender, time, message, currentUser, senderId}) => {
  const [showOptions, setShowOptions] = useState(false);

  const handlePress = () => {
    if (senderId !== currentUser) {
      setShowOptions(!showOptions);
    }
  };

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
          <Text style={styles.time}>{time}</Text>
        </View>
      </TouchableOpacity>
      {showOptions && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Option 1')}>
            <Text>Option 1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Option 2')}>
            <Text>Option 2</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress('Option 3')}>
            <Text>Option 3</Text>
          </TouchableOpacity>
        </View>
      )}
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
});

export default ChatMessage;
