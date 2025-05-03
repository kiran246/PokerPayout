import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, View, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import PlayerScreen from '../screens/PlayerScreen';
import SettlementScreen from '../screens/SettlementScreen';
import SessionHistoryScreen from '../screens/SessionHistoryScreen';
import PlayerAnalyticsScreen from '../screens/PlayerAnalyticsScreen';
import SessionShareScreen from '../screens/SessionShareScreen';

// Simple header logo component
const HeaderLogo = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <FontAwesome5 name="coins" size={20} color="white" style={{ marginRight: 8 }} />
    <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Stack Settler</Text>
  </View>
);

// Create the stack navigator
const Stack = createStackNavigator();

// Default screen options
const screenOptions = {
  headerStyle: {
    backgroundColor: '#2C3E50',
    elevation: 0, // Remove shadow on Android
    shadowOpacity: 0, // Remove shadow on iOS
  },
  headerTintColor: '#fff',
  headerTitleAlign: 'center',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  cardStyle: { 
    backgroundColor: '#F0F4F8' 
  },
};

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={screenOptions}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          // Simple title first - you can try the custom component later
          title: 'Poker Settlement',
          // Once basic navigation works, try uncommenting this:
          headerTitle: () => <HeaderLogo />,
        }}
      />
      
      <Stack.Screen 
        name="Players" 
        component={PlayerScreen} 
        options={{ title: 'Manage Players' }}
      />
      
      <Stack.Screen 
        name="Settlement" 
        component={SettlementScreen} 
        options={{ title: 'Settle Up' }}
      />
      
      <Stack.Screen 
        name="History" 
        component={SessionHistoryScreen} 
        options={{ title: 'Session History' }}
      />
      
      <Stack.Screen 
        name="PlayerAnalytics" 
        component={PlayerAnalyticsScreen} 
        options={{ 
          title: 'Player Analytics',
          headerShown: false // We'll use a custom header in the component
        }}
      />
      
      <Stack.Screen 
        name="SessionShare" 
        component={SessionShareScreen} 
        options={{ 
          title: 'Share Session',
          headerShown: false // We'll use a custom header in the component
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;