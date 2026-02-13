// TravelHistory.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PassedPost from '@/components/PassedPost';

const TravelHistoryScreen = () => {
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [matchedPosts, setMatchedPosts] = useState<any[]>([]);
    const router = useRouter();

    const now = new Date();

    useEffect(() => {
        const fetchProfile = async () => {
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
                    setProfile(data);
                    setMatchedPosts(data.matchedPosts);
                } else {
                    console.error('Error fetching profile:', await response.json());
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        fetchProfile();
    }, []);

    const extractDistrict = (address: string | undefined) => {
        if (!address) {
            console.warn('Address is undefined');
            return '';
        }
        const parts = address.split(',');
        return parts.length > 1 ? parts[1].trim() : address;
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Geçmiş Seyehatlerim</Text>
            </View>
            {
                matchedPosts
                    .filter((post: any) => new Date(post.datetimeStart) < now)
                    .map((post: any) => (
                        <View key={post.id}>
                            <PassedPost
                                key={post.id}
                                from={extractDistrict(post.sourceAddress)}
                                to={post.destinationFaculty}
                                date={new Date(post.datetimeStart).toLocaleDateString()}
                                time={new Date(post.datetimeStart).toLocaleTimeString()}

                            />
                        </View>
                    ))
            }
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        marginTop: StatusBar.currentHeight,
        flexDirection: 'row',
        height: 82,
        justifyContent: 'flex-start',
        paddingLeft: 16,
        backgroundColor: 'white',
    },
    headerText: {
        fontSize: 20,
        fontWeight: '500',
        color: 'black',
    },
});

export default TravelHistoryScreen;