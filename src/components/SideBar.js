import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IconButton, List } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';


import { supabase } from '../utils/supabase'; 


export default function Sidebar({ sidebarVisible }) {
  const navigation = useNavigation();
  const [accessToken, setAccessToken] = useState(null);
  const [chatThreads, setChatThreads] = useState([]);

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

  useEffect(() => {
    const fetchChatThreads = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        
        const { data: userThreads, error: threadError } = await supabase
          .from('threads')
          .select('*')
          .eq('user', userId); 
        
        if (threadError) {
          console.error('Error fetching user threads:', threadError);
          return;
        }
  
        setChatThreads(userThreads || []);
      } catch (error) {
        console.error('Error fetching user threads:', error);
      }
    };
  
    fetchChatThreads();
  }, []);
  
  

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  const handleLogout = async () => {
    try {
      Alert.alert(
        'Logout',
        'Are you sure you want to log out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            onPress: async () => {
              await AsyncStorage.removeItem('accessToken');
              await AsyncStorage.removeItem('userId');
              setAccessToken(null);
              navigation.navigate('Login');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  

  const handleNewChat = () => {
    navigation.navigate('NewChatScreen');
  };

  const renderItem = ({ item }) => (
    <List.Item
      title={item.name}
      description={item.lastMessage}
      onPress={() => {
        navigation.navigate('ChatScreen', { threadId: item.id });
      }}
    />
  );

  return (
    <View style={[styles.sidebarContainer, { width: sidebarVisible ? '100%' : 0 }]}>
      <IconButton
        icon="plus"
        color="#000"
        size={30}
        onPress={handleNewChat}
        style={styles.plusIcon}
      />
      {chatThreads.length === 0 ? (
        <Text style={styles.emptyChatText}>Chat history is empty</Text>
      ) : (
        <FlatList
          data={chatThreads}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      )}
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
    justifyContent: 'flex-start',
    backgroundColor: '#f4f4f4',
  },
  iconContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    marginBottom: 10,
  },
  plusIcon: {
    alignSelf: 'center',
    marginVertical: 10,
  },
  emptyChatText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});
