import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Button, TouchableOpacity} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth, {firebase} from '@react-native-firebase/auth';
import ReportUserModal from '../../components/ReportUserModal';
import {Ionicons} from '@ionic/react';

const db = firestore();

const OtherUserProfilePage = ({route, navigation}) => {
  const {result} = route.params;
  const {username, id} = result;
  const currentUser = firebase.auth().currentUser;

  const [isFriend, setIsFriend] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const userDocRef = db.collection('users').doc(currentUser.uid);
      const userDoc = await userDocRef.get();
      const blockedUsers = userDoc.get('blockedUsers') || [];
      const blockedUserIndex = blockedUsers.indexOf(String(id));

      const friends = userDoc.get('friends') || [];
      const friendIndex = friends.indexOf(String(id));

      if (blockedUserIndex >= 0) {
        // Remove the user from the blocked users list
        setIsBlocked(true);
      }

      if (friendIndex >= 0) {
        // Remove the friend if they're already in the list
        setIsFriend(true);
      }
    };

    fetchData();
  }, []);

  const handleBlock = async () => {
    const currentUser = firebase.auth().currentUser;
    const userDocRef = db.collection('users').doc(currentUser.uid);
    const userDoc = await userDocRef.get();
    const blockedUsers = userDoc.get('blockedUsers') || [];
    console.log(blockedUsers);
    const blockedUserIndex = blockedUsers.indexOf(String(id));

    if (blockedUserIndex >= 0) {
      // Remove the user from the blocked users list
      blockedUsers.splice(blockedUserIndex, 1);
      setIsBlocked(false);
    } else {
      // Add the user to the blocked users list
      blockedUsers.push(id);
      setIsBlocked(true);
    }

    await userDocRef.update({blockedUsers});
  };

  const handleAddFriend = async () => {
    const currentUser = firebase.auth().currentUser;
    const userDocRef = db.collection('users').doc(currentUser.uid);
    const userDoc = await userDocRef.get();
    console.log('userDoc', userDoc);
    const friends = userDoc.get('friends') || [];
    console.log('friends', friends);
    const friendIndex = friends.indexOf(String(id));

    if (friendIndex >= 0) {
      // Remove the friend if they're already in the list
      friends.splice(friendIndex, 1);
      setIsFriend(false);
    } else {
      // Add the friend if they're not already in the list
      friends.push(id);
      setIsFriend(true);
    }

    await userDocRef.update({friends});
  };

  async function findConversationId(currentUserUid, otherUserUid) {
    // Query the conversations collection for any documents with the current user as a participant
    const querySnapshot = await firebase
      .firestore()
      .collection('conversations')
      .where('participants', 'array-contains', currentUserUid)
      .get();

    // Loop through the documents in the query result
    for (const doc of querySnapshot.docs) {
      // Check if the document also contains the other user as a participant
      if (doc.data().participants.includes(otherUserUid)) {
        // If so, return the document ID
        return doc.id;
      }
    }

    // If no document was found, create a new conversation document
    const newConversationRef = firebase
      .firestore()
      .collection('conversations')
      .doc();
    const newConversationId = newConversationRef.id;

    await newConversationRef.set({
      participants: [currentUserUid, otherUserUid],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    return newConversationId;
  }

  const handleChat = async () => {
    const chatId = await findConversationId(
      firebase.auth().currentUser.uid,
      id,
    );
    navigation.navigate('ChatPage', {
      chatId,
      chatType: 'conversation',
      participantId: id,
    });
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('MenuPage', {userId: currentUser.uid})
          }>
          <Text style={styles.backButton}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{username}</Text>
        <View style={styles.emptyView} />
      </View>
      <View style={styles.content}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => handleAddFriend()}
            style={[
              styles.button,
              isFriend ? styles.removeFriendButton : styles.addFriendButton,
            ]}>
            <Text style={styles.buttonText}>
              {isFriend ? 'Remove Friend' : 'Add Friend'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => handleBlock()}
            style={[
              styles.button,
              isBlocked ? styles.unblockButton : styles.blockButton,
            ]}>
            <Text style={styles.buttonText}>
              {isBlocked ? 'Unblock' : 'Block'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => handleChat()}
            disabled={isBlocked}
            style={[
              styles.button,
              isBlocked ? styles.disabledButton : styles.chatButton,
            ]}>
            <Text style={styles.buttonText}>Chat</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => handleReport()}
            style={styles.reportButton}>
            <Text style={styles.buttonText}>Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    height: 50,
    paddingHorizontal: 10,
  },
  backButton: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyView: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    marginVertical: 10,
    width: '100%',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFriendButton: {
    backgroundColor: '#007AFF',
  },
  removeFriendButton: {
    backgroundColor: '#FF3B30',
  },
  blockButton: {
    backgroundColor: '#FF3B30',
  },
  unblockButton: {
    backgroundColor: '#4CD964',
  },
  chatButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#B2B2B2',
  },
  reportButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
export default OtherUserProfilePage;
