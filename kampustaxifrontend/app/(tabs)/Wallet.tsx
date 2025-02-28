import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../env';

const Wallet = () => {
  const [depositBalance, setDepositBalance] = useState(0);
  const [earningsBalance, setEarningsBalance] = useState(0);

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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Cüzdan Detayları</Text>
      </View>
      <View style={styles.balanceSection}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceTitle}>Toplam Bakiye</Text>
          <Text style={styles.balanceDate}>Son Güncellenme Tarihi: XX/XX/XXXX</Text>
        </View>
        <View style={styles.balanceDetails}>
          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>Yatırılan Bakiye</Text>
            <Text style={styles.balanceAmount}>${depositBalance}</Text>
          </View>
          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>Kazanılmış Bakiye</Text>
            <Text style={styles.balanceAmount}>${earningsBalance}</Text>
          </View>
        </View>
      </View>
      <View style={styles.transactionsSection}>
        <Text style={styles.transactionsTitle}>Geçmiş İşlemler</Text>
        <View style={styles.transactionItem}>
          <View style={styles.transactionIcon}>
            <Text style={styles.transactionEmoji}>💰</Text>
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionLabel}>Kazançlar</Text>
            <Text style={styles.transactionDate}>05/25/2021 - $200</Text>
          </View>
        </View>
        <View style={styles.transactionItem}>
          <View style={styles.transactionIcon}>
            <Text style={styles.transactionEmoji}>💸</Text>
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionLabel}>Ödeme Alındı</Text>
            <Text style={styles.transactionDate}>05/20/2021 - $100</Text>
          </View>
        </View>
      </View>
      <View style={styles.moneyTransactionsSection}>
        <Text style={styles.moneyTransactionsTitle}>Money Transactions</Text>
        <TouchableOpacity style={styles.transactionButton} onPress={handleDeposit}>
          <Text style={styles.transactionButtonText}>Add Funds</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.transactionButton}>
          <Text style={styles.transactionButtonText}>Manage Payment Methods</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
          <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    height: 72,
    backgroundColor: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: 'black',
    fontSize: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '500',
    color: 'black',
  },
  balanceSection: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'black',
  },
  balanceDate: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  balanceBox: {
    width: '45%',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '500',
    color: 'black',
  },
  transactionsSection: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'black',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionLabel: {
    fontSize: 14,
    color: 'black',
  },
  transactionDate: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  moneyTransactionsSection: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  moneyTransactionsTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'black',
  },
  transactionButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  transactionButtonText: {
    color: 'black',
    fontSize: 16,
  },
  withdrawButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: 'black',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  withdrawButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default Wallet; 