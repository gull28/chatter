import React, {useState} from 'react';
import {Modal, View, Text, TextInput, Button, StyleSheet} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Toast from 'react-native-toast-message';

export const ReportUserModal = ({isVisible, message, user, onClose}) => {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');

  const {id, username} = user;
  const db = firestore();

  const handleCancel = () => {
    onClose();
  };

  const handleSubmit = async () => {
    await db
      .collection('userReports')
      .doc(id)
      .set({
        message,
        reason,
        comment,
      })
      .then(() => {
        onClose();
      });
  };

  return (
    <Modal visible={isVisible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>Report User {username}</Text>
        <TextInput
          style={styles.input}
          placeholder="Reason for report"
          placeholderTextColor={'black'}
          value={reason}
          onChangeText={text => setReason(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Comment"
          placeholderTextColor={'black'}
          value={comment}
          onChangeText={text => setComment(text)}
          multiline
          numberOfLines={4}
        />
        <View style={styles.buttonContainer}>
          <Button title="Cancel" onPress={handleCancel} />
          <Button title="Submit" onPress={handleSubmit} />
        </View>
      </View>
      <Toast />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
});
