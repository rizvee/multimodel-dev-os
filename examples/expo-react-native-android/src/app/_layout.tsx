import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * Root Application Layout Component
 * Serves as the primary entry point for Expo Router.
 * Resolves network connection states and establishes offline screen boundaries.
 */
export default function RootLayout() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Monitor connection states dynamically across Android devices
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Offline boundary gate: Render fallback UI if connection is lost
  if (!isConnected) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No Internet Connection</Text>
        <Text style={styles.subtext}>Please check your network settings and try again.</Text>
      </View>
    );
  }

  // Guidelines: For Expo Router navigation, replace the below container with:
  //   import { Stack } from 'expo-router';
  //   return <Stack screenOptions={{ headerShown: false }} />;
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeTitle}>MultiModel Dev OS Mobile</Text>
      <Text style={styles.body}>Scaffolded React Native App Layout successfully mounted!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8
  },
  body: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center'
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8
  },
  subtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center'
  }
});
