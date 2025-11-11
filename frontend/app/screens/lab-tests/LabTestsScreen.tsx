import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { labTestAPI } from '../../services/api';
import { LabTest } from '../../types';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function LabTestsScreen() {
  const [loading, setLoading] = useState(true);
  const [labTests, setLabTests] = useState<LabTest[]>([]);

  useEffect(() => {
    loadLabTests();
  }, []);

  const loadLabTests = async () => {
    try {
      setLoading(true);
      const data = await labTestAPI.getAll();
      setLabTests(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#FFC107';
      case 'completed':
        return '#28A745';
      case 'cancelled':
        return '#6C757D';
      default:
        return Colors.textLight;
    }
  };

  const getTestTypeIcon = (testType: string) => {
    switch (testType) {
      case 'blood_test':
        return 'water';
      case 'urine_test':
        return 'beaker';
      case 'xray':
        return 'scan';
      case 'mri':
        return 'scan-circle';
      default:
        return 'flask';
    }
  };

  const handleDeleteTest = async (testId: string) => {
    Alert.alert('Delete Lab Test', 'Are you sure you want to delete this test?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await labTestAPI.delete(testId);
            Alert.alert('Success', 'Lab test deleted successfully');
            loadLabTests();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Header title="My Lab Tests" onBack={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {labTests.length > 0 ? (
          labTests.map((test) => (
            <View key={test.id} style={styles.testCard}>
              <View style={styles.testHeader}>
                <View style={styles.testHeaderLeft}>
                  <View style={[styles.testIcon, { backgroundColor: Colors.primary + '20' }]}>
                    <Ionicons name={getTestTypeIcon(test.test_type) as any} size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.testHeaderInfo}>
                    <Text style={styles.testName}>{test.test_name}</Text>
                    <Text style={styles.labName}>{test.lab_name}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(test.status) }]}>
                  <Text style={styles.statusText}>{test.status.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.description} numberOfLines={2}>
                {test.description}
              </Text>

              <View style={styles.testDetails}>
                <View style={styles.testDetailRow}>
                  <Ionicons name="calendar" size={16} color={Colors.textLight} />
                  <Text style={styles.testDetailText}>
                    {new Date(test.scheduled_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.testDetailRow}>
                  <Ionicons name="cash" size={16} color={Colors.textLight} />
                  <Text style={styles.testDetailText}>₹{test.price}</Text>
                </View>
              </View>

              {test.results_url && (
                <TouchableOpacity style={styles.resultsButton}>
                  <Ionicons name="document-text" size={16} color={Colors.primary} />
                  <Text style={styles.resultsButtonText}>View Results</Text>
                </TouchableOpacity>
              )}

              {test.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{test.notes}</Text>
                </View>
              )}

              <View style={styles.testActions}>
                {test.status === 'scheduled' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleDeleteTest(test.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="flask-outline" size={80} color={Colors.textLight} />
            <Text style={styles.emptyText}>No lab tests scheduled</Text>
            <Text style={styles.emptySubtext}>Book a lab test from home screen</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  testCard: {
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  testHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  testHeaderInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  labName: {
    fontSize: 14,
    color: Colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.background,
  },
  description: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
    lineHeight: 20,
  },
  testDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  testDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testDetailText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 6,
  },
  resultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultsButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  notesContainer: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  testActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: Colors.error + '10',
  },
  cancelButtonText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textLight,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
