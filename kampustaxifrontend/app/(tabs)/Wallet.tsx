import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../env';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
const Wallet = () => {
  const [depositBalance, setDepositBalance] = useState(0);
  const [earningsBalance, setEarningsBalance] = useState(0);
  const navigation = useNavigation();
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/api/wallet`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const wallet = await response.json();
          setDepositBalance(wallet.depositBalance);
          setEarningsBalance(wallet.earningsBalance);
        } else {
          console.error('Error fetching wallet:', await response.json());
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
      }
    };

    fetchWallet();
  }, []);

  const handleDeposit = async () => {
    // Implement deposit logic with Iyzico
    Alert.alert('Deposit', 'Deposit functionality is not yet implemented.');
  };

  const handleWithdraw = async () => {
    // Implement withdraw logic
    Alert.alert('Withdraw', 'Withdraw functionality is not yet implemented.');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
      </View>

      {/* Lyft Cash Card */}
      <View style={styles.cashCard}>
        <Text style={styles.cashTitle}>Kampüs Taxi Cüzdanı</Text>
        <Text style={styles.cashAmount}>${depositBalance.toFixed(2)}</Text>
        <Text style={styles.cashSubtitle}>Önce planla, daha kolay bütçele</Text>
        
        <TouchableOpacity style={styles.addCashButton} onPress={handleDeposit}>
          <View style={styles.addIconContainer}>
            <MaterialIcons name="add" size={22} color="#fff" />
          </View>
          <Text style={styles.addCashText}>Para Yükle</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Methods */}
      <Text style={styles.sectionTitle}>Ödeme Yöntemleri</Text>
      
      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.cardIconContainer}>
          <Text style={styles.cardIconText}>VISA</Text>
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuItemTitle}>Visa 5771</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIconContainer}>
          <MaterialIcons name="add" size={24} color="#000" />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuItemTitle}>Ödeme Yöntemi Ekle</Text>
        </View>
      </TouchableOpacity>

      {/* KampusTaxi Pass */}
      <Text style={styles.sectionTitle}>KampusTaxi Pass</Text>
      
      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIconContainer}>
          <MaterialIcons name="add" size={24} color="#000" />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuItemTitle}>KampusTaxi Pass Ekle</Text>
        </View>
      </TouchableOpacity>

      {/* Payment History */}
      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIconContainer}>
          <MaterialIcons name="receipt" size={24} color="#000" />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuItemTitle}>Ödeme Geçmişi</Text>
        </View>
      </TouchableOpacity>

      {/* Withdraw Button */}
      <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
        <Text style={styles.withdrawButtonText}>Para Çek</Text>
      </TouchableOpacity>
    </ScrollView>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    color: '#000',
  },
  cashCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f3f3f8',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cashTitle: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  cashAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  cashSubtitle: {
    fontSize: 14,
    color: '#444',
    marginBottom: 20,
  },
  addCashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  addIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4b39ef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addCashText: {
    fontSize: 16,
    color: '#4b39ef',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f4',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 15,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  cardIconText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  withdrawButton: {
    marginVertical: 20,
    marginHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#4b39ef',
    borderRadius: 10,
    alignItems: 'center',
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default Wallet; 