import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';

const Dropdown = ({options, selectedValue, onValueChange}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleValueChange = itemValue => {
    setModalVisible(false);
    onValueChange(itemValue);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <View style={styles.selectedValueContainer}>
          <Text style={styles.selectedValue}>{selectedValue.label}</Text>
          <Text style={styles.arrow}>▼</Text>
        </View>
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <FlatList
              data={options}
              keyExtractor={item => item.value.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleValueChange(item)}>
                  <Text style={styles.optionLabel}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  selectedValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
  },
  selectedValue: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
    color: '#fff',
  },
  arrow: {
    fontSize: 12,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    maxHeight: 300,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    color: '#2196F3',
  },
});

export default Dropdown;
