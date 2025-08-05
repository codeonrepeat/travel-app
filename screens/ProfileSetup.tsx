import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';

import { supabase } from 'utils/supabase';
import { Buffer } from 'buffer';
import { useNavigation } from '@react-navigation/native';

export default function ProfileSetup({ route }) {
  const navigation = useNavigation();

  const [avatarUrl, setAvatarUrl] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Get user info
  useEffect(() => {
    const getUserId = async () => {
      if (route?.params?.userId && route?.params?.email) {
        setUserId(route.params.userId);
        setEmail(route.params.email);
        return;
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        Alert.alert('Error', 'Unable to get user ID.');
        return;
      }

      setUserId(user.id);
      setEmail(user.email);
    };

    getUserId();
  }, []);

  // useEffect(() => {
  //   const getUserId = async () => {
  //     if (route?.params?.userId && route?.params?.email) {
  //       setUserId(route.params.userId);
  //       setEmail(route.params.email);
  //     } else {
  //       const {
  //         data: { user },
  //         error,
  //       } = await supabase.auth.getUser();
  //       if (error || !user) {
  //         Alert.alert('Error', 'Unable to get user ID.');
  //         return;
  //       }

  //       setUserId(user.id);
  //       setEmail(user.email);
  //     }

  //     // 👇 Add location detection here
  //     detectLocation();
  //   };

  //   const detectLocation = async () => {
  //     try {
  //       const { status } = await Location.requestForegroundPermissionsAsync();
  //       if (status !== 'granted') return;

  //       const coords = await Location.getCurrentPositionAsync({});
  //       const [place] = await Location.reverseGeocodeAsync({
  //         latitude: coords.coords.latitude,
  //         longitude: coords.coords.longitude,
  //       });

  //       if (place?.city) {
  //         setLocation(place.city);
  //       }
  //     } catch (e) {
  //       console.warn('Could not auto-detect location:', e.message);
  //     }
  //   };

  //   getUserId();
  // }, []);

  const pickAvatar = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID is not set yet.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to media library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      try {
        setLoading(true);
        const file = result.assets[0];
        const ext = file.uri.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${ext}`;

        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const buffer = Buffer.from(base64, 'base64');

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(fileName);
        setAvatarUrl(publicUrl.publicUrl);
      } catch (e) {
        console.error('Upload failed:', e.message);
        Alert.alert('Upload failed', e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!username || !bio || !location || !avatarUrl) {
      Alert.alert('Missing info', 'Please fill in all fields before continuing.');
      return;
    }
    if (!userId || !email) {
      Alert.alert('Error', 'User data is not loaded yet.');
      return;
    }

    try {
      setLoading(true);

      const updates = {
        id: userId,
        email,
        username,
        avatar_url: avatarUrl,
        bio,
        location,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates, {
        returning: 'minimal',
      });

      if (error) throw error;

      navigation.navigate('RoleSelect');
    } catch (e) {
      console.error('Profile update failed:', e.message);
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const formComplete = username && bio && location && avatarUrl;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.welcome}>Welcome!</Text>
          <Text style={styles.instructions}>
            Let’s set up your profile so others can get to know you. Add a photo, describe your
            go-to look or favorite styles, and share your location.
          </Text>

          <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer}>
            {loading && !avatarUrl ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <Image
                source={{ uri: avatarUrl || 'https://picsum.photos/100' }}
                style={styles.avatar}
              />
            )}
            <Text style={styles.avatarText}>
              {avatarUrl ? 'Tap to change your photo' : 'Tap to upload your avatar'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. stylishsam"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Go to look / Favorite styles</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. I love bold colors and clean cuts."
            value={bio}
            onChangeText={setBio}
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Toronto"
            value={location}
            onChangeText={setLocation}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.button, { backgroundColor: formComplete ? '#000' : '#ccc' }]}
            disabled={!formComplete || loading}>
            <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Continue'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24 },
  welcome: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#444',
    marginBottom: 24,
    textAlign: 'center',
  },
  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee' },
  avatarText: { color: '#555', marginTop: 8 },
  label: { fontSize: 14, marginTop: 16, color: '#444' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    fontSize: 16,
  },
  button: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
