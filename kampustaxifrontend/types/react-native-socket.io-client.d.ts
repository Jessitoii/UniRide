declare module 'react-native-socket.io-client' {
  import { Socket } from 'socket.io-client';

  export default function io(uri: string, opts?: any): Socket;
} 