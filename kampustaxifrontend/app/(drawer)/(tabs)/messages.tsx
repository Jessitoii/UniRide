
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

import { useTheme } from '@/contexts/ThemeContext';
import { BASE_URL } from '@/env';
import { ThemeType } from '@/styles/theme';

interface ChatThread {
    id: string; // Ride ID (Post ID)
    name: string; // Chat Name (e.g., "From X to Y")
    lastMessage?: string;
    lastMessageTime?: string;
    avatar?: string;
    unreadCount?: number;
    participants: {
        id: string;
        name: string;
        avatar?: string;
    }[];
    post: any; // Full post object logic
}

export default function MessagesScreen() {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const fetchThreads = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            // Determine user ID from token or stored profile
            // Better to fetch profile explicitly if not stored.
            if (!token) return;

            // We use travel-data to get active rides
            const response = await fetch(`${BASE_URL}/api/users/travel-data`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const profileId = data.profile.id;
                setUserId(profileId);

                const myActivePosts = data.myActivePosts || [];
                const matchedPosts = data.matchedPosts || [];

                // Combine and map to threads
                const allRides = [...myActivePosts, ...matchedPosts];

                // This is a simplified "Thread List" derived from active rides.
                // In a real app, we might query the Message table for "last message" etc.
                // For Phase 1, we list the rides where chat is available.

                const mappedThreads: ChatThread[] = allRides.map((post: any) => {
                    const isDriver = post.userId === profileId;
                    const otherUser = isDriver ? post.matchedUser : post.user;

                    // If no matched user yet, maybe don't show chat? Or show "Waiting for passengers"
                    // Requirement: "A user should only be able to send a message if Post.matchedUserId === userId" (or driver)
                    // So if matchedUserId is null, chat might be disabled or empty.

                    const hasMatch = !!post.matchedUserId;

                    return {
                        id: post.id,
                        name: `${post.destinationUniversity} Ride`, // Should probably use "Route" terminology
                        // lastMessage: "Open to chat", // Placeholder
                        participants: otherUser ? [otherUser] : [],
                        post: post,
                        avatar: otherUser?.avatar
                    };
                }).filter(t => t.post.matchedUserId); // Only show threads with matches for now? The surgeon said remove money, but let's keep logic sound.

                setThreads(mappedThreads);
            }
        } catch (error) {
            console.error('Error fetching threads:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchThreads();
    }, [fetchThreads]);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchThreads();
    };

    const renderItem = ({ item }: { item: ChatThread }) => {
        const isDriver = item.post.userId === userId;
        const roleLabel = isDriver ? t('driver') : t('passenger');

        // Aesthetic: "Mini-WhatsApp"
        // Title: Partner Name
        // Subtitle: Route info

        const partnerName = item.participants[0]?.name || t('unknown_user');
        const routeInfo = `${item.post.sourceAddress.split(',')[0]} ➝ ${item.post.destinationFaculty}`;

        return (
            <TouchableOpacity
                style={styles(theme).itemContainer}
                onPress={() => router.push({ pathname: '/(drawer)/chat/[rideId]', params: { rideId: item.id } })}
            >
                <View style={styles(theme).avatarContainer}>
                    <Image
                        source={require('@/assets/images/adaptive-icon.png')} // Fallback
                        style={styles(theme).avatar}
                    />
                </View>
                <View style={styles(theme).textContainer}>
                    <View style={styles(theme).headerRow}>
                        <Text style={styles(theme).nameText}>{partnerName}</Text>
                        <Text style={styles(theme).timeText}>
                            {format(new Date(item.post.createdAt), 'HH:mm', { locale: i18n.language === 'tr' ? tr : enUS })}
                        </Text>
                    </View>
                    <Text style={styles(theme).messageText} numberOfLines={1}>
                        {routeInfo}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles(theme).centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles(theme).container}>
            {threads.length === 0 ? (
                <View style={styles(theme).emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textLight} />
                    <Text style={styles(theme).emptyText}>{t('no_chats_yet')}</Text>
                    <Text style={styles(theme).emptySubText}>{t('join_ride_to_chat')}</Text>
                </View>
            ) : (
                <FlatList
                    data={threads}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={{ paddingVertical: 10 }}
                />
            )}
        </View>
    );
}

const styles = (theme: ThemeType) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
    },
    avatarContainer: {
        marginRight: 15,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.primaryLight,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    nameText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textDark,
    },
    timeText: {
        fontSize: 12,
        color: theme.colors.textLight,
    },
    messageText: {
        fontSize: 14,
        color: theme.colors.textMedium,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.textDark,
        marginTop: 20
    },
    emptySubText: {
        fontSize: 14,
        color: theme.colors.textLight,
        marginTop: 10,
        textAlign: 'center'
    }
});
