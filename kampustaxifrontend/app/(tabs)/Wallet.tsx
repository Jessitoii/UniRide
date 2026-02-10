// Make sure to install expo-clipboard: expo install expo-clipboard
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../env';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

const Wallet = () => {
  const [iban, setIban] = useState('');
  const [ibanLoading, setIbanLoading] = useState(true);
  const [ibanSaving, setIbanSaving] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchIban = async () => {
      try {
        setIbanLoading(true);
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/api/wallet/iban`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setIban(data.iban || '');
        } else {
          setIban('');
        }
      } catch (error) {
        setIban('');
      } finally {
        setIbanLoading(false);
      }
    };
    fetchIban();
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/api/wallet/summary`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setSummary(data);
        } else {
          setSummary(null);
        }
      } catch (error) {
        setSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const handleSaveIban = async () => {
    if (!iban.trim()) {
      Alert.alert('Hata', 'Lütfen geçerli bir IBAN girin.');
      return;
    }
    setIbanSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/wallet/iban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ iban: iban.trim() }),
      });
      if (response.ok) {
        Alert.alert('Başarılı', 'IBAN başarıyla kaydedildi.');
      } else {
        Alert.alert('Hata', 'IBAN kaydedilemedi.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir hata oluştu.');
    } finally {
      setIbanSaving(false);
    }
  };

  const handlePasteIban = async () => {
    const clipboardContent = await Clipboard.getStringAsync();
    setIban(clipboardContent);
  };

  const renderRide = ({ item }: { item: any }) => (
    <View style={styles.rideItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rideRole}>{item.role === 'driver' ? 'Sürücü' : 'Yolcu'}</Text>
        <Text style={styles.rideDest}>{item.destinationUniversity} {item.destinationFaculty ? `- ${item.destinationFaculty}` : ''}</Text>
        <Text style={styles.rideDate}>{new Date(item.datetimeStart).toLocaleString('tr-TR')}</Text>
      </View>
      <Text style={styles.rideFare}>{item.fare?.toFixed(2)} ₺</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cüzdan Bilgileri</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Toplam Kazanç (Sürücü)</Text>
        {summaryLoading ? (
          <ActivityIndicator size="small" color="#4b39ef" />
        ) : (
          <Text style={styles.earningsAmount}>{summary?.totalEarned?.toFixed(2) || '0.00'} ₺</Text>
        )}
        <Text style={styles.sectionTitle}>Toplam Harcama (Yolcu)</Text>
        {summaryLoading ? (
          <ActivityIndicator size="small" color="#4b39ef" />
        ) : (
          <Text style={styles.earningsAmount}>{summary?.totalSpent?.toFixed(2) || '0.00'} ₺</Text>
        )}
        <Text style={styles.sectionTitle}>IBAN</Text>
        <Text style={styles.infoText}>
          IBAN'ınızı kaydedin. Yolculuk tamamlandığında IBAN'ınız yolcuya gösterilecek ve ödemeyi size manuel olarak yapacak.
        </Text>
        <View style={styles.ibanInputRow}>
          <TextInput
            style={styles.ibanInput}
            value={iban}
            onChangeText={setIban}
            placeholder="TR__________________________"
            autoCapitalize="characters"
            editable={!ibanLoading && !ibanSaving}
            maxLength={26}
          />
          {ibanLoading && <ActivityIndicator size="small" color="#4b39ef" style={{ marginLeft: 8 }} />}
        </View>
        <TouchableOpacity style={styles.pasteButton} onPress={handlePasteIban}>
          <MaterialIcons name="content-paste" size={20} color="#4b39ef" />
          <Text style={styles.pasteButtonText}>Yapıştır</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveIban} disabled={ibanSaving || ibanLoading}>
          {ibanSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Kaydet</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Yolculuklarım</Text>
        {summaryLoading ? (
          <ActivityIndicator size="small" color="#4b39ef" />
        ) : (
          <FlatList
            data={summary?.rides || []}
            renderItem={renderRide}
            keyExtractor={(item, idx) => item.id + '-' + item.role + '-' + idx}
            ListEmptyComponent={<Text style={styles.emptyText}>Henüz yolculuk bulunmuyor.</Text>}
            style={{ marginTop: 8 }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f4',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#4b39ef',
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  ibanInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ibanInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fafaff',
    letterSpacing: 2,
    color: '#222',
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pasteButtonText: {
    color: '#4b39ef',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#4b39ef',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f4',
  },
  rideRole: {
    fontSize: 13,
    color: '#4b39ef',
    fontWeight: 'bold',
  },
  rideDest: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
  rideDate: {
    fontSize: 12,
    color: '#888',
  },
  rideFare: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default Wallet; 