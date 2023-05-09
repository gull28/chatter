import React from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {Path} from 'react-native-svg';

export const BackArrowSvg = ({color}) => {
  return (
    <View style={styles.container}>
      <Svg width="24" height="24" viewBox="0 0 24 24">
        <Path
          d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z"
          fill={color}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
  },
});
