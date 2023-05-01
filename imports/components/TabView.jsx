import React, {useState} from 'react';
import {View, TouchableOpacity, Text} from 'react-native';

const TabView = ({tabs, initialTab, onTabChange}) => {
  const [selectedTab, setSelectedTab] = useState(initialTab || 0);

  const handleTabPress = index => {
    setSelectedTab(index);
    if (onTabChange) {
      onTabChange(index);
    }
  };

  return (
    <View style={{flexDirection: 'row'}}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handleTabPress(index)}
          style={{
            flex: 1,
            backgroundColor: selectedTab === index ? 'gray' : 'white',
            alignItems: 'center',
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: 'gray',
          }}>
          <Text style={{fontWeight: selectedTab === index ? 'bold' : 'normal'}}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default TabView;
