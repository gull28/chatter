import React, {useState, useEffect} from 'react';
import {FlatList} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import GroupListItem from './GroupListItem';

const db = firestore();
const GroupList = ({navigation}) => {
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
        console.log(groups);
        setGroupList(groups);
      } catch (error) {
        console.error(error);
      }
    };

    getGroupsForCurrentUser();
  }, [currentUserID]);
  const handlePressGroup = group => {
    console.log('zzz', group.id);
    navigation.navigate('GroupChatPage', {chatId: group.id});
  };

  const renderGroup = ({item}) => (
    <GroupListItem
      groupName={item.name}
      onPress={() => handlePressGroup(item)}
    />
  );

  return (
    <FlatList
      data={groupList}
      renderItem={renderGroup}
      keyExtractor={item => item.id}
    />
  );
};

export default GroupList;
