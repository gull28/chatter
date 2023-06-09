import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';

export const SearchResult = ({result, onPress}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.text}>{result.username || result.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderRadius: 8,
    margin: 2,
  },
  text: {
    fontSize: 18,
    color: '#000',
  },
});
