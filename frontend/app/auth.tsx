import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from './constants/Colors';

export default function AuthScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.authContainer}>
        <View style={styles.authHeader}>
          <Ionicons name="medical" size={60} color={Colors.primary} />
          <Text style={styles.authTitle}>Welcome to MediMart</Text>
          <Text style={styles.authSubtitle}>Your trusted pharmacy partner</Text>
        </View>

        <View style={styles.authButtons}>
          <TouchableOpacity
            style={[styles.authButton, styles.primaryButton]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authButton, styles.secondaryButton]}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.secondaryButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  authContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
  },
  authSubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 8,
  },
  authButtons: {
    gap: 16,
  },
  authButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
