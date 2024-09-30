import React, { useState } from 'react';
import { View, TextInput, Button, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

export default function ChatbotPage() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const handleSendMessage = async () => {
    if (message.trim()) {
      const userMessage = `User: ${message}`;
      setChatHistory(prev => [...prev, { key: userMessage }]);

      try {
        const response = await axios.post('http://127.0.0.1:8000/api/chat/', {
          message: message,
        });
        const aiResponse = `AI: ${response.data.response}`;
        setChatHistory(prev => [...prev, { key: aiResponse }]);
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage = "Stack-It: Sorry, there was an error processing your request.";
        setChatHistory(prev => [...prev, { key: errorMessage }]);
      }

      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chatbot</Text>
      <FlatList
        data={chatHistory}
        renderItem={({ item }) => <Text style={styles.chatMessage}>{item.key}</Text>}
        keyExtractor={(item) => item.key}
      />
      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        value={message}
        onChangeText={setMessage}
      />
      <Button title="Send" onPress={handleSendMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  chatMessage: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  input: {
    width: '80%',
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
});
ChatbotPage.js