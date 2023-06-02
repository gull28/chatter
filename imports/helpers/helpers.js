import Toast from 'react-native-toast-message';

export const successToast = message => {
  return Toast.show({
    type: 'success',
    text1: 'Success',
    text2: message,
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 30,
    bottomOffset: 40,
  });
};

export const errorToast = message => {
  return Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 30,
    bottomOffset: 40,
  });
};
