import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../utils/supabase';
import { getChatbotResponse } from '../api/geminiProAPI';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Ref to scroll to the bottom of FlatList
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
        // Scroll to the bottom when messages update
        flatListRef.current.scrollToEnd();
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages((prev) => [...prev, payload.new]);
        // Scroll to the bottom when new message arrives
        flatListRef.current.scrollToEnd();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return; // Ignore empty messages
    
    const userMessage = {
      text: input,
      created_at: new Date().toISOString(),
      user: 'user', // This should be dynamic based on logged-in user
    };
  
    const { error: userMessageError } = await supabase.from('messages').insert([userMessage]);
  
    if (userMessageError) {
      console.error(userMessageError);
      return;
    }
  
    setInput('');

    try {
      const chatbotResponse = await getChatbotResponse(input);
  
      const botMessage = {
        text: chatbotResponse.text, 
        created_at: new Date().toISOString(),
        user: 'bot'
      };
  
      const { error: botMessageError } = await supabase.from('messages').insert([botMessage]);
  
      if (botMessageError) {
        console.error(botMessageError);
      }
    } catch (error) {
      console.error('Error getting chatbot response:', error);
    }
  };  

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[
            styles.messageContainer,
            { alignSelf: item.user === 'user' ? 'flex-end' : 'flex-start' }
          ]}>
            <Text>{item.user}: {item.text}</Text>
          </View>
        )}
        onContentSizeChange={() => flatListRef.current.scrollToEnd()}
        onLayout={() => flatListRef.current.scrollToEnd()}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message"
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
    marginRight: 10,
  },
});
