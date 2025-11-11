import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from './constants/Colors';

export default function SplashScreen() {
  useEffect(() => {
    setTimeout(() => {
      router.replace('/auth');
    }, 2000);
  }, []);

  return (
    <View style={styles.splashContainer}>
      <StatusBar style="light" />
      <View style={styles.splashContent}>
        <View style={styles.logoContainer}>
          <Ionicons name="medical" size={80} color={Colors.background} />
          <Text style={styles.logoText}>MediMart</Text>
          <Text style={styles.logoSubtext}>Your Medical Marketplace</Text>
        </View>
      </View>
      <ActivityIndicator size="large" color={Colors.background} style={styles.splashLoader} />
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.background,
    marginTop: 16,
  },
  logoSubtext: {
    fontSize: 16,
    color: Colors.background,
    opacity: 0.8,
    marginTop: 8,
  },
  splashLoader: {
    marginBottom: 50,
  },
});
