// components/Sidebar.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper'; // Import IconButton from react-native-paper

export default function Sidebar({ sidebarVisible }) {
  const handleSignIn = () => {
    // Handle sign in/sign up logic here
    console.log('Sign In/Sign Up button pressed');
  };

  return (
    <View style={[styles.sidebarContainer, { width: sidebarVisible ? '100%' : 0 }]}>
      {sidebarVisible && (
        <IconButton
          icon="account-circle"
          color="#000"
          size={30}
          onPress={handleSignIn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: '#f4f4f4',
  },
});
