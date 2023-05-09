import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import {BackArrowSvg} from '../../assets/BackArrowSvg';

export const BackButton = ({onPress, color}) => {
  return (
    <TouchableOpacity
      style={[styles.container, {backgroundColor: color}]}
      onPress={onPress}>
      <BackArrowSvg color="#fff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 5,
  },
});
