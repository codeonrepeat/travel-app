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

  // Get userId & email from route params or Supabase auth
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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <Image
                source={{
                  uri: avatarUrl || 'https://picsum.photos/100',
                }}
                style={styles.avatar}
              />
            )}
            <Text style={styles.avatarText}>Tap to upload avatar</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Your username"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe your wardrobe style (e.g., 'Minimal streetwear with vintage accents')"
            value={bio}
            onChangeText={setBio}
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="City, Region"
            value={location}
            onChangeText={setLocation}
          />

          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Saving...' : 'Continue'}
              onPress={handleSubmit}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ddd' },
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
  buttonContainer: { marginTop: 24 },
});
