'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeType } from '@/styles/theme';
import { userService } from '@/services/userService';
import RatingInput from '@/components/business/RatingInput';
import Button from '@/components/base/Button';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '@/contexts/ProfileContext';

const ReviewScreen = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const router = useRouter();
    const { post: postParam } = useLocalSearchParams<{ post: string }>();
    const post = postParam ? JSON.parse(postParam) : {};
    const { profile } = useProfile();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Determine who we are reviewing
    const isDriver = profile?.id === post.userId;
    const reviewedUserId = isDriver ? post.matchedUserId : post.userId;
    // We need the name of the person we are reviewing.
    // Ideally post object has `matchedUser` or `user` populated.
    const reviewedUser = isDriver ? post.matchedUser : post.user;

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert(t('error'), t('please_rate'));
            return;
        }

        try {
            setSubmitting(true);
            await userService.submitReview({
                reviewedUserId: reviewedUserId,
                star: rating,
                comment: comment,
                postId: post.id
            });
            Alert.alert(t('success'), t('review_submitted'), [
                { text: 'OK', onPress: () => router.replace('/(drawer)/(tabs)/PassengerScreen') }
            ]);
        } catch (error) {
            Alert.alert(t('error'), t('review_error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = () => {
        router.replace('/(drawer)/(tabs)/PassengerScreen');
    };

    return (
        <ScrollView contentContainerStyle={styles(theme).container}>
            <View style={styles(theme).header}>
                <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
                <Text style={styles(theme).title}>{t('trip_completed')}</Text>
                <Text style={styles(theme).subtitle}>
                    {post.sourceAddress} ➝ {post.destinationFaculty}
                </Text>
            </View>

            <View style={styles(theme).card}>
                <View style={styles(theme).avatarContainer}>
                    <Image
                        source={require('@/assets/images/adaptive-icon.png')}
                        style={styles(theme).avatar}
                    />
                    <Text style={styles(theme).revieweeName}>
                        {reviewedUser?.name || t('unknown_user')}
                    </Text>
                    <Text style={styles(theme).roleLabel}>
                        {isDriver ? t('passenger') : t('driver')}
                    </Text>
                </View>

                <Text style={styles(theme).question}>{t('how_was_ride')}</Text>

                <RatingInput
                    initialRating={0}
                    onRatingChange={setRating}
                    showFeedback={true}
                    feedbackLabel={t('leave_comment')}
                    feedbackPlaceholder={t('comment_placeholder')}
                    onFeedbackChange={setComment}
                    style={{ marginTop: 20 }}
                />
            </View>

            <View style={styles(theme).footer}>
                <Button
                    title={t('submit_review')}
                    onPress={handleSubmit}
                    isLoading={submitting}
                    disabled={submitting}
                    style={styles(theme).submitButton}
                />
                <TouchableOpacity onPress={handleSkip} style={styles(theme).skipButton}>
                    <Text style={styles(theme).skipText}>{t('skip')}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = (theme: ThemeType) => StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing['2xl'],
    },
    title: {
        ...theme.textStyles.header2,
        color: theme.colors.textDark,
        marginTop: theme.spacing.md,
    },
    subtitle: {
        ...theme.textStyles.body,
        color: theme.colors.textLight,
        textAlign: 'center',
        marginTop: theme.spacing.sm,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.xl,
        ...theme.shadows.md,
        alignItems: 'center',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.surface,
        marginBottom: theme.spacing.sm,
    },
    revieweeName: {
        ...theme.textStyles.header3,
        color: theme.colors.textDark,
    },
    roleLabel: {
        ...theme.textStyles.caption,
        color: theme.colors.textLight,
        textTransform: 'uppercase',
        marginTop: 4,
    },
    question: {
        ...theme.textStyles.header3,
        color: theme.colors.textDark,
        marginBottom: theme.spacing.md,
    },
    footer: {
        marginTop: theme.spacing['2xl'],
    },
    submitButton: {
        marginBottom: theme.spacing.md,
    },
    skipButton: {
        padding: theme.spacing.md,
        alignItems: 'center',
    },
    skipText: {
        ...theme.textStyles.button,
        color: theme.colors.textLight,
    }
});

export default ReviewScreen;
