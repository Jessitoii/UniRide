
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/env'; // Adjust if env.ts is in root

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    onlineUsers: string[];
    connect: () => void;
    disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    const connect = async () => {
        try {
            if (socket?.connected) return;

            const token = await AsyncStorage.getItem('token');

            const newSocket = io(BASE_URL, {
                transports: ['websocket'],
                auth: { token: token },
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                randomizationFactor: 0.5,
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });

            newSocket.on('connect_error', (err) => {
                console.log('Socket connect error:', err);
            });

            newSocket.on('online_users', (users: string[]) => {
                setOnlineUsers(users);
            });

            newSocket.on('user_status_change', ({ userId, status }: { userId: string, status: string }) => {
                setOnlineUsers(prev => {
                    if (status === 'online') {
                        return prev.includes(userId) ? prev : [...prev, userId];
                    } else {
                        return prev.filter(id => id !== userId);
                    }
                });
            });

            setSocket(newSocket);
        } catch (error) {
            console.error('Socket initialization failed:', error);
        }
    };

    const disconnect = () => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
    };

    useEffect(() => {
        connect();
        return () => {
            disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, connect, disconnect, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
