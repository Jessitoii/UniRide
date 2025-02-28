'use client';

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, ScrollView } from 'react-native';

export default function SettingsScreen() {
  const [email, setEmail] = useState('032211507@ogr.uludag.edu.tr');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('02/02/2025');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [appAlerts, setAppAlerts] = useState(false);
  const [locationFeatures, setLocationFeatures] = useState(false);
  const [locationAccess, setLocationAccess] = useState(false);

  const handleSave = () => {
    // Implement save functionality
    console.log('Settings saved');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Ayarlar</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>E-posta</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="E-posta"
        />
        <Text style={styles.helperText}>edu.tr olmalı falan filan</Text>
        <Text style={styles.label}>Şifre</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Şifre"
          secureTextEntry
        />
        <Text style={styles.helperText}>Şifreniz falan filan olsun</Text>
        <Text style={styles.label}>Doğum Tarihi</Text>
        <TextInput
          style={styles.input}
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="Doğum Tarihi"
        />
      </View>
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Kaydet</Text>
      </TouchableOpacity>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bildirim Ayarları</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Enable Email Notifications</Text>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Enable Push Notifications</Text>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Enable App Alerts</Text>
          <Switch
            value={appAlerts}
            onValueChange={setAppAlerts}
          />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Konum Ayarları</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Location-Based Features</Text>
          <Switch
            value={locationFeatures}
            onValueChange={setLocationFeatures}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Location</Text>
          <Switch
            value={locationAccess}
            onValueChange={setLocationAccess}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 72,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginTop: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  helperText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
    marginBottom: 16,
  },
  saveButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 10,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: '#000',
  },
}); 