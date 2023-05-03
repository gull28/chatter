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

export const FriendsList = ({
  navigation,
  getUserListData,
  isGroupList = false,
  groupInfo = {},
}) => {
  const currentUser = firebase.auth().currentUser.uid;
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      setIsLoading(true);
      const friendsList = await getUserListData();
      setFriends(friendsList);
      setIsLoading(false);
    };
    fetchFriends();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (friends.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No users found.</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={styles.flatList}
        data={friends}
        renderItem={({item}) => (
          <FriendListItem
            friendId={item.id}
            friendName={item.username}
            groupInfo={groupInfo}
            isOptionShown={showOptions}
            onPress={() => {
              if (isGroupList) {
                if (
                  currentUser === groupInfo?.groupOwner ||
                  groupInfo?.admins.includes(currentUser)
                ) {
                  setShowOptions(!showOptions);
                } else {
                  navigation.navigate('OtherUserProfilePage', {result: item});
                }
              } else {
                navigation.navigate('OtherUserProfilePage', {result: item});
              }
            }}
          />
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatList: {
    width: '100%',
  },
});
