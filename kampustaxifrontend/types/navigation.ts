export type RootStackParamList = {
  Signup: undefined;
  ValidateEmail: undefined;
  Dashboard: undefined;
  PassengerScreen: undefined;
  PostDetailScreen: { postId: string; userLocation: { latitude: number; longitude: number } | null };
  DriverScreen: undefined;
  TravelsScreen: undefined;
  ProfileScreen: undefined;
  ProfileDetailScreen: undefined;
  ChatScreen: { roomId: string; currentUserId: string; recipientId: string };
  CarDetail: undefined;
  Wallet: undefined;
  LoginScreen: undefined;
  SearchLocationScreen: undefined;
  Drawer: undefined;
  Settings: undefined;
  Home: undefined;
  // Add other screen types here
}; 