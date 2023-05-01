import React, {useState, useEffect} from 'react';
import {
  FlatList,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import auth, {firebase} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import FriendListItem from './FriendsListItem';
import LoadingSpinner from './LoadingSpinner';
const db = firestore();

export const FriendsList = ({navigation}) => {
  const currentUser = firebase.auth().currentUser.uid;
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getUserFriends = async userId => {
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    const friends = userDoc.get('friends') || [];
    let userFriendsNames = [];
    for (const friendId of friends) {
      const userFriendName = db.collection('users').doc(friendId);
      const userFriendNameDoc = await userFriendName.get();
      const friendName = userFriendNameDoc.data().username;
      userFriendsNames.push({id: friendId, username: friendName});
    }
    return userFriendsNames || [];
  };

  useEffect(() => {
    const fetchFriends = async () => {
      setIsLoading(true);
      const friendsList = await getUserFriends(currentUser);
      setFriends(friendsList);
      setIsLoading(false);
    };
    fetchFriends();
  }, []);

  const handleFriendPress = friendId => {
    // Do something when a friend is clicked
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (friends.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No friends found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={friends}
      renderItem={({item}) => (
        <FriendListItem
          friendId={item.id}
          friendName={item.username}
          onPress={() =>
            navigation.navigate('OtherUserProfilePage', {result: item})
          }
        />
      )}
      keyExtractor={(item, index) => index.toString()}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
