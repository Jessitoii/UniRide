'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Image, 
  StatusBar, 
  ActivityIndicator,
  useColorScheme,
  SafeAreaView
} from 'react-native';
import io from 'react-native-socket.io-client';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { BASE_URL } from '@/env';
import { lightTheme, darkTheme, ThemeType } from '../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define custom Socket interface
interface Socket {
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
  disconnect: () => void;
}

// Define types for message data
interface Message {
  id?: string;
  text: string;
  sender: string;
  timestamp: string;
  profilePhoto?: string;
}

// Define types for route params
interface ChatRouteParams {
  roomId: string;
  currentUserId: string;
  recipientId: string;
  recipientName?: string;
}

// Define types for user data
interface UserProfile {
  id: string;
  name: string;
  profilePhoto?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

const ChatScreen = () => {
  // State management
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Navigation and route
  const route = useRoute();
  const navigation = useNavigation();
  const { roomId, currentUserId, recipientId, recipientName } = route.params as ChatRouteParams;
  
  // References
  const flatListRef = useRef<FlatList>(null);
  
  // Theme setup
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(BASE_URL, {
      transports: ['websocket'],
      query: {
        userId: currentUserId
      }
    });
    
    setSocket(newSocket);
    
    // Cleanup socket connection
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [currentUserId]);

  // Load user profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        // Fetch current user profile
        const token = await AsyncStorage.getItem('token');
        const currentResponse = await fetch(`${BASE_URL}/api/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (currentResponse.ok) {
          const currentUserData = await currentResponse.json();
          setCurrentUser({
            id: currentUserData.id,
            name: currentUserData.name,
            profilePhoto: `${BASE_URL}/api/users/profilePhoto/${currentUserData.id}`,
            isOnline: true,
          });
        }
        
        // Fetch recipient profile
        const recipientResponse = await fetch(`${BASE_URL}/api/users/${recipientId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (recipientResponse.ok) {
          const recipientData = await recipientResponse.json();
          setRecipient({
            id: recipientData.id,
            name: recipientData.name || recipientName || 'User',
            profilePhoto: `${BASE_URL}/api/users/profilePhoto/${recipientData.id}`,
            isOnline: recipientData.isOnline,
            lastSeen: recipientData.lastSeen,
          });
        }
      } catch (error) {
        console.error('Error fetching user profiles:', error);
      }
    };
    
    fetchProfiles();
  }, [currentUserId, recipientId, recipientName]);

  // Handle socket events and fetch initial messages
  useEffect(() => {
    if (!socket) return;
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${BASE_URL}/api/chat/messages/${roomId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        
        // Add profile photos to messages
        const enhancedMessages = data.map((msg: Message) => ({
          ...msg,
          profilePhoto: msg.sender === currentUserId 
            ? currentUser?.profilePhoto 
            : recipient?.profilePhoto
        }));
        
        setMessages(enhancedMessages);
        
        // Scroll to the latest message
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 200);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    
    // Join chat room
    socket.emit('joinRoom', { roomId });

    // Listen for new messages
    socket.on('receiveMessage', (newMessage: Message) => {
      const enhancedMessage = {
        ...newMessage,
        profilePhoto: newMessage.sender === currentUserId 
          ? currentUser?.profilePhoto 
          : recipient?.profilePhoto
      };
      
      setMessages((prevMessages) => [...prevMessages, enhancedMessage]);
      
      // Scroll to the new message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [socket, roomId, currentUserId, currentUser, recipient]);

  // Format date for display
  const formatMessageTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        // If parsing fails, use the original format
        return timestamp;
      }
      
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return `${date.toLocaleDateString([], { day: 'numeric', month: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    } catch (error) {
      return timestamp;
    }
  };

  // Send a message
  const sendMessage = async () => {
    if (!message.trim() || !socket) return;
    
    const trimmedMessage = message.trim();
    setMessage('');
    setSending(true);
    
    try {
      const timestamp = new Date().toISOString();
      
      const newMessage = {
        text: trimmedMessage,
        sender: currentUserId,
        timestamp,
        profilePhoto: currentUser?.profilePhoto
      };
      
      // Emit message to socket
      socket.emit('sendMessage', { roomId, message: newMessage });
      
      // Optimistically add message to the list
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      
      // Save message to the database
      await fetch(`${BASE_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          roomId, 
          senderId: currentUserId, 
          receiverId: recipientId, 
          text: trimmedMessage 
        }),
      });
      
      // Scroll to the new message
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message
      setError('Failed to send message. Please try again.');
      
      // Remove the optimistically added message
      setMessages((prevMessages) => prevMessages.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  // Render message item
  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.sender === currentUserId;
    
    return (
      <View style={[
        styles(theme).messageRow,
        isCurrentUser ? styles(theme).rightRow : styles(theme).leftRow
      ]}>
        {!isCurrentUser && (
          <Image 
            source={{ uri: `${BASE_URL}/api/users/profilephoto/${item.sender}` }}
            style={styles(theme).avatar}
          />
        )}
        
        <View style={[
          styles(theme).messageBubble, 
          isCurrentUser ? styles(theme).myMessage : styles(theme).otherMessage
        ]}>
          <Text style={[
            styles(theme).messageText,
            isCurrentUser ? styles(theme).myMessageText : styles(theme).otherMessageText
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles(theme).timestamp,
            isCurrentUser ? styles(theme).myTimestamp : styles(theme).otherTimestamp
          ]}>
            {formatMessageTime(item.timestamp)}
          </Text>
        </View>
        
        {isCurrentUser && (
          <Image 
            source={{ uri: `${BASE_URL}/api/users/profilephoto/${item.sender}` }}
            style={styles(theme).avatar}
          />
        )}
      </View>
    );
  };

  // Render header with recipient info
  const renderHeader = () => (
    <View style={styles(theme).header}>
      <TouchableOpacity 
        style={styles(theme).backButton} 
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      
      <View style={styles(theme).headerAvatar}>
        <MaterialIcons name="person" size={40} color={'#ccc'} />
      </View>
      
      <View style={styles(theme).headerInfo}>
        <Text style={styles(theme).headerName}>{recipient?.name || 'User'}</Text>
        <Text style={styles(theme).headerStatus}>
          {recipient?.isOnline ? 'Online' : recipient?.lastSeen ? `Last seen ${formatMessageTime(recipient.lastSeen)}` : 'Offline'}
        </Text>
      </View>
    </View>
  );

  // Render loading state
  if (loading) {
    return (
      <View style={styles(theme).loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles(theme).loadingText}>Mesajlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles(theme).safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {renderHeader()}
      
      <KeyboardAvoidingView 
        style={styles(theme).container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {error && (
          <View style={styles(theme).errorContainer}>
            <Text style={styles(theme).errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <MaterialIcons name="close" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item.id || `msg-${index}`}
          contentContainerStyle={styles(theme).messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles(theme).emptyContainer}>
              <MaterialIcons name="chat-bubble-outline" size={60} color={theme.colors.textLight} />
              <Text style={styles(theme).emptyText}>Henüz mesaj yok</Text>
              <Text style={styles(theme).emptySubtext}>Sohbete başlamak için bir mesaj gönder</Text>
            </View>
          }
        />
        
        <View style={styles(theme).inputContainer}>
          <TextInput
            style={styles(theme).input}
            value={message}
            onChangeText={setMessage}
            placeholder="Mesaj yazın..."
            placeholderTextColor={theme.colors.textLight}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[
              styles(theme).sendButton,
              (!message.trim() || sending) && styles(theme).disabledButton
            ]} 
            onPress={sendMessage}
            disabled={!message.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <MaterialIcons name="send" size={24} color={theme.colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = (theme: ThemeType) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    ...theme.textStyles.body,
    color: theme.colors.textDark,
    marginTop: theme.spacing.md,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    marginTop: StatusBar.currentHeight,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  backButton: {
    marginRight: theme.spacing.sm,
  },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 80,
    marginRight: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: '#f1f1f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    ...theme.textStyles.header3,
    color: theme.colors.textDark,
  },
  headerStatus: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.textLight,
  },
  messageList: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.sm,
  },
  rightRow: {
    justifyContent: 'flex-end',
  },
  leftRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: theme.spacing.xs,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  myMessage: {
    backgroundColor: theme.colors.primary,
    borderTopRightRadius: 0,
    marginLeft: theme.spacing.md,
  },
  otherMessage: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 0,
    marginRight: theme.spacing.md,
  },
  messageText: {
    ...theme.textStyles.body,
  },
  myMessageText: {
    color: theme.colors.white,
  },
  otherMessageText: {
    color: theme.colors.textDark,
  },
  timestamp: {
    ...theme.textStyles.bodySmall,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: theme.colors.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderTopWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.card,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
    color: theme.colors.textDark,
    backgroundColor: theme.colors.surface,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  disabledButton: {
    backgroundColor: theme.colors.divider,
    opacity: 0.7,
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.error,
  },
  errorText: {
    ...theme.textStyles.body,
    color: theme.colors.error,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...theme.textStyles.header3,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    ...theme.textStyles.body,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});

export default ChatScreen; 