import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local imports
import { BASE_URL } from '@/env';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { Header, Button } from '@/components/base';
import { RideHistoryItem } from '@/components/business';
import { useTranslation } from 'react-i18next';

type TabType = 'driver' | 'passenger';

const TravelHistoryScreen = () => {
    const [history, setHistory] = useState<{ driverHistory: any[]; passengerHistory: any[] }>({
        driverHistory: [],
        passengerHistory: []
    });
    const [selectedTab, setSelectedTab] = useState<TabType>('passenger'); // Default to passenger as most users start there
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { t } = useTranslation();
    const { theme } = useTheme();
    const router = useRouter();

    const fetchData = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/api/users/travel-history`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setHistory({
                    driverHistory: data.driverHistory || [],
                    passengerHistory: data.passengerHistory || []
                });
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

    const handleItemPress = (item: any, isDriverView: boolean) => {
        // If passenger view, go to driver profile to rate/view
        if (!isDriverView && item.user?.id) {
            router.push({
                pathname: '/(drawer)/UserProfileScreen',
                params: { userId: item.user.id }
            });
        }
        // If driver view, go to matched passenger profile if exists
        else if (isDriverView && item.matchedUser?.id) {
            router.push({
                pathname: '/(drawer)/UserProfileScreen',
                params: { userId: item.matchedUser.id }
            });
        }
        else {
            // Fallback to post detail if no specific user to rate
            router.push({
                pathname: '/(drawer)/PostDetailScreen',
                params: { postId: item.id }
            });
        }
    };

    const renderTab = (tab: TabType, label: string) => (
        <TouchableOpacity
            style={[
                styles(theme).tabButton,
                selectedTab === tab && styles(theme).activeTab
            ]}
            onPress={() => setSelectedTab(tab)}
        >
            <Text style={[
                styles(theme).tabText,
                selectedTab === tab && styles(theme).activeTabText
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const activeList = selectedTab === 'driver' ? history.driverHistory : history.passengerHistory;
    const isDriverView = selectedTab === 'driver';

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

            <View style={styles(theme).tabContainer}>
                {renderTab('driver', t('driver') || 'Sürücü')}
                {renderTab('passenger', t('passenger') || 'Yolcu')}
            </View>

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
                {activeList.length === 0 ? (
                    <View style={styles(theme).emptyContainer}>
                        <View style={styles(theme).emptyIconCircle}>
                            <MaterialIcons name="history" size={48} color={theme.colors.primary} />
                        </View>
                        <Text style={styles(theme).emptyTitle}>
                            {isDriverView ? t('no_drives_history') : t('no_past_travels')}
                        </Text>
                        <Text style={styles(theme).emptySubtitle}>
                            {isDriverView ? t('no_drives_desc') : t('past_travels_desc')}
                        </Text>
                    </View>
                ) : (
                    <View style={styles(theme).listContainer}>
                        {activeList.map((post: any) => (
                            <View
                                key={post.id}
                                style={{ opacity: 0.7, marginBottom: 12 }} // Applied 0.7 opacity as requested
                            >
                                <RideHistoryItem
                                    id={post.id}
                                    date={new Date(post.datetimeStart)}
                                    from={extractDistrict(post.sourceAddress)}
                                    to={post.destinationFaculty}
                                    status={post.effectiveStatus ? post.effectiveStatus.toLowerCase() : 'completed'}
                                    driverName={!isDriverView ? (post.user?.name || t('driver')) : undefined}
                                    passengerName={isDriverView ? (post.matchedUser?.name || t('passenger')) : undefined}
                                    isDriver={isDriverView}
                                    onPress={() => handleItemPress(post, isDriverView)}
                                />
                            </View>
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
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    tabButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        ...theme.textStyles.button,
        color: theme.colors.textLight,
    },
    activeTabText: {
        color: theme.colors.primary,
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
});

export default TravelHistoryScreen;