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

  const [isFriend, setIsFriend] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(async () => {
    const currentUser = firebase.auth().currentUser;
    const userDocRef = db.collection('users').doc(currentUser.uid);
    const userDoc = await userDocRef.get();
    const blockedUsers = userDoc.get('blockedUsers') || [];
    const blockedUserIndex = blockedUsers.indexOf(String(id));

    const friends = userDoc.get('friends') || [];
    const friendIndex = friends.indexOf(String(id));

    console.log(friends);
    console.log(blockedUsers);

    if (blockedUserIndex >= 0) {
      // Remove the user from the blocked users list
      setIsBlocked(true);
    } else {
      // Add the user to the blocked users list
      setIsBlocked(false);
    }

    if (friendIndex >= 0) {
      // Remove the friend if they're already in the list
      setIsFriend(true);
    } else {
      // Add the friend if they're not already in the list
      setIsFriend(false);
    }
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
        <Button
          onPress={() => navigation.goBack()}
          title="< Back"
          color="#fff"
        />
        <Text style={styles.title}>{username}</Text>
        <View style={{width: 80}}></View>
      </View>
      <View style={styles.content}>
        {isFriend ? (
          <Button
            title="Remove Friend"
            onPress={() => handleAddFriend()}
            color="#f00"
          />
        ) : (
          <Button
            title="Add Friend"
            onPress={() => handleAddFriend()}
            color="#0f0"
          />
        )}
        {isBlocked ? (
          <Button title="Unblock" onPress={() => handleBlock()} color="#0f0" />
        ) : (
          <Button title="Block" onPress={() => handleBlock()} color="#f00" />
        )}
        {isBlocked ? (
          <Button
            title="Chat"
            onPress={() => handleChat()}
            disabled={true}
            color="#999"
          />
        ) : (
          <Button title="Chat" onPress={() => handleChat()} color="#00f" />
        )}
        <Button title="Report" onPress={() => handleReport()} color="#f00" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#00f',
    height: 50,
    paddingHorizontal: 10,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
export default OtherUserProfilePage;
