import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';

const FriendListItem = ({friendId, friendName, onPress}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress()}>
      <Text style={styles.friendName}>{friendName}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  friendName: {
    fontSize: 16,
  },
});

export default FriendListItem;
