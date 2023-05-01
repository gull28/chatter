import React, {useEffect} from 'react';
import {View, Image, StyleSheet} from 'react-native';

export const LandingPage = ({navigation}) => {
  useEffect(() => {
    setTimeout(() => {
      navigation.navigate('LoginPage');
    }, 200);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/logo.webp')}
        style={styles.logo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 200,
    height: 200,
  },
});
