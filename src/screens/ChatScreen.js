import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../utils/supabase';
import { getChatbotResponse } from '../api/geminiProAPI';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

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
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const sendMessage = async () => {
    const userMessage = {
      text: input,
      created_at: new Date().toISOString(),
      user: 'user', // This should be dynamic based on logged-in user
    };

    const { error: userMessageError } = await supabase.from('messages').insert([userMessage]);

    if (userMessageError) {
      console.error(userMessageError);
    }

    const chatbotResponse = await getChatbotResponse(input);

    const botMessage = {
      text: chatbotResponse.reply,
      created_at: new Date().toISOString(),
      user: 'bot'
    };

    const { error: botMessageError } = await supabase.from('messages').insert([botMessage]);

    if (botMessageError) {
      console.error(botMessageError);
    }

    setInput('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.messageContainer}>
            <Text>{item.user}: {item.text}</Text>
          </View>
        )}
      />
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder="Type your message"
      />
      <Button title="Send" onPress={sendMessage} />
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
  },
});
