'use client';

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';
import { useRouter } from 'expo-router';
const ValidateEmailScreen = () => {
  const [validationCode, setValidationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!validationCode) {
      setError('Please enter validation code');
      return;
    }

    setLoading(true);
    setError('');

    const response = await api.post<{ token: string }>('/api/auth/validate-email', {
      code: validationCode
    });

    if (response.error) {
      setError(response.error);
    } else if (response.data?.token) {
      // Store token
      await AsyncStorage.setItem('token', response.data.token);
      // Navigate to main screen
      // Navigate to Home
      // @ts-ignore
      router.replace('/(drawer)/(tabs)/PassengerScreen');
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text variant="headlineMedium" style={styles.title}>Verify Your Email</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Please enter the 6-digit code sent to your email
        </Text>

        <TextInput
          mode="outlined"
          label="Validation Code"
          value={validationCode}
          onChangeText={setValidationCode}
          keyboardType="number-pad"
          maxLength={6}
          style={styles.input}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Verify
        </Button>
      </View>
    </View>
  );
};

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
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 15,
  },
});

export default ValidateEmailScreen; 