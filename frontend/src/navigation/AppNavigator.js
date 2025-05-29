import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {useAuth} from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import DiscoveryScreen from '../screens/DiscoveryScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;
          if (route.name === 'Discovery') {
            iconName = 'explore';
          } else if (route.name === 'Chats') {
            iconName = 'chat';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}>
      <Tab.Screen
        name="Discovery"
        component={DiscoveryScreen}
        options={{title: 'Descobrir'}}
      />
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{title: 'Conversas'}}
      />
    </Tab.Navigator>
  );
};

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
          title: 'Conversa',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default function AppNavigator() {
  const {isAuthenticated, isProfileComplete, loading} = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : !isProfileComplete ? (
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        </Stack.Navigator>
      ) : (
        <MainStack />
      )}
    </NavigationContainer>
  );
}
