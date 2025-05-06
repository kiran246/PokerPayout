// Update src/navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import PlayerScreen from '../screens/PlayerScreen';
import SettlementScreen from '../screens/SettlementScreen';
import SessionHistoryScreen from '../screens/SessionHistoryScreen';
import PlayerAnalyticsScreen from '../screens/PlayerAnalyticsScreen';
import SessionShareScreen from '../screens/SessionShareScreen';
import BuyInScreen from '../screens/BuyInScreen';
import GameLedgerScreen from '../screens/GameLedgerScreen';
import GameManagementScreen from '../screens/GameManagementScreen';

// Default screen options
const screenOptions = {
  headerStyle: {
    backgroundColor: '#2C3E50',
    elevation: 0,
    shadowOpacity: 0,
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

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={screenOptions}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Poker Settlement' }}
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
        options={{ headerShown: false }}
      />
      
      <Stack.Screen 
        name="SessionShare" 
        component={SessionShareScreen} 
        options={{ headerShown: false }}
      />
      
      {/* New screens */}
      <Stack.Screen 
        name="BuyInScreen" 
        component={BuyInScreen} 
        options={{ headerShown: false }}
      />
      
      <Stack.Screen 
        name="GameLedgerScreen" 
        component={GameLedgerScreen} 
        options={{ headerShown: false }}
      />
      
      <Stack.Screen 
        name="GameManagementScreen" 
        component={GameManagementScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;