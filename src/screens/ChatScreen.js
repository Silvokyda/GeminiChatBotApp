import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { firebase } from '../supabase/firebase';
import { getChatbotResponse } from '../api/geminiProAPI';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const unsubscribe = firebase.firestore().collection('messages').orderBy('createdAt').onSnapshot(snapshot => {
      setMessages(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return unsubscribe;
  }, []);

  const sendMessage = async () => {
    const userMessage = {
      text: input,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      user: 'user'
    };

    await firebase.firestore().collection('messages').add(userMessage);

    const chatbotResponse = await getChatbotResponse(input);

    const botMessage = {
      text: chatbotResponse.reply,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      user: 'bot'
    };

    await firebase.firestore().collection('messages').add(botMessage);

    setInput('');
  };

  return (
    <View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.user}: {item.text}</Text>
          </View>
        )}
      />
      <TextInput value={input} onChangeText={setInput} />
      <Button title="Send" onPress={sendMessage} />
    </View>
  );
}
