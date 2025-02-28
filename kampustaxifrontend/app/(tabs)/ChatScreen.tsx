'use client';

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import io from 'react-native-socket.io-client';
import { useRoute } from '@react-navigation/native';
import { API_URL, DEFAULT_TIMEOUT } from '../../constants';

const socket = io('http://10.0.2.2:5000'); // Adjust the URL as needed
const BASE_URL = 'http://10.0.2.2:5000'; // Ensure this matches your server's URL

const ChatScreen = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ text: string; sender: string; timestamp: string }[]>([]);
  const route = useRoute();
  const { roomId, currentUserId, recipientId } = route.params as { roomId: string; currentUserId: string; recipientId: string };
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/chat/messages/${roomId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setMessages(data as { text: string; sender: string; timestamp: string }[]);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
    socket.emit('joinRoom', { roomId });

    socket.on('receiveMessage', (newMessage: { text: string; sender: string; timestamp: string }) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [roomId]);

  const sendMessage = async () => {
    if (message.trim()) {
      const newMessage = { text: message, sender: 'me', timestamp: new Date().toLocaleTimeString() };
      socket.emit('sendMessage', { roomId, message: newMessage });
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage('');

      // Save message to the database
      try {
        const response = await fetch(`${BASE_URL}/api/chat/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ roomId, senderId: currentUserId, receiverId: recipientId, text: message }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
      } catch (error) {
        console.error('Error saving message:', error);
      }

      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.sender === 'me' ? styles.myMessage : styles.otherMessage]}>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#007bff',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#e5e5ea',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#ccc',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007bff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ChatScreen; 