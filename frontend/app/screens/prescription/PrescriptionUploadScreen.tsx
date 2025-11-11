import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { prescriptionAPI } from '../../services/api';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';

export default function PrescriptionUploadScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select or capture an image');
      return;
    }

    setUploading(true);
    try {
      // In a real app, you would upload the image to a server first
      // and get a URL. For now, we'll use the local URI
      await prescriptionAPI.upload(imageUri, undefined, notes);
      Alert.alert('Success', 'Prescription uploaded successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Header title="Upload Prescription" onBack={() => router.back()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <View style={styles.instructionsText}>
            <Text style={styles.instructionsTitle}>Upload Guidelines</Text>
            <Text style={styles.instructionsDescription}>
              • Ensure prescription is clear and legible{'\n'}
              • All doctor details should be visible{'\n'}
              • Medicine names should be readable
            </Text>
          </View>
        </View>

        {/* Image Preview */}
        {imageUri ? (
          <View style={styles.imagePreview}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
              <Ionicons name="close-circle" size={32} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadOptions}>
            <TouchableOpacity style={styles.uploadOption} onPress={takePhoto}>
              <Ionicons name="camera" size={48} color={Colors.primary} />
              <Text style={styles.uploadOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadOption} onPress={pickImageFromGallery}>
              <Ionicons name="images" size={48} color={Colors.primary} />
              <Text style={styles.uploadOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any additional information..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Upload Button */}
        {imageUri && (
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.disabledButton]}
            onPress={handleUpload}
            disabled={uploading}
          >
            <Text style={styles.uploadButtonText}>{uploading ? 'Uploading...' : 'Upload Prescription'}</Text>
          </TouchableOpacity>
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
    padding: 16,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructionsText: {
    flex: 1,
    marginLeft: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  instructionsDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.background,
    borderRadius: 16,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  uploadOption: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  uploadOptionText: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  notesSection: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    color: Colors.text,
    minHeight: 100,
  },
  uploadButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
