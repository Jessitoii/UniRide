import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local imports
import { BASE_URL } from '@/env';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { Header, Button } from '@/components/ui';
import { RideHistoryItem } from '@/components';
import { useTranslation } from 'react-i18next';

const TravelHistoryScreen = () => {
    const [matchedPosts, setMatchedPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { t } = useTranslation();
    const { theme, isDark } = useTheme();
    const router = useRouter();

    const fetchData = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/api/users/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setMatchedPosts(data.matchedPosts || []);
            } else {
                console.error('Error fetching history:', await response.json());
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    const extractDistrict = (address: string | undefined) => {
        if (!address) return '';
        const parts = address.split(',');
        return parts.length > 1 ? parts[0].trim() : address;
    };

    const now = new Date();
    const pastTravels = matchedPosts.filter((post: any) => new Date(post.datetimeEnd) < now);

    if (isLoading) {
        return (
            <View style={styles(theme).loadingContainer}>
                <Header title={t('past_travels')} showBackButton={true} />
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
            </View>
        );
    }

    return (
        <View style={styles(theme).container}>
            <Header title={t('past_travels')} showBackButton={true} />

            <ScrollView
                style={styles(theme).content}
                contentContainerStyle={styles(theme).scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {pastTravels.length === 0 ? (
                    <View style={styles(theme).emptyContainer}>
                        <View style={styles(theme).emptyIconCircle}>
                            <MaterialIcons name="history" size={48} color={theme.colors.primary} />
                        </View>
                        <Text style={styles(theme).emptyTitle}>{t('no_past_travels')}</Text>
                        <Text style={styles(theme).emptySubtitle}>
                            {t('past_travels_desc')}
                        </Text>
                        <Button
                            title={t('find_trip')}
                            onPress={() => router.push('/(drawer)/(tabs)/PassengerScreen')}
                            variant="primary"
                            style={styles(theme).emptyButton}
                        />
                    </View>
                ) : (
                    <View style={styles(theme).listContainer}>
                        {pastTravels.map((post: any) => (
                            <RideHistoryItem
                                key={post.id}
                                id={post.id}
                                date={new Date(post.datetimeStart)}
                                from={extractDistrict(post.sourceAddress)}
                                to={post.destinationFaculty}
                                status="completed"
                                driverName={post.user?.name || t('driver')}
                                onPress={() => router.push({
                                    pathname: '/(drawer)/PostDetailScreen',
                                    params: { postId: post.id }
                                })}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = (theme: ThemeType) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: theme.spacing['4xl'],
    },
    listContainer: {
        padding: theme.spacing.lg,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing['2xl'],
        marginTop: 60,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.primaryTransparent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    emptyTitle: {
        ...theme.textStyles.header2,
        color: theme.colors.textDark,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    emptySubtitle: {
        ...theme.textStyles.body,
        color: theme.colors.textLight,
        textAlign: 'center',
        marginBottom: theme.spacing['2xl'],
        lineHeight: 22,
    },
    emptyButton: {
        width: '100%',
        borderRadius: theme.borderRadius.full,
    },
});

export default TravelHistoryScreen;