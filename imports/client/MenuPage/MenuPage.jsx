import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {firebase} from '@react-native-firebase/auth';
import CountryPicker from 'rn-country-dropdown-picker';
import {SearchResult} from '../../components/SearchResult';
import TabView from '../../components/TabView';
import Dropdown from '../../components/Dropdown';
import {FriendsList} from '../../components/FriendsList';
import GroupList from '../../components/GroupList';

const items = [
  {label: 'Public', value: true},
  {label: 'Private', value: false},
];

const db = firestore();

export const MenuPage = ({navigation, route}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultsGroups, setSearchResultsGroups] = useState([]);
  const [searchResultsUsers, setSearchResultsUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [usersCount, setUsersCount] = useState('');
  const [accessible, setAccessible] = useState(true);
  const [region, setRegion] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedMenuTab, setSelectedMenuTab] = useState(0);
  const [groupDescription, setGroupDescription] = useState('');

  const tabs = [{label: 'Groups'}, {label: 'Users'}];

  const menuTabs = [{label: 'Groups'}, {label: 'Friends'}];

  const currentUser = firebase.auth().currentUser.uid;

  useEffect(() => {
    const searchChatGroups = async () => {
      const snapshot = await db
        .collection('chatGroups')
        .where('name', '>=', searchQuery)
        .where('name', '<=', searchQuery + '\uf8ff')
        .where('accessibility', '==', true)
        .get();

      const groups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Do something with the retrieved chat groups
      setSearchResultsGroups(groups);
    };

    const searchUsers = async () => {
      const snapshot = await db
        .collection('users')
        .where('username', '>=', searchQuery)
        .where('username', '<=', searchQuery + '\uf8ff')
        .get();

      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Do something with the retrieved users
      setSearchResultsUsers(users);
    };

    if (searchQuery) {
      searchChatGroups();
      searchUsers();
      setSelectedMenuTab(0);
    }
  }, [searchQuery]);

  const handleSearch = text => {
    setSearchQuery(text);
  };

  const handleProfile = user => {
    navigation.navigate('ProfilePage', {user});
  };

  const handleGroupNameChange = groupName => {
    setGroupName(groupName);
  };

  const handleRegion = region => {
    setRegion(region);
  };

  const handleTabChange = index => {
    setSelectedTab(index);
  };

  const handleCreateGroup = async (count, name, accessibility) => {
    await db
      .collection('chatGroups')
      .doc()
      .set({
        count,
        name,
        groupOwner: currentUser,
        accessibility: accessibility.value,
        admins: [],
        bannedUsers: [],
        messages: [],
        region,
        groupDescription,
        participants: [currentUser],
      })
      .then(() => {
        setIsModalVisible(false);
      });
  };

  const handleMenuTabChange = index => {
    setSelectedMenuTab(index);
  };

  const retrieveDocument = async documentId => {
    const documentRef = db.collection('chatGroups').doc(documentId);
    const documentSnapshot = await documentRef.get();

    if (documentSnapshot.exists) {
      // Document data exists, return it
      const documentData = documentSnapshot.data();
      return documentData;
    } else {
      // Document doesn't exist
      return null;
    }
  };

  const handleResultPress = async result => {
    if (await isUserInGroup(currentUser, result.id)) {
      navigation.navigate('GroupChatPage', {chatId: result.id});
    } else {
      const groupData = await retrieveDocument(result.id);
      groupData.id = result.id;
      navigation.navigate('ViewGroup', {
        groupData,
        userData: currentUser,
      });
    }
  };

  const isUserInGroup = async (userId, groupId) => {
    try {
      const groupRef = firestore().collection('chatGroups').doc(groupId);
      const groupSnapshot = await groupRef.get();
      console.log('groupsnapshot', groupSnapshot);
      const participants = groupSnapshot.get('participants');
      console.log('participants', participants);
      console.log(participants.includes('includes', userId));
      return participants.includes(userId);
    } catch (error) {
      console.log(error);
      return false;
    }
  };

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

  useState(() => {
    console.log(selectedMenuTab);
  }, [selectedMenuTab]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search"
            value={searchQuery}
            onChangeText={text => handleSearch(text)}
          />
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => handleProfile(currentUser)}>
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>
      {searchQuery.length > 1 ? (
        <>
          <TabView
            tabs={tabs}
            initialTab={selectedTab}
            onTabChange={handleTabChange}
          />
          {searchResultsUsers.length > 0 && selectedTab === 1 && (
            <View style={styles.searchResultsContainer}>
              {searchResultsUsers.map(result => (
                <SearchResult
                  key={result.id}
                  result={result}
                  onPress={() =>
                    navigation.navigate('OtherUserProfilePage', {result})
                  }
                />
              ))}
            </View>
          )}
          {searchResultsGroups.length > 0 && selectedTab === 0 && (
            <View style={styles.searchResultsContainer}>
              {searchResultsGroups.map(result => (
                <SearchResult
                  key={result.id}
                  result={result}
                  onPress={() => handleResultPress(result)}
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          <TabView
            tabs={menuTabs}
            initialTab={selectedMenuTab}
            onTabChange={handleMenuTabChange}
          />
          {selectedMenuTab ? (
            <FriendsList
              navigation={navigation}
              getUserListData={() => getUserFriends(currentUser)}
            />
          ) : (
            <GroupList navigation={navigation} />
          )}
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => setIsModalVisible(true)}>
            <Text style={styles.newChatButtonText}>+</Text>
          </TouchableOpacity>
        </>
      )}
      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create New Chat Group</Text>
          <TextInput
            style={styles.input}
            placeholder="Group Name"
            value={groupName}
            onChangeText={text => handleGroupNameChange(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Number of Users"
            value={usersCount}
            keyboardType="phone-pad"
            contextMenuHidden={true}
            onChangeText={text => setUsersCount(text)}
          />
          <Dropdown
            options={items}
            selectedValue={accessible}
            onValueChange={value => setAccessible(value)}
          />
          <CountryPicker
            InputFieldStyle={styles.ContainerStyle}
            DropdownContainerStyle={styles.myDropdownContainerStyle}
            DropdownRowStyle={styles.myDropdownRowStyle}
            Placeholder="choose country ..."
            DropdownCountryTextStyle={styles.myDropdownCountryTextStyle}
            countryNameStyle={styles.mycountryNameStyle}
            flagSize={24}
            selectedItem={country => handleRegion(country)}
          />
          <TextInput
            style={styles.input}
            placeholder="Add a description about your group!"
            value={groupDescription}
            onChangeText={text => setGroupDescription(text)}
          />
          <TouchableOpacity
            style={styles.createButton}
            onPress={() =>
              handleCreateGroup(usersCount, groupName, accessible)
            }>
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  searchBarContainer: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 16,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  profileButton: {
    backgroundColor: '#0084ff',
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  newChatButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#0084ff',
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  newChatButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#0084ff',
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  ContainerStyle: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  myDropdownContainerStyle: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 8,
  },
  myDropdownRowStyle: {
    backgroundColor: '#fff',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  myDropdownCountryTextStyle: {
    fontSize: 14,
    color: '#222',
  },
  mycountryNameStyle: {
    fontSize: 14,
    color: '#222',
  },
});
