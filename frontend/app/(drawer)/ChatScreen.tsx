'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  SafeAreaView,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '@/env';
import { lightTheme, darkTheme, ThemeType } from '@/styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/contexts/SocketContext';
import * as Haptics from 'expo-haptics';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Define types for message data
interface Message {
  id?: string;
  text: string;
  sender: string;
  timestamp: string;
  profilePhoto?: string;
  pending?: boolean; // For optimistic UI
  status?: 'SENT' | 'DELIVERED' | 'READ';
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
  const { t } = useTranslation();
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<boolean>(false);
  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Match Logic State
  const [matchStatus, setMatchStatus] = useState<'none' | 'matched_with_recipient' | 'matched_with_other' | 'loading'>('loading');
  const [isDriver, setIsDriver] = useState(false);
  const [realPostId, setRealPostId] = useState<string | null>(null);

  // Refs for stable access in listeners
  const currentUserRef = useRef<UserProfile | null>(null);
  const recipientRef = useRef<UserProfile | null>(null);

  // Update refs when state changes
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    recipientRef.current = recipient;
  }, [recipient]);

  // Socket
  const { socket, isConnected } = useSocket();

  // Navigation and params
  const router = useRouter();
  const { roomId, currentUserId, recipientId, recipientName } = useLocalSearchParams<any>();

  // References
  const flatListRef = useRef<FlatList>(null);

  // Theme setup
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

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

  // Check Match Status
  useEffect(() => {
    const checkMatchStatus = async () => {
      if (!roomId || !currentUser || !recipientId) return;

      try {
        const postId = roomId.includes('_') ? roomId.split('_')[0] : roomId;
        setRealPostId(postId);

        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/api/posts/${postId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const post = await response.json();
          const amIDriver = post.userId === currentUser.id;
          setIsDriver(amIDriver);

          if (post.matchedUserId) {
            if (post.matchedUserId === recipientId) {
              setMatchStatus('matched_with_recipient');
            } else {
              setMatchStatus('matched_with_other');
            }
          } else {
            setMatchStatus('none');
          }
        }
      } catch (e) {
        console.error("Error checking match status", e);
      }
    };
    checkMatchStatus();
  }, [roomId, currentUser, recipientId]);

  // Handle socket events and fetch initial messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join chat room
    // Note: Backend uses 'joinRoom' with 'rideId'. Assuming roomId param maps to rideId.
    socket.emit('joinRoom', { rideId: roomId });

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
          // Fallback or ignore if just starting
          // throw new Error(t('error_fetch_messages'));
        } else {
          const data = await response.json();
          // Add profile photos to messages
          const enhancedMessages = data.map((msg: any) => ({
            id: msg.id,
            text: msg.text,
            sender: msg.senderId || msg.sender, // Handle both structures
            timestamp: msg.timestamp,
            profilePhoto: (msg.senderId || msg.sender) === currentUserId
              ? currentUser?.profilePhoto
              : recipient?.profilePhoto,
            status: msg.status
          }));
          setMessages(enhancedMessages);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 200);

          // Mark read if needed
          if (currentUserId) {
            socket.emit('messages_read', { rideId: roomId, userId: currentUserId });
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError(t('error_load_messages'));
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Cleanup listeners is handled in the separate effect below
  }, [socket, isConnected, roomId, currentUserId, recipientId]);

  // Separate effect for listeners to avoid stale closures and re-binding
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleReceiveMessage = (newMessage: any) => {
      console.log('[Socket] Received Message:', newMessage);

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const senderId = newMessage.senderId || newMessage.sender;
      const currentId = currentUserRef.current?.id;

      const enhancedMessage: Message = {
        id: newMessage.id,
        text: newMessage.text,
        sender: senderId,
        timestamp: newMessage.timestamp,
        profilePhoto: senderId === currentId
          ? currentUserRef.current?.profilePhoto
          : recipientRef.current?.profilePhoto,
        status: newMessage.status
      };

      setMessages((prevMessages) => {
        const existingIndex = prevMessages.findIndex(m => m.id === enhancedMessage.id);
        if (existingIndex !== -1) {
          const newArr = [...prevMessages];
          if (JSON.stringify(newArr[existingIndex]) !== JSON.stringify(enhancedMessage)) {
            newArr[existingIndex] = enhancedMessage;
            return newArr;
          }
          return prevMessages;
        }

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        return [...prevMessages, enhancedMessage];
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      if (currentId && senderId !== currentId) {
        socket.emit('messages_read', { rideId: roomId, userId: currentId });
      }
    };

    const handleReadUpdate = ({ userId: readerId }: { userId: string }) => {
      setMessages(prev => prev.map(m => {
        if (m.sender !== readerId && m.status !== 'READ') {
          return { ...m, status: 'READ' };
        }
        return m;
      }));
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messages_read_update', handleReadUpdate);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messages_read_update', handleReadUpdate);
    };
  }, [socket, isConnected, roomId]);

  // Format date for display
  const formatMessageTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
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
    if (!message.trim()) return;

    const trimmedMessage = message.trim();
    setMessage('');
    setSending(true);

    const tempId = Date.now().toString();
    const timestamp = new Date().toISOString();

    const optimisticMessage: Message = {
      id: tempId,
      text: trimmedMessage,
      sender: currentUserId,
      timestamp,
      profilePhoto: currentUser?.profilePhoto,
      pending: true,
      status: 'SENT'
    };

    // Optimistic Update
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages((prev) => [...prev, optimisticMessage]);

    // Scroll
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Save message to the database
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rideId: roomId, // API expects rideId
          senderId: currentUserId,
          receiverId: recipientId,
          text: trimmedMessage
        }),
      });

      if (response.ok) {
        const savedMessage = await response.json();

        // Replace optimistic message with real one
        setMessages(prev => prev.map(m => m.id === tempId ? {
          ...m,
          id: savedMessage.id, // Update ID
          pending: false,
          status: 'SENT'
        } : m));

        // Socket will also emit, but we have updated ID now so dedupe logic in receiveMessage will handle it or update it.
      } else {
        throw new Error('Failed to send');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError(t('error_send_message'));
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const renderTicks = (status?: string, pending?: boolean) => {
    if (pending) return <Ionicons name="time-outline" size={14} color={theme.colors.white} />;
    if (status === 'READ') return <Ionicons name="checkmark-done" size={14} color={theme.colors.secondary} />; // Blue-ish
    if (status === 'DELIVERED') return <Ionicons name="checkmark-done" size={14} color={theme.colors.white} />;
    return <Ionicons name="checkmark" size={14} color={theme.colors.white} />;
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
          isCurrentUser ? styles(theme).myMessage : styles(theme).otherMessage,
          item.pending && { opacity: 0.7 }
        ]}>
          <Text style={[
            styles(theme).messageText,
            isCurrentUser ? styles(theme).myMessageText : styles(theme).otherMessageText
          ]}>
            {item.text}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 }}>
            <Text style={[
              styles(theme).timestamp,
              isCurrentUser ? styles(theme).myTimestamp : styles(theme).otherTimestamp
            ]}>
              {formatMessageTime(item.timestamp)}
            </Text>
            {isCurrentUser && (
              <View style={{ marginLeft: 4 }}>
                {renderTicks(item.status, item.pending)}
              </View>
            )}
          </View>
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

  // Handle Match
  const handleMatch = async () => {
    if (!realPostId || !recipientId) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/posts/${realPostId}/match`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ matchedUserId: recipientId })
      });

      if (response.ok) {
        setMatchStatus('matched_with_recipient');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const err = await response.json();
        alert(err.message || 'Error matching');
      }
    } catch (e) {
      console.error("Match error", e);
      alert('Error matching user');
    }
  };

  // Render header with recipient info
  const renderHeader = () => (
    <View style={styles(theme).header}>
      <TouchableOpacity
        style={styles(theme).backButton}
        onPress={() => router.back()}
      >
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
      </TouchableOpacity>

      <View style={styles(theme).headerAvatar}>
        {recipient?.profilePhoto ? (
          <Image source={{ uri: recipient.profilePhoto }} style={{ width: 46, height: 46, borderRadius: 23 }} />
        ) : (
          <MaterialIcons name="person" size={40} color={'#ccc'} />
        )}
      </View>

      <View style={styles(theme).headerInfo}>
        <Text style={styles(theme).headerName}>{recipient?.name || 'User'}</Text>
        <Text style={styles(theme).headerStatus}>
          {recipient?.isOnline ? t('online') : recipient?.lastSeen ? `${t('last_seen')} ${formatMessageTime(recipient.lastSeen)}` : t('offline')}
        </Text>
      </View>

      {/* Match Actions */}
      {isDriver && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {matchStatus === 'none' && (
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center'
              }}
              onPress={handleMatch}
            >
              <MaterialIcons name="person-add" size={16} color="white" style={{ marginRight: 4 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>{t('match')}</Text>
            </TouchableOpacity>
          )}
          {matchStatus === 'matched_with_recipient' && (
            <View style={{
              backgroundColor: theme.colors.success + '20',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.success
            }}>
              <Text style={{ color: theme.colors.success, fontSize: 12, fontWeight: 'bold' }}>{t('matched') || 'Matched'}</Text>
            </View>
          )}
          {matchStatus === 'matched_with_other' && (
            <View style={{
              backgroundColor: theme.colors.error + '20',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12
            }}>
              <Text style={{ color: theme.colors.error, fontSize: 12, fontWeight: 'bold' }}>Full</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  // Render loading state
  if (loading) {
    return (
      <View style={styles(theme).loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles(theme).loadingText}>{t('loading_messages')}</Text>
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
              <Text style={styles(theme).emptyText}>{t('no_messages_yet')}</Text>
              <Text style={styles(theme).emptySubtext}>{t('start_conversation')}</Text>
            </View>
          }
        />

        <View style={styles(theme).inputContainer}>
          <TextInput
            style={styles(theme).input}
            value={message}
            onChangeText={setMessage}
            placeholder={t('type_message')}
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
            <MaterialIcons name="send" size={24} color={theme.colors.white} />
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
    fontWeight: 'bold',
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
    marginTop: 0,
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