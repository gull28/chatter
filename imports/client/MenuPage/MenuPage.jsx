import React, {useCallback, useEffect, useState} from 'react';
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
import {TabView} from '../../components/TabView';
import {Dropdown} from '../../components/Dropdown';
import {FriendsList} from '../../components/FriendsList';
import {GroupList} from '../../components/GroupList';
import {useFocusEffect} from '@react-navigation/native';
import {errorToast} from '../../helpers/helpers';
import Toast from 'react-native-toast-message';

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
  const [groupDescription, setGroupDescription] = useState('');
  const [userFriends, setUserFriends] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreateGroupAllowed, setIsCreateGroupAllowed] = useState(true);

  const tabs = [{label: 'Groups'}, {label: 'Users'}];

  const menuTabs = [{label: 'Groups'}, {label: 'Friends'}];

  const currentUser = firebase.auth().currentUser.uid;
  useFocusEffect(
    useCallback(() => {
      const fetchFriends = async () => {
        const friends = await getUserFriends(currentUser);
        setUserFriends(friends);
      };

      const fetchGroups = async () => {
        const groups = await getGroupsForCurrentUser();
        setUserGroups(groups);
      };

      fetchGroups();
      fetchFriends();
    }, []),
  );

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

      setSearchResultsUsers(users);
    };

    if (searchQuery) {
      searchChatGroups();
      searchUsers();
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

  const getGroupsForCurrentUser = async () => {
    try {
      const groupChatsCollection = db.collection('chatGroups');

      const snapshot = await groupChatsCollection
        .where('participants', 'array-contains', currentUser)
        .get();

      const groups = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      return groups;
    } catch (error) {}
  };

  const handleCreateGroup = async (
    count,
    name,
    accessibility,
    groupDescription,
    region,
  ) => {
    // Validation checks
    if (name === '' || groupDescription === '' || region === null) {
      // Handle null values

      errorToast('Null values detected!');
      return;
    }

    if (!accessibility) {
      errorToast('Enter accessibility');
      return;
    }

    if (count < 2 || count > 2000) {
      // Handle invalid count
      errorToast('Invalid count!');
      return;
    }

    if (name.length > 25 || !/^[a-zA-Z0-9\s]+$/.test(name)) {
      // Handle invalid name
      errorToast('Invalid name!');
      return;
    }

    if (groupDescription.length > 400) {
      // Handle invalid description
      errorToast('Invalid description!');
      return;
    }
    if (!isCreateGroupAllowed) {
      errorToast(
        'You have reached the group creation limit. Please wait before creating another group.',
      );
      return; // Don't create the group if the limit has been reached
    }

    if (isCreatingGroup) {
      return; // Don't create another group while one is being created
    }

    setIsCreatingGroup(true);

    try {
      const chatGroupsRef = db.collection('chatGroups');
      const newGroupRef = chatGroupsRef.doc();
      const messagesRef = newGroupRef.collection('messages');

      await newGroupRef.set({
        count,
        name,
        groupOwner: currentUser,
        accessibility: accessibility.value,
        admins: [],
        bannedUsers: [],
        region,
        groupDescription,
        participants: [currentUser],
      });

      setIsModalVisible(false);
      const groups = await getGroupsForCurrentUser();
      setUserGroups(groups);
      resetGroupState();

      // Disable creating groups when the limit is reached
      setIsCreateGroupAllowed(false);

      // Enable creating groups after a specific time period (e.g., 30 seconds)
      setTimeout(() => {
        setIsCreateGroupAllowed(true);
      }, 30000);
    } catch (error) {
      console.log(`Error creating group: ${error}`);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const resetGroupState = () => {
    setAccessible(true);
    setGroupDescription('');
    setGroupName('');
    setUsersCount('');
    setRegion('');
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
      const participants = groupSnapshot.get('participants');
      return participants.includes(userId);
    } catch (error) {
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
      const friendEmail = userFriendNameDoc.data().email;

      userFriendsNames.push({
        id: friendId,
        username: friendName,
        email: friendEmail,
      });
    }
    return userFriendsNames || [];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search"
            placeholderTextColor="black"
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
        <View style={{flex: 1, backgroundColor: '#f2f2f2'}}>
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
        </View>
      ) : (
        <View style={{flex: 1, backgroundColor: '#f2f2f2'}}>
          <TabView
            tabs={menuTabs}
            initialTab={selectedTab}
            onTabChange={handleTabChange}
          />
          {selectedTab ? (
            <FriendsList
              navigation={navigation}
              getUserListData={() => userFriends}
            />
          ) : (
            <GroupList
              navigation={navigation}
              getUserGroupData={() => userGroups}
            />
          )}
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => setIsModalVisible(true)}>
            <Text style={styles.newChatButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create New Chat Group</Text>
          <TextInput
            style={styles.input}
            placeholder="Group Name"
            placeholderTextColor="black"
            value={groupName}
            onChangeText={text => handleGroupNameChange(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Number of Users"
            placeholderTextColor="black"
            value={usersCount}
            keyboardType="phone-pad"
            autoCorrect={false}
            contextMenuHidden={true}
            onChangeText={text => setUsersCount(text)}
          />
          <Dropdown
            options={items}
            selectedValue={accessible}
            onValueChange={value => setAccessible(value)}
          />
          <CountryPicker
            InputFieldStyle={{
              color: 'black',
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 5,
              marginTop: 10,
              marginBottom: 10,
              paddingLeft: 15,
              backgroundColor: 'white',
            }}
            ContainerStyle={{
              paddingHorizontal: 0,
            }}
            Placeholder="choose country ..."
            DropdownCountryTextStyle={{
              ...styles.myDropdownCountryTextStyle,
              color: 'black',
            }}
            countryNameStyle={{...styles.mycountryNameStyle, color: 'black'}}
            flagSize={24}
            selectedItem={country => handleRegion(country)}
          />
          <TextInput
            style={styles.descriptionInput}
            placeholder="Add a description about your group!"
            multiline={true}
            placeholderTextColor="black"
            autoCorrect={false}
            value={groupDescription}
            onChangeText={text => setGroupDescription(text)}
          />
          <TouchableOpacity
            style={styles.createButton}
            onPress={() =>
              handleCreateGroup(
                usersCount,
                groupName,
                accessible,
                groupDescription,
                region,
              )
            }>
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              resetGroupState();
              setIsModalVisible(false);
            }}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <Toast />
      </Modal>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f2f2f2',
  },
  searchBarContainer: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '000',
  },
  searchBar: {
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#000',
    backgroundColor: 'white',
  },
  profileButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  profileButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchResultsContainer: {
    flex: 1,
    padding: 10,
    paddingTop: 2,
    backgroundColor: '#f2f2f2',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 20,
  },
  descriptionInput: {
    height: 120,
    width: '100%',
    paddingHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    textAlignVertical: 'top',
    marginTop: 10,
    marginBottom: 10,
    color: '#000',
    backgroundColor: 'white',
  },
  newChatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2196F3',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatButtonText: {
    fontSize: 30,
    color: '#fff',
  },
  myDropdownContainerStyle: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 10,
    color: '#000',
  },
  myDropdownRowStyle: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  myDropdownCountryTextStyle: {
    fontSize: 16,
  },
  mycountryNameStyle: {
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#f2f2f2',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2196F3',
    textAlign: 'center',
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
  createButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
  },
  createButtonText: {
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
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
};
