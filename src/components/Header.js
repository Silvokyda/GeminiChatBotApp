import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';

export default function Header() {
  // Function to toggle theme (placeholder function)
  const toggleTheme = () => {
    // Implement your theme toggling logic here
    console.log('Theme toggled');
  };

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>Chat App</Text>
      {/* IconButton to toggle theme */}
      <IconButton
        icon="weather-night" 
        color="#000"
        size={20}
        onPress={toggleTheme}
        style={{  marginTop: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f4',
    height: 60,
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 10, 
  },
  headerText: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
