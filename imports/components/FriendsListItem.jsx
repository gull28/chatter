import React, {useState} from 'react';
import {Text, TouchableOpacity, StyleSheet, View} from 'react-native';

const FriendListItem = ({
  friendId,
  friendName,
  onPress,
  groupInfo = {},
  isOptionShown,
}) => {
  const handleUserBan = () => {
    console.log('Ban');
  };

  const handleUserReport = () => {
    console.log('Report');
  };
  return (
    <>
      <TouchableOpacity style={styles.container} onPress={() => onPress()}>
        <Text style={styles.friendName}>{friendName}</Text>
      </TouchableOpacity>
      {isOptionShown && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleUserReport()}>
            <Text style={styles.optionText}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleUserBan()}>
            <Text style={styles.optionText}>Ban</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
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
});

export default FriendListItem;
