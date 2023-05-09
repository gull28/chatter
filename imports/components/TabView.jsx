import React, {useState} from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';

export const TabView = ({tabs, initialTab, onTabChange}) => {
  const [selectedTab, setSelectedTab] = useState(initialTab || 0);

  const handleTabPress = index => {
    setSelectedTab(index);
    if (onTabChange) {
      onTabChange(index);
    }
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleTabPress(index)}
          style={[
            styles.tab,
            {
              backgroundColor: selectedTab === index ? '#2196F3' : 'white',
              borderColor: selectedTab === index ? '#2196F3' : 'gray',
            },
          ]}>
          <Text
            style={[
              styles.tabLabel,
              {
                color: selectedTab === index ? '#fff' : '#333',
                fontWeight: selectedTab === index ? 'bold' : 'normal',
              },
            ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F5FCFF',
    borderRadius: 5,
    overflow: 'hidden',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  tabLabel: {
    fontSize: 16,
  },
});
