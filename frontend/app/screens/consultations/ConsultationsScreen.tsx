import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { consultationAPI } from '../../services/api';
import { Consultation } from '../../types';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function ConsultationsScreen() {
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const data = await consultationAPI.getAll();
      setConsultations(data);
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

  const getConsultationTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return 'videocam';
      case 'audio':
        return 'call';
      case 'chat':
        return 'chatbubbles';
      case 'in_person':
        return 'person';
      default:
        return 'medical';
    }
  };

  const handleDeleteConsultation = async (consultationId: string) => {
    Alert.alert('Cancel Consultation', 'Are you sure you want to cancel this consultation?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await consultationAPI.delete(consultationId);
            Alert.alert('Success', 'Consultation cancelled successfully');
            loadConsultations();
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
      <Header title="My Consultations" onBack={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {consultations.length > 0 ? (
          consultations.map((consultation) => (
            <View key={consultation.id} style={styles.consultationCard}>
              <View style={styles.consultationHeader}>
                <View style={styles.consultationHeaderLeft}>
                  <View style={[styles.doctorIcon, { backgroundColor: Colors.primary + '20' }]}>
                    <Ionicons name="person" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.consultationHeaderInfo}>
                    <Text style={styles.doctorName}>Dr. {consultation.doctor_name}</Text>
                    <Text style={styles.specialization}>{consultation.specialization}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(consultation.status) }]}>
                  <Text style={styles.statusText}>{consultation.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.consultationType}>
                <Ionicons
                  name={getConsultationTypeIcon(consultation.consultation_type) as any}
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.consultationTypeText}>
                  {consultation.consultation_type.replace('_', ' ').toUpperCase()}
                </Text>
              </View>

              <View style={styles.consultationDetails}>
                <View style={styles.consultationDetailRow}>
                  <Ionicons name="calendar" size={16} color={Colors.textLight} />
                  <Text style={styles.consultationDetailText}>
                    {new Date(consultation.scheduled_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.consultationDetailRow}>
                  <Ionicons name="time" size={16} color={Colors.textLight} />
                  <Text style={styles.consultationDetailText}>
                    {new Date(consultation.scheduled_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.consultationDetails}>
                <View style={styles.consultationDetailRow}>
                  <Ionicons name="hourglass" size={16} color={Colors.textLight} />
                  <Text style={styles.consultationDetailText}>{consultation.duration_minutes} mins</Text>
                </View>
                <View style={styles.consultationDetailRow}>
                  <Ionicons name="cash" size={16} color={Colors.textLight} />
                  <Text style={styles.consultationDetailText}>₹{consultation.price}</Text>
                </View>
              </View>

              {consultation.symptoms && (
                <View style={styles.symptomsContainer}>
                  <Text style={styles.symptomsLabel}>Symptoms:</Text>
                  <Text style={styles.symptomsText}>{consultation.symptoms}</Text>
                </View>
              )}

              {consultation.diagnosis && (
                <View style={styles.diagnosisContainer}>
                  <Text style={styles.diagnosisLabel}>Diagnosis:</Text>
                  <Text style={styles.diagnosisText}>{consultation.diagnosis}</Text>
                </View>
              )}

              {consultation.prescription_url && (
                <TouchableOpacity style={styles.prescriptionButton}>
                  <Ionicons name="document-text" size={16} color={Colors.primary} />
                  <Text style={styles.prescriptionButtonText}>View Prescription</Text>
                </TouchableOpacity>
              )}

              {consultation.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{consultation.notes}</Text>
                </View>
              )}

              <View style={styles.consultationActions}>
                {consultation.status === 'scheduled' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.joinButton]}
                    onPress={() => Alert.alert('Join', 'Joining consultation...')}
                  >
                    <Ionicons
                      name={getConsultationTypeIcon(consultation.consultation_type) as any}
                      size={16}
                      color={Colors.background}
                    />
                    <Text style={styles.joinButtonText}>Join Now</Text>
                  </TouchableOpacity>
                )}
                {consultation.status === 'scheduled' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleDeleteConsultation(consultation.id)}
                  >
                    <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={80} color={Colors.textLight} />
            <Text style={styles.emptyText}>No consultations scheduled</Text>
            <Text style={styles.emptySubtext}>Book a consultation from home screen</Text>
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
  consultationCard: {
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
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  consultationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  consultationHeaderInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  specialization: {
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
  consultationType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  consultationTypeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  consultationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  consultationDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consultationDetailText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 6,
  },
  symptomsContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  symptomsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 4,
  },
  symptomsText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  diagnosisContainer: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  diagnosisLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  diagnosisText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  prescriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  prescriptionButtonText: {
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
  consultationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  joinButton: {
    backgroundColor: Colors.primary,
  },
  joinButtonText: {
    fontSize: 14,
    color: Colors.background,
    fontWeight: '600',
    marginLeft: 6,
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
