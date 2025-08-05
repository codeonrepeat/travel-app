import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';

export default function Step3Location({ navigation, route }) {
  const { profileData } = route.params;
  const [location, setLocation] = useState(profileData.location || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (location) return; // Skip if already have location from previous step

      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission denied',
          'Location permission is required to auto-detect your city.'
        );
        setLoading(false);
        return;
      }

      try {
        const coords = await Location.getCurrentPositionAsync({});
        const places = await Location.reverseGeocodeAsync({
          latitude: coords.coords.latitude,
          longitude: coords.coords.longitude,
        });

        if (places.length > 0 && (places[0].city || places[0].locality)) {
          setLocation(places[0].city || places[0].locality);
        } else {
          Alert.alert('Location not found', 'Could not detect your city automatically.');
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to detect location.');
      }
      setLoading(false);
    })();
  }, []);

  const handleNext = async () => {
    const trimmedLocation = location.trim();
    if (!trimmedLocation) {
      Alert.alert('Please enter your location to continue.');
      return;
    }

    try {
      const geocoded = await Location.geocodeAsync(trimmedLocation);
      console.log('Geocode results:', geocoded);

      if (geocoded.length === 0 || geocoded[0].latitude == null || geocoded[0].longitude == null) {
        Alert.alert('Invalid city', 'Please enter a valid city name.');
        return;
      }

      navigation.navigate('Step4Sizing', {
        profileData: { ...profileData, location: trimmedLocation },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to validate city name.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <Text style={styles.title}>Step 3: Your Location</Text>
        <Text style={styles.subtitle}>We'll try to detect your city automatically</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#22c55e" style={{ marginVertical: 20 }} />
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Enter city or location"
            value={location}
            onChangeText={setLocation}
            autoCapitalize="words"
          />
        )}

        <TouchableOpacity
          style={[styles.button, !location.trim() && { opacity: 0.5 }]}
          disabled={!location.trim()}
          onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
