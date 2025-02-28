import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PassedPostProps {
  title: string;
  date: string;
  time: string;
  price: string;
}

const PassedPost: React.FC<PassedPostProps> = ({ title, date, time, price }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📅</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.dateTime}>{`${date} - ${time}`}</Text>
      </View>
      <Text style={styles.price}>{price}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  icon: {
    fontSize: 18,
    textAlign: 'center',
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    color: '#000',
  },
  dateTime: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  price: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    textAlign: 'right',
  },
});

export default PassedPost; 