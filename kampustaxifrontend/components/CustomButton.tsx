import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CustomButton = ({ onPress, title }: { onPress: () => void, title: string }) => (
    <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default CustomButton; 