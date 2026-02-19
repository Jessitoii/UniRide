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
import { useSocket } from '@/contexts/SocketContext';

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
    const { onlineUsers } = useSocket();

    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const fetchThreads = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${BASE_URL}/api/users/travel-data`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const profileId = data.profile.id;
                setUserId(profileId);

                const myActivePosts = data.myActivePosts || [];
                const matchedPosts = data.matchedPosts || [];

                const allRides = [...myActivePosts, ...matchedPosts];

                const mappedThreads: ChatThread[] = allRides.map((post: any) => {
                    const isDriver = post.userId === profileId;
                    const otherUser = isDriver ? post.matchedUser : post.user;

                    return {
                        id: post.id,
                        name: `${post.destinationUniversity} Ride`,
                        participants: otherUser ? [otherUser] : [],
                        post: post,
                        avatar: otherUser?.avatar
                    };
                }).filter((t: ChatThread) => t.post.matchedUserId);

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
        const partner = item.participants[0];
        const partnerName = partner?.name || t('unknown_user');
        const partnerId = partner?.id;
        const isOnline = partnerId && onlineUsers.includes(partnerId);

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
                    {isOnline && <View style={styles(theme).onlineDot} />}
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
        position: 'relative',
    },
    onlineDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: theme.colors.success,
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderWidth: 2,
        borderColor: theme.colors.surface,
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
        color: theme.colors.textLight,
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
