import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';

export const GroupListItem = ({groupName, onPress}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.text}>{groupName}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
