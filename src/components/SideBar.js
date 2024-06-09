// components/Sidebar.js
import React from 'react';
import { View, Button, StyleSheet } from 'react-native';

export default function Sidebar() {
  const handleSignIn = () => {
    // Handle sign in/sign up logic here
    console.log('Sign In/Sign Up button pressed');
  };

  return (
    <View style={styles.sidebarContainer}>
      <Button title="Sign In / Sign Up" onPress={handleSignIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
});
