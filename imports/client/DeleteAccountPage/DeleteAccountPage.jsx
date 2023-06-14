import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {firebase} from '@react-native-firebase/auth';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import firestore from '@react-native-firebase/firestore';
import {errorToast, successToast} from '../../helpers/helpers';

const db = firestore();

export const DeleteAccountPage = ({navigation}) => {
  const [password, setPassword] = useState('');

  const handleRemoveUserPresence = async userId => {
    try {
      const batch = db.batch();

      // Step 1: Remove user from all groups
      const groupsSnapshot = await db
        .collection('chatGroups')
        .where('participants', 'array-contains', userId)
        .get();
      groupsSnapshot.forEach(groupDoc => {
        const groupData = groupDoc.data();
        const {groupOwner, participants, admins} = groupData;

        // Remove user from participants array
        const updatedParticipants = participants.filter(
          participant => participant !== userId,
        );
        batch.update(groupDoc.ref, {participants: updatedParticipants});

        // Remove user from admins array
        const updatedAdmins = admins.filter(admin => admin !== userId);
        batch.update(groupDoc.ref, {admins: updatedAdmins});

        // Delete group if user is the owner
        if (groupOwner === userId) {
          batch.delete(groupDoc.ref);
        }
      });

      // Step 3: Remove user's messages from chats if not the owner
      const chatsSnapshot = await db.collection('chatGroups').get();
      chatsSnapshot.forEach(chatDoc => {
        const chatData = chatDoc.data();
        const {groupOwner} = chatData;

        if (groupOwner !== userId) {
          const messagesCollectionRef = chatDoc.ref.collection('messages');
          const userMessagesQuery = messagesCollectionRef.where(
            'sender',
            '==',
            userId,
          );

          userMessagesQuery.get().then(querySnapshot => {
            querySnapshot.forEach(messageDoc => {
              batch.delete(messageDoc.ref);
            });
          });
        }
      });

      // Step 4: Remove user's ID from admins array in group chats
      const groupChatsSnapshot = await db.collection('chatGroups').get();
      groupChatsSnapshot.forEach(groupChatDoc => {
        const groupChatData = groupChatDoc.data();
        const {admins} = groupChatData;

        if (admins.includes(userId)) {
          const updatedAdmins = admins.filter(admin => admin !== userId);
          batch.update(groupChatDoc.ref, {admins: updatedAdmins});
        }
      });

      // Step 5: Remove user from other users' friends lists
      const usersSnapshot = await db
        .collection('users')
        .where('friends', 'array-contains', userId)
        .get();
      usersSnapshot.forEach(userDoc => {
        const userData = userDoc.data();
        const {friends} = userData;

        const updatedFriends = friends.filter(friend => friend !== userId);
        batch.update(userDoc.ref, {friends: updatedFriends});
      });

      // Step 6: Remove user from conversations
      const conversationsSnapshot = await db.collection('conversations').get();
      conversationsSnapshot.forEach(conversationDoc => {
        const conversationData = conversationDoc.data();
        const {participants} = conversationData;

        if (participants.includes(userId)) {
          batch.delete(conversationDoc.ref);
        }
      });

      // Step 7: Deletes the user from users array
      db.collection('users').doc(userId).delete();

      await batch.commit();

      // User ban operations completed successfully
      errorToast('User banned successfully!');
    } catch (error) {
      console.error('Error performing user ban operations:', error);
      // Handle error
      return;
    }
  };

  const handleDeleteAccount = () => {
    const user = firebase.auth().currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(
      user.email,
      password,
    );

    user
      .reauthenticateWithCredential(credential)
      .then(() => {
        user
          .delete()
          .then(() => {
            handleRemoveUserPresence(user.uid).then(() => {
              successToast('Account deleted successfully!');
              navigation.navigate('LoginPage');
            });
          })
          .catch(error => {
            errorToast(error.message);
          });
      })
      .catch(error => {
        errorToast('Incorrect password');
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Are you sure?</Text>
      </View>
      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor="black"
          value={password}
          onChangeText={text => setPassword(text)}
          secureTextEntry={true}
        />
        <TouchableOpacity
          style={styles.deleteButton}
          title="Delete Account"
          onPress={handleDeleteAccount}>
          <Text style={styles.deleteButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          title="Cancel"
          onPress={() => navigation.navigate('MenuPage')}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2196F3',
    textAlign: 'center',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  deleteButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    margin: 10,
    width: '100%', // Add this property to make the button take full width
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%', // Add this property to make the button take full width
  },
});
