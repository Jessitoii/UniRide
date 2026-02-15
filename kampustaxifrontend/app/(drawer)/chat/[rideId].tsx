
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, FlatList, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSocket } from '@/contexts/SocketContext';
import { useTheme } from '@/contexts/ThemeContext';
import { BASE_URL } from '@/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeType } from '@/styles/theme';

interface IMessage {
    id: string;
    text: string;
    senderId: string;
    receiverId: string; // "roomId" is rideId
    timestamp: string;
    sender: {
        id: string;
        name: string;
        surname?: string;
    };
    status?: 'SENT' | 'DELIVERED' | 'READ';
}

export default function ChatScreen() {
    const { rideId } = useLocalSearchParams<{ rideId: string }>();
    const { socket } = useSocket();
    const { theme } = useTheme();
    const router = useRouter();
    const { t } = useTranslation();

    const [messages, setMessages] = useState<IMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [receiverId, setReceiverId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // Typing state
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<any>(null);
    const [isRemoteTyping, setIsRemoteTyping] = useState(false);

    // Fetch initial messages and determine user roles
    useEffect(() => {
        const initChat = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const userProfileRes = await fetch(`${BASE_URL}/api/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userProfile = await userProfileRes.json();
                setUserId(userProfile.id);

                // Fetch Messages
                const msgsRes = await fetch(`${BASE_URL}/api/chat/messages/${rideId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const msgsData = await msgsRes.json();
                setMessages(msgsData);

                // Determine Receiver ID
                // We need to know who we are talking to.
                // Fetch Post details to find the other party.
                const postRes = await fetch(`${BASE_URL}/api/posts/${rideId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const post = await postRes.json();

                if (post.userId === userProfile.id) {
                    setReceiverId(post.matchedUserId);
                } else if (post.matchedUserId === userProfile.id) {
                    setReceiverId(post.userId);
                }

                setLoading(false);

                // Mark messages as read immediately upon open
                if (socket && rideId) {
                    socket.emit('messages_read', { rideId, userId: userProfile.id });
                }
            } catch (error) {
                console.error("Chat init error", error);
                setLoading(false);
            }
        };

        if (rideId) {
            initChat();
        }
    }, [rideId]);

    // Socket Listener
    useEffect(() => {
        if (!socket || !rideId) return;

        socket.emit('joinRoom', { rideId });

        socket.on('receiveMessage', (message: IMessage) => {
            setMessages(prev => {
                if (prev.find(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

            // If I am active and receive a message, I read it
            if (userId && message.senderId !== userId) {
                socket.emit('messages_read', { rideId, userId });
            }
        });

        socket.on('typing_start', ({ userId: typerId }) => {
            if (typerId !== userId) setIsRemoteTyping(true);
        });

        socket.on('typing_stop', ({ userId: typerId }) => {
            if (typerId !== userId) setIsRemoteTyping(false);
        });

        socket.on('messages_read_update', ({ userId: readerId }) => {
            // Update all my sent messages to READ
            setMessages(prev => prev.map(m => {
                if (m.senderId !== readerId && m.status !== 'READ') {
                    return { ...m, status: 'READ' };
                }
                return m;
            }));
        });

        return () => {
            socket.off('receiveMessage');
            socket.off('typing_start');
            socket.off('typing_stop');
            socket.off('messages_read_update');
        };
    }, [socket, rideId, userId]);

    // Handle typing
    const handleInputChange = (text: string) => {
        setInputText(text);

        if (!socket || !userId) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.emit('typing_start', { rideId, userId });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit('typing_stop', { rideId, userId });
        }, 2000);
    };

    const sendMessage = async () => {
        if (!inputText.trim() || !userId || !receiverId) return;

        const textToSend = inputText.trim();
        setInputText('');

        // Stop typing immediately
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setIsTyping(false);
        socket?.emit('typing_stop', { rideId, userId });

        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/chat/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rideId,
                    senderId: userId,
                    receiverId,
                    text: textToSend
                })
            });

            if (!res.ok) {
                console.error("Failed to send message");
            }
        } catch (error) {
            console.error("Send error", error);
        }
    };

    const handleBlock = () => {
        // Implement block logic or navigation
        // For now, alert
        alert("Block functionality to be implemented fully.");
    };

    const renderTicks = (status?: string) => {
        if (!status || status === 'SENT') return <Ionicons name="checkmark" size={12} color={theme.colors.textLight} />;
        if (status === 'DELIVERED') return <Ionicons name="checkmark-done" size={12} color={theme.colors.textLight} />;
        if (status === 'READ') return <Ionicons name="checkmark-done" size={12} color={theme.colors.primary} />;
        return null;
    };

    const renderItem = ({ item }: { item: IMessage }) => {
        const isMyMessage = item.senderId === userId;
        return (
            <View style={[
                styles(theme).bubbleContainer,
                isMyMessage ? styles(theme).bubbleRight : styles(theme).bubbleLeft
            ]}>
                <View style={[
                    styles(theme).bubble,
                    isMyMessage ? styles(theme).bubbleRightColor : styles(theme).bubbleLeftColor
                ]}>
                    <Text style={[styles(theme).messageText, isMyMessage ? { color: '#fff' } : { color: theme.colors.textDark }]}>
                        {item.text}
                    </Text>
                    <View style={styles(theme).metaContainer}>
                        <Text style={[styles(theme).timestamp, isMyMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: theme.colors.textLight }]}>
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {isMyMessage && (
                            <View style={{ marginLeft: 4 }}>
                                {renderTicks(item.status)}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles(theme).container}>
            <Stack.Screen options={{
                headerTitle: () => (
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.textDark }}>{t('chat')}</Text>
                        {isRemoteTyping && <Text style={{ fontSize: 10, color: theme.colors.primary }}>{t('typing')}...</Text>}
                    </View>
                ),
                headerRight: () => (
                    <TouchableOpacity onPress={handleBlock} style={{ padding: 10 }}>
                        <Ionicons name="alert-circle-outline" size={24} color={theme.colors.error} />
                    </TouchableOpacity>
                )
            }} />

            {loading ? (
                <View style={styles(theme).center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles(theme).listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    />

                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                        <View style={styles(theme).inputContainer}>
                            <TextInput
                                style={styles(theme).input}
                                value={inputText}
                                onChangeText={handleInputChange}
                                placeholder={t('type_message')}
                                placeholderTextColor={theme.colors.textLight}
                                onSubmitEditing={sendMessage}
                            />
                            <TouchableOpacity onPress={sendMessage} style={styles(theme).sendButton} disabled={!inputText.trim()}>
                                <Ionicons name="send" size={20} color={inputText.trim() ? '#fff' : 'rgba(255,255,255,0.5)'} />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = (theme: ThemeType) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    bubbleContainer: {
        width: '100%',
        marginVertical: 5,
        flexDirection: 'row',
    },
    bubbleRight: {
        justifyContent: 'flex-end',
    },
    bubbleLeft: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 15,
        elevation: 1,
    },
    bubbleRightColor: {
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 2,
    },
    bubbleLeftColor: {
        backgroundColor: theme.colors.surface, // Assuming surface is contrasting enough or white/grey
        borderBottomLeftRadius: 2,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    messageText: {
        fontSize: 16,
    },
    timestamp: {
        fontSize: 10,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        color: theme.colors.textDark,
        marginRight: 10,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
