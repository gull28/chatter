import React, {useEffect, useState} from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  Modal,
  Button,
} from 'react-native';
import auth, {firebase} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const db = firestore();

const FriendListItem = ({
  navigation,
  friendId,
  friendName,
  friendData,
  isGroupList,
  groupInfo = {},
  isSelected,
  onPress,
}) => {
  const currentUser = firebase.auth().currentUser.uid;
  const [isBanModalVisible, setIsBanModalVisible] = useState(false);
  const [isUserAdministrator, setIsUserAdministrator] = useState(false);

  const isUserAdmin = userId => {
    return groupInfo.admins.includes(userId);
  };
  const isUserOwner = userId => {
    return userId === groupInfo.groupOwner;
  };

  const handleUserBan = () => {
    setIsBanModalVisible(true);
  };

  useEffect(() => {
    if (isGroupList) {
      const handleFriend = async () => {
        const groupRef = await db
          .collection('chatGroups')
          .doc(groupInfo.id)
          .get();
        const admins = groupRef.data().admins;
        setIsUserAdministrator(admins.includes(friendId));
      };
      handleFriend();
    }
  }, [groupInfo]);

  const handleAddAsAdmin = async userId => {
    try {
      if (isUserAdministrator) {
        // User is already an admin, so remove them from the array
        await db
          .collection('chatGroups')
          .doc(groupInfo.id)
          .update({
            admins: firebase.firestore.FieldValue.arrayRemove(userId),
          });
        setIsUserAdministrator(false);
      } else {
        // User is not an admin, so add them to the array
        await db
          .collection('chatGroups')
          .doc(groupInfo.id)
          .update({
            admins: firebase.firestore.FieldValue.arrayUnion(userId),
          });
        setIsUserAdministrator(true);
      }
    } catch (error) {
      console.error('Error updating admins:', error);
    }
  };

  // need to test this
  const handleBan = (chatGroupId, friendId) => {
    const userId = friendId; // user to be banned
    const chatGroupsRef = db.collection('chatGroups').doc(chatGroupId);
    console.log('grupasinfo', groupInfo);
    // Check if current user is an admin
    // Remove all messages that contain the banned user's id
    // Remove the banned user from the admins and participants arrays
    chatGroupsRef
      .get()
      .then(doc => {
        if (!doc.exists) {
          console.log(`Chat group with id ${chatGroupId} does not exist`);
          return;
        }

        const data = doc.data();
        const admins = data.admins || [];
        const participants = data.participants || [];

        const batch = firestore().batch();

        if (admins.includes(userId)) {
          batch.update(chatGroupsRef, {
            admins: firestore.FieldValue.arrayRemove(userId),
          });
        }

        if (participants.includes(userId)) {
          batch.update(chatGroupsRef, {
            participants: firestore.FieldValue.arrayRemove(userId),
          });
        }

        batch.update(chatGroupsRef, {
          messages: firestore.FieldValue.arrayRemove(
            ...data.messages.filter(message => message.sender === userId),
          ),
        });

        batch
          .commit()
          .then(() => {
            navigation.navigate('MenuPage');
          })
          .catch(error => {
            console.error(
              `Error banning user with id ${userId} from chat group ${chatGroupId}: ${error}`,
            );
          });
      })
      .catch(error => {
        console.error(
          `Error retrieving chat group with id ${chatGroupId}: ${error}`,
        );
      });
  };
  // need to fix this logic
  const handlePress = () => {
    if (isGroupList && (isUserAdmin(currentUser) || isUserOwner(currentUser))) {
      if (currentUser !== friendId && !isUserOwner(friendId)) {
        onPress(friendId);
      }
    } else {
      navigation.navigate('OtherUserProfilePage', {result: friendData});
    }
  };

  const handleBanModalClose = () => {
    setIsBanModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, isSelected && styles.selectedContainer]}
        onPress={handlePress}>
        <Text style={styles.friendName}>{friendName}</Text>
        {isUserAdministrator && isGroupList && (
          <Text style={styles.friendName}>Admin</Text>
        )}
      </TouchableOpacity>
      {isSelected && isGroupList && (
        <View style={styles.optionsContainer}>
          {isUserAdministrator ? (
            <TouchableOpacity
              style={styles.option}
              onPress={async () => await handleAddAsAdmin(friendId)}>
              <Text style={styles.optionText}>Remove admin</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.option}
              onPress={async () => await handleAddAsAdmin(friendId)}>
              <Text style={styles.optionText}>Add admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleUserBan()}>
            <Text style={styles.optionText}>Ban</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={() =>
              navigation.navigate('OtherUserProfilePage', {result: friendData})
            }>
            <Text style={styles.optionText}>View profile</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal visible={isBanModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Button title="Close" onPress={handleBanModalClose} />
          <Text>Ban User</Text>
          <Button
            title="Ban user"
            onPress={() => handleBan(groupInfo.id, friendId)}
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  selectedContainer: {
    backgroundColor: 'lightblue',
  },
  friendName: {
    fontSize: 16,
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
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FriendListItem;
