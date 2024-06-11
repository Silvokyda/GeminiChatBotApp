import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export default function Sidebar({ sidebarVisible }) {
  const navigation = useNavigation();
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        setAccessToken(token);
      } catch (error) {
        console.error('Error fetching access token:', error);
      }
    };

    fetchAccessToken();
  }, []);

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('userId');
      setAccessToken(null);
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <View style={[styles.sidebarContainer, { width: sidebarVisible ? '100%' : 0 }]}>
      <View style={styles.iconContainer}>
        {accessToken ? ( 
          <IconButton
            icon="power"
            color="#000"
            size={30}
            onPress={handleLogout}
          />
        ) : (
          <IconButton
            icon="account-circle"
            color="#000"
            size={30}
            onPress={handleSignIn}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f4f4f4',
  },
  iconContainer: {
    alignItems: 'center', 
  },
});
