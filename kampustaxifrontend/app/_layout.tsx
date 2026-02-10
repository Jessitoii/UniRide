import { useFonts } from 'expo-font';
import { useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text, Image, ActivityIndicator, Share } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PassengerScreen from './(tabs)/PassengerScreen';
import DriverScreen from './(tabs)/DriverScreen';
import { BASE_URL } from '@/env';
import MaterialIcons from '@expo/vector-icons/build/MaterialIcons';
import PostScreen from './(tabs)/PostScreen';
import ImagePicker from 'expo-image-picker';
import LoginScreen from './auth/login';
import SignupScreen from './auth/signup';
import ValidateEmailScreen from './auth/validate-email';
import SettingsScreen from './(tabs)/SettingsScreen';
import Wallet from './(tabs)/Wallet';
import TravelsScreen from './(tabs)/TravelsScreen';
import SearchLocation from './(tabs)/SearchLocation';
import { useNavigation, useRoute } from '@react-navigation/native';
import PostDetailScreen from './(tabs)/PostDetailScreen';
import TravelHistoryScreen from './(tabs)/TravelHistory';
import UserProfileScreen from './(tabs)/UserProfileScreen';
import ProfileScreen from './(tabs)/ProfileScreen';
import EditProfileScreen from './(tabs)/EditProfileScreen';
import NotificationsScreen from './(tabs)/NotificationsScreen';
import ChatScreen from './(tabs)/ChatScreen';
import { NotificationProvider, useNotifications } from '../contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import CarDetail from './(tabs)/CarDetail';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const [profile, setProfile] = useState<any>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const navigation = useNavigation<any>(); // Using any to bypass TypeScript errors
  const { unreadCount } = useNotifications();

  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const response = await fetch(`${BASE_URL}/api/users/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const data = await response.json();
          setProfile(data);
          setProfilePhoto(`${BASE_URL}/api/users/profilePhoto/${data.id}`);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        router.push('/auth/login');
      }
    };
    fetchProfile();
  }, []);

  const handleProfilePhotoChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };
  if(!profile || !profilePhoto) {
    return (
      <DrawerContentScrollView {...props}>
        <ActivityIndicator size="large" color="#0000ff" style={{marginTop: '50%'}}/>
        <Text style={{textAlign: 'center', fontSize: 20, fontWeight: 'bold'}}>Yükleniyor...</Text>
      </DrawerContentScrollView>
    );
  }
  
  // Generic navigation handler to avoid TypeScript errors
  const navigateToScreen = (stack: string, screen: string) => {
    navigation.navigate(stack, { screen });
    props.navigation.closeDrawer();
  };
  
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleProfilePhotoChange} style={styles.avatarWrapper}>
          <MaterialIcons name="person" size={80} color="#ccc" />
          <View style={styles.iconOverlay}>
            <MaterialIcons name="edit" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{profile.name}</Text>
        </View>
        <TouchableOpacity style={styles.viewProfileButton} onPress={() => navigateToScreen('DrawerNavigator', 'Profile')}>
          <Text style={styles.viewProfileText}>Profili Görüntüle</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
      <DrawerItemList {...props} />
      <TouchableOpacity style={styles.drawerButton} onPress={() => navigateToScreen('DrawerNavigator', 'Notifications')}>
        <View style={styles.drawerButtonIcon}>
          <MaterialIcons name='notifications' size={24} color='gray'/>
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.drawerButtonText}>Bildirimler</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.drawerButton} onPress={() => {Share.share({url: `${BASE_URL}/profile/${profile.id}`})}}>
        <MaterialIcons name='person-add' size={24} color='gray'/>
        <Text style={styles.drawerButtonText}>Arkadaşları Davet Et</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.drawerButton} onPress={() => navigateToScreen('DrawerNavigator', 'TravelHistory')}>
        <MaterialIcons name='history' size={24} color='gray'/>
        <Text style={styles.drawerButtonText}>Seyehat Geçmişi</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.drawerButton} onPress={() => navigateToScreen('DrawerNavigator', 'Wallet')}>
        <MaterialIcons name='wallet' size={24} color='gray'/>
        <Text style={styles.drawerButtonText}>Ödeme</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.drawerButton} onPress={() => navigateToScreen('DrawerNavigator', 'Driver')}>
        <MaterialIcons name='directions-car' size={24} color='gray'/>
        <Text style={styles.drawerButtonText}>Sürücü</Text>
      </TouchableOpacity>
        <TouchableOpacity style={styles.drawerButton} onPress={() => navigateToScreen('DrawerNavigator', 'Settings')}>
          <MaterialIcons name='settings' size={24} color='gray'/>
        <Text style={styles.drawerButtonText}>Ayarlar</Text>
      </TouchableOpacity>
      <View style={styles.divider} />
      <TouchableOpacity style={styles.contactUsButton} onPress={() => {}}>
        <MaterialIcons name='help-outline' size={24} color='gray'/>
        <Text style={styles.contactUsText}>İletişim</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.drawerButton} onPress={async ()=>{
        await AsyncStorage.removeItem('token');
        navigateToScreen('Auth', 'Login');
      }}>
        <Text>Çıkış Yap</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

function AuthNavigator() {
  return (
    <Drawer.Navigator screenOptions={{headerShown: false, drawerItemStyle: {display: 'none'}}}>
      <Drawer.Screen name="Login" component={LoginScreen}/>
      <Drawer.Screen name="Signup" component={SignupScreen}/>
      <Drawer.Screen name="ValidateEmail" component={ValidateEmailScreen}/>
    </Drawer.Navigator>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator screenOptions={{headerShown: false, drawerItemStyle: {display: 'none'}}}>
      <Drawer.Screen name="Wallet" component={Wallet}/>
      <Drawer.Screen name="Settings" component={SettingsScreen}/>
      <Drawer.Screen name="TravelHistory" component={TravelHistoryScreen}/>
      <Drawer.Screen name="Profile" component={ProfileScreen}/>
      <Drawer.Screen name="EditProfileScreen" component={EditProfileScreen}/>
      <Drawer.Screen name="Notifications" component={NotificationsScreen}/>
      <Drawer.Screen name="Driver" component={DriverScreen}/>
      <Drawer.Screen name="CarDetail" component={CarDetail}/>
    </Drawer.Navigator>
  );
} 

function BottomTabNavigator() {
  const segments = useSegments()
  const route = useRoute();
  const params = route.params as { posts: any[] | null };
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen 
        name="Yolculuklar" 
        component={PassengerScreen} 
        initialParams={params} 
        options={{ 
          tabBarIcon: ({focused}: {focused: boolean}) => <MaterialIcons name="home" size={24} color={focused ? '#4b39ef' : 'gray'} /> 
        }} 
      />
      <Tab.Screen 
        name='Paylaş' 
        component={PostScreen} 
        options={{ 
          tabBarIcon: ({focused}: {focused: boolean}) => <MaterialIcons name="add-circle-outline" size={24} color={focused ? '#4b39ef' : 'gray'} />,
        }} 
      />
      <Tab.Screen 
        name="Seyehatlerim" 
        component={TravelsScreen} 
        options={{ 
          tabBarIcon: ({focused}: {focused: boolean}) => (
            <View>
              <MaterialIcons name="card-travel" size={24} color={focused ? '#4b39ef' : 'gray'} />
              {unreadCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </View>
          )
        }} 
      />
    </Tab.Navigator>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigation = useNavigation<any>(); // Using any to bypass TypeScript errors
  const segments = useSegments();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);        
      } else {
        setIsAuthenticated(false);
        // Using null assertion to bypass TypeScript error
        navigation!.navigate('Auth', {screen: 'Login'});
      }
    };
    checkAuth();
  }, []);

  if (!loaded || isAuthenticated === null) {
    return null;
  }

  return (
    <ThemeProvider>
    <NotificationProvider>
      <PaperProvider>
        <Drawer.Navigator
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={({ navigation }) => ({
            drawerStyle: { width: '80%' },
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            headerShown: true,
            header: () => (
              <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.hamburgerMenu}>
                <MaterialIcons name="menu" size={36} color="#000" />
              </TouchableOpacity>
            ),
          })}
        >  
          <Drawer.Screen 
            name="Home" 
            component={BottomTabNavigator} 
            // Using === true to bypass TypeScript error
            // @ts-ignore - Navigation typing will be fixed in a future update
            options={{headerShown: segments[1] === 'Paylaş' ? false : true}} 
          />
          <Drawer.Screen name="Auth" component={AuthNavigator} options={{headerShown: false, drawerItemStyle: {display: 'none'}}} />
          <Drawer.Screen 
            name="SearchLocationScreen" 
            component={SearchLocation} 
            options={{ 
              headerShown: false,
              drawerLabel: () => null,
              drawerItemStyle: { display: 'none' },
              
            }} 
          />
          <Drawer.Screen name="DrawerNavigator" component={DrawerNavigator} options={{headerShown: false, drawerItemStyle: {display: 'none'}}} />
          <Drawer.Screen 
            name="PostDetailScreen" 
            component={PostDetailScreen} 
            options={{
              headerShown: false,
              drawerItemStyle: {display: 'none'},
            }}
          />
          <Drawer.Screen 
            name="UserProfileScreen" 
            component={UserProfileScreen} 
            options={{
              headerShown: false,
              drawerItemStyle: {display: 'none'},
            }}
          />
          <Drawer.Screen
            name="ChatScreen"
            component={ChatScreen}
            options={{
              headerShown: false,
              drawerItemStyle: {display: 'none'},
            }}
          />
          <Drawer.Screen
            name="LiveTrackingScreen"
            component={require('./(tabs)/LiveTrackingScreen').default}
            options={{
              headerShown: false,
              drawerItemStyle: {display: 'none'},
            }}
          />
        </Drawer.Navigator>
        <StatusBar style="auto" />
      </PaperProvider>
    </NotificationProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    alignItems: 'center',
    padding: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  drawerButton: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerButtonIcon: {
    position: 'relative',
    width: 24,
    height: 24,
  },
  drawerButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  contactUsButton: {
    padding: 16,
    alignItems: 'center',
  },
  contactUsText: {
    fontSize: 16,
    color: '#FF4081',
  },
  hamburgerMenu: {
    position: 'absolute',
    zIndex: 1000,
    marginLeft: 16,
    marginTop: 40,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  hamburgerIcon: {
    fontSize: 36,
  },
  tabIcon: {
    fontSize: 28,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarWrapper: {
    position: 'relative',
    backgroundColor: '#f1f1f1',
    borderRadius: 80,
    padding: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.7,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
  },
  iconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  userInfo: {
    alignItems: 'center',
    marginVertical: 16,
  },
  viewProfileButton: {
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 14,
    color: '#4b39ef',
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
