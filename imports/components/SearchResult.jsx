import React from 'react';
import {Text, TouchableOpacity} from 'react-native';

export const SearchResult = ({result, onPress}) => {
  return (
    <TouchableOpacity
      style={{
        backgroundColor: '#F5F5F5',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
      }}
      onPress={onPress}>
      <Text style={{fontSize: 18}}>{result.username || result.name}</Text>
    </TouchableOpacity>
  );
};
