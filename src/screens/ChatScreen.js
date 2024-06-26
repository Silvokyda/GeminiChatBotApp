import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, PanResponder } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconButton } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { getChatbotResponse } from '../api/geminiProAPI';
import Sidebar from '../components/SideBar';
import Header from '../components/Header';

const MessageItem = React.memo(({ item }) => (
  <View style={[
    styles.messageContainer,
    item.user === 'user' ? styles.sentMessage : styles.receivedMessage
  ]}>
    <Text style={styles.messageText}>{item.user}: {item.text}</Text>
  </View>
));

export default function ChatScreen() {
  const route = useRoute();
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      return storedUserId;
    };

    const initializeUserId = async () => {
      const id = route.params ? route.params.userId : await fetchUserId();
      setUserId(id);
      setLoading(false);
    };

    initializeUserId();
  }, [route.params]);

  useEffect(() => {
    if (!userId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(error);
      } else {
        setMessages(data);
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages((prev) => [...prev, payload.new]);
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  const sendMessage = async () => {
    if (!input.trim()) return;
  
    // Fetch existing threads to determine the chat ID
    const { data: threads, error: threadsError } = await supabase
      .from('threads')
      .select('chat_id');
  
    if (threadsError) {
      console.error('Error fetching threads:', threadsError);
      return;
    }
  
    let chatId;
  
    // If no threads exist, assign chat ID 1; otherwise, assign the next available chat ID
    if (threads.length === 0) {
      chatId = 1;
    } else {
      chatId = Math.max(...threads.map(thread => thread.chat_id)) + 1;
    }
  
    const userMessage = {
      text: input,
      created_at: new Date().toISOString(),
      user: 'user',
      user_id: userId,
      chat_id: chatId, 
    };
  
    // Insert the user message into the messages table
    const { error: userMessageError } = await supabase.from('messages').insert([userMessage]);
  
    if (userMessageError) {
      console.error(userMessageError);
      return;
    }
  
    setInput('');
  
    try {
      const chatbotResponse = await getChatbotResponse(input);
  
      const formattedResponse = formatResponse(chatbotResponse.text);
  
      const botMessage = {
        text: formattedResponse,
        created_at: new Date().toISOString(),
        user: 'bot',
        user_id: userId,
        chat_id: chatId, 
      };
  
      // Insert the bot message into the messages table
      const { error: botMessageError } = await supabase.from('messages').insert([botMessage]);
  
      if (botMessageError) {
        console.error(botMessageError);
      }
  
      if (threads.length === 0) {
        const threadDetails = {
          user: userId,
          chat_id: chatId,
          title: input.substring(0, 20),
        };
  
        const { error: threadError } = await supabase.from('threads').upsert([threadDetails], { onConflict: ['chat_id'] });
  
        if (threadError) {
          console.error('Error saving thread:', threadError);
        }
      }
    } catch (error) {
      console.error('Error getting chatbot response:', error);
    }
  };
    

  const formatResponse = (responseText) => {
    let formattedText = responseText;
  
    return formattedText;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        if (gestureState.dx > 50) {
          setSidebarVisible(true);
        } else if (gestureState.dx < -50) {
          setSidebarVisible(false);
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Header />
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={[styles.sidebarContainer, { width: sidebarVisible ? '40%' : 0 }]}>
          <Sidebar sidebarVisible={sidebarVisible} />
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={[styles.chatContainer, { flex: sidebarVisible ? 3 : 4 }]}
            {...panResponder.panHandlers}
          >

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <MessageItem item={item} />}
              onContentSizeChange={(contentWidth, contentHeight) => {
                const shouldScrollToEnd = (
                  flatListRef.current &&
                  flatListRef.current.layoutMeasurement &&
                  contentHeight > flatListRef.current.layoutMeasurement.height
                );
                if (shouldScrollToEnd) {
                  flatListRef.current.scrollToEnd({ animated: true });
                }
              }}
              onLayout={() => {
                const shouldScrollToEnd = (
                  flatListRef.current &&
                  flatListRef.current.contentSize &&
                  flatListRef.current.contentOffset &&
                  flatListRef.current.contentSize.height > flatListRef.current.layoutMeasurement.height &&
                  flatListRef.current.contentOffset.y > 0
                );
                if (shouldScrollToEnd) {
                  flatListRef.current.scrollToEnd({ animated: true });
                }
              }}
            />


            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Type your message"
              />
              <IconButton
                icon="send"
                color="#000"
                size={24}
                onPress={sendMessage}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#f4f4f4',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
  },
  chatSection: {
    flex: 1,
    padding: 10,
  },
  chatContainer: {
    flex: 1,
    // marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    padding: 10,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 25,
    marginRight: 10,
  },
  sidebarContainer: {
    left: 0,
    backgroundColor: '#f4f4f4',
    borderRightWidth: 1,
    overflow : 'hidden',
  },
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: '80%',
  },
  sentMessage: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  receivedMessage: {
    backgroundColor: '#f1f1f1',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    color: '#000',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
});

