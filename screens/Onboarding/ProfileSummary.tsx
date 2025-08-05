import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { supabase } from 'utils/supabase';

export default function ProfileSummary({ navigation, route }) {
  const { profileData } = route.params;
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);

    try {
      const updates = {
        id: profileData.userId, // ensure this is included in profileData on previous steps
        email: profileData.email,
        username: profileData.username,
        avatar_url: profileData.avatar_url,
        style_tags: profileData.style_tags,
        location: profileData.location,
        top_size: profileData.top_size,
        bottom_size: profileData.bottom_size,
        shoe_size: profileData.shoe_size,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates, {
        returning: 'minimal',
      });

      if (error) throw error;

      navigation.reset({
        index: 0,
        routes: [{ name: 'RoleSelect' }],
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Almost done!</Text>
        <Text style={styles.subtitle}>Review your profile information before continuing.</Text>

        <View style={styles.summaryItem}>
          <Text style={styles.label}>Username:</Text>
          <Text style={styles.value}>{profileData.username}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{profileData.location}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.label}>Style Tags:</Text>
          <Text style={styles.value}>{profileData.style_tags.join(', ')}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.label}>Sizes:</Text>
          <Text style={styles.value}>
            Top: {profileData.top_size}, Bottom: {profileData.bottom_size}, Shoe:{' '}
            {profileData.shoe_size}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save and Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
  },
  summaryItem: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    color: '#444',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#111',
  },
  button: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
