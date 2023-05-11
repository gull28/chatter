import React, {useState, useEffect} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {GroupListItem} from './GroupListItem';

const db = firestore();

export const GroupList = ({navigation}) => {
  const [groupList, setGroupList] = useState([]);
  const currentUserID = auth().currentUser.uid;

  useEffect(() => {
    const getGroupsForCurrentUser = async () => {
      try {
        const groupChatsCollection = db.collection('chatGroups');

        const snapshot = await groupChatsCollection
          .where('participants', 'array-contains', currentUserID)
          .get();

        const groups = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        setGroupList(groups);
      } catch (error) {
        console.error(error);
      }
    };

    getGroupsForCurrentUser();
  }, [currentUserID]);

  const handlePressGroup = group => {
    navigation.navigate('GroupChatPage', {chatId: group.id});
  };

  const renderGroup = ({item}) => (
    <GroupListItem
      groupName={item.name}
      onPress={() => handlePressGroup(item)}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={groupList}
        renderItem={renderGroup}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 16,
  },
});
