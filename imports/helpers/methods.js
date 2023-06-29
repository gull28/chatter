import firestore from '@react-native-firebase/firestore';
import {errorToast} from './helpers';

const db = firestore();

/**
 * Retrieves user data based on the provided participant ID.
 * @param {string} participantId - The ID of the participant for whom to retrieve the data.
 * @returns {Promise<object>} - A promise that resolves to the user data object.
 */
export const getUserData = async participantId => {
  const userDocRef = db.collection('users').doc(participantId);
  const userDataRefDoc = await userDocRef.get();
  const userData = userDataRefDoc.data();
  return userData;
};

/**
 * Retrieves the current user's data based on the provided user ID.
 * @param {string} currentUser - The ID of the current user.
 * @returns {Promise<object>} - A promise that resolves to the current user's data object.
 */
export const getCurrentUserData = async currentUser => {
  const userDocRef = db.collection('users').doc(currentUser);
  const userDataRefDoc = await userDocRef.get();
  const userData = userDataRefDoc.data();
  return userData;
};

/**
 * Removes the current user from a chat group based on the provided chat ID.
 * If the user is a group admin, their admin status will also be revoked.
 *
 * @param {boolean} isUserGroupAdmin - Specifies whether the current user is an admin of the chat group.
 * @param {string} chatId - The ID of the chat group from which the user will be removed.
 * @param {object} currentUser - The object representing the current user. It should have a "uid" property containing the user's unique identifier.
 * @returns {Promise<void>} - A promise that resolves when the user is successfully removed from the chat group.
 */
export const leaveChatGroup = async (isUserGroupAdmin, chatId, currentUser) => {
  try {
    if (isUserGroupAdmin) {
      const groupRef = db.collection('chatGroups').doc(chatId);
      await groupRef.update({
        participants: firestore.FieldValue.arrayRemove(currentUser.uid),
        admins: firestore.FieldValue.arrayRemove(currentUser.uid),
      });
    } else {
      const groupRef = db.collection('chatGroups').doc(chatId);
      await groupRef.update({
        participants: firestore.FieldValue.arrayRemove(currentUser.uid),
      });
    }
  } catch (error) {
    errorToast('Error leaving a group!');
  }
};
