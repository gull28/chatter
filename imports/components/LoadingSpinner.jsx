import React from 'react';
import {View, ActivityIndicator} from 'react-native';

export const LoadingSpinner = () => {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size="large" color="#2196F3" />
    </View>
  );
};
