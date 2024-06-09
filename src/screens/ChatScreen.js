
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, PanResponder } from 'react-native';
import { IconButton } from 'react-native-paper';

import { supabase } from '../utils/supabase';
import { getChatbotResponse } from '../api/geminiProAPI';
import Sidebar from '../components/SideBar';
import Header from '../components/Header';

const MessageItem = React.memo(({ item }) => (
  <View style={[
    styles.messageContainer,
    { alignSelf: item.user === 'user' ? 'flex-end' : 'flex-start' }
  ]}>
    <Text>{item.user}: {item.text}</Text>
  </View>
));

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true); // Initially hide sidebar

  const flatListRef = useRef();

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
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
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      text: input,
      created_at: new Date().toISOString(),
      user: 'user',
    };

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
      };

      const { error: botMessageError } = await supabase.from('messages').insert([botMessage]);

      if (botMessageError) {
        console.error(botMessageError);
      }
    } catch (error) {
      console.error('Error getting chatbot response:', error);
    }
  };

  const formatResponse = (responseText) => {
    let formattedText = responseText;
  
    return formattedText;
  };
  
  // PanResponder for handling swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        if (gestureState.dx > 50) {
          // Open sidebar if swipe gesture is towards right
          setSidebarVisible(true);
        } else if (gestureState.dx < -50) {
          // Close sidebar if swipe gesture is towards left
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
        <View style={[styles.sidebarContainer, { width: sidebarVisible ? '20%' : 0 }]}>
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
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#f4f4f4',
    padding: 5,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  chatContainer: {
    padding: 10,
  },
  messageContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    maxWidth: '80%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
borderRadius: 55,
  },
  sidebarContainer: {
    left: 0,
    backgroundColor: '#f4f4f4',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
});

