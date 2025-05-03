import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, LogBox } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { MaterialIcons, FontAwesome5, FontAwesome } from '@expo/vector-icons';

// Import store and navigation
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/NavigationService';

// Ignore specific warnings if needed
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'Warning: componentWillReceiveProps has been renamed',
  'Warning: componentWillMount has been renamed',
]);

// Loading screen component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.logoContainer}>
      <FontAwesome5 name="coins" size={60} color="#3498DB" />
      <Text style={styles.appTitle}>Poker Settlement</Text>
      <Text style={styles.appSubtitle}>Settle poker debts with ease</Text>
    </View>
    <ActivityIndicator size="large" color="#3498DB" style={styles.loader} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Load necessary assets
  useEffect(() => {
    async function loadAssets() {
      try {
        // Load fonts
        await Font.loadAsync({
          ...MaterialIcons.font,
          ...FontAwesome5.font,
          ...FontAwesome.font
        });
        
        // Simulate minimal loading time to avoid flicker
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsReady(true);
      } catch (e) {
        setError(e);
        console.error('Error loading assets:', e);
      }
    }
    
    loadAssets();
  }, []);

  // Show error screen if something went wrong
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
      </View>
    );
  }

  // Show loading screen while fonts and assets are loading
  if (!isReady) {
    return <LoadingScreen />;
  }

  // Main app with Redux, Navigation, and other providers
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <SafeAreaProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 15,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 5,
  },
  loader: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
  }
});