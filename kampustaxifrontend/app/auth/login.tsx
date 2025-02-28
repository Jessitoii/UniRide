'use client';

import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';

export default function LoginScreen() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if the user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // If authenticated, redirect to profile
        router.replace('/profile');
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (!formData.email.endsWith('.edu.tr')) {
      setError('Please use a valid .edu.tr email address');
      return;
    }

    setLoading(true);
    setError('');

    const response = await api.post<{ token: string }>('/api/auth/login', formData);

    if (response.error) {
      setError(response.error);
    } else if (response.data?.token) {
      // Store token
      await AsyncStorage.setItem('token', response.data.token);
      // Navigate to main app
      router.replace('/profile');
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text variant="headlineMedium" style={styles.title}>Giriş Yap</Text>
        
        <TextInput
          mode="outlined"
          label="Email (edu.tr)"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        
        <TextInput
          mode="outlined"
          label="Şifre"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
          style={styles.input}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Giriş Yap
        </Button>
        
        <Button
          mode="text"
          onPress={() => router.push('/auth/signup')}
          style={styles.linkButton}
        >
          Hesabın yok mu? Üye Ol
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  linkButton: {
    marginTop: 10,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 15,
  },
}); 