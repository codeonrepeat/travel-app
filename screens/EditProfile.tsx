import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from 'utils/supabase';
import { Buffer } from 'buffer';
import { useNavigation } from '@react-navigation/native';

export default function EditProfile() {
  const navigation = useNavigation();

  const [avatarUrl, setAvatarUrl] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) throw userError || new Error('No user found');

        setUserId(user.id);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileError) throw profileError;

        setAvatarUrl(profileData.avatar_url || '');
        setUsername(profileData.username || '');
        setBio(profileData.bio || '');
        setLocation(profileData.location || '');
      } catch (e) {
        Alert.alert('Error', e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
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
        setSaving(true);
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
        Alert.alert('Upload failed', e.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSave = async () => {
    if (!username || !bio || !location) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }

    try {
      setSaving(true);
      const updates = {
        id: userId,
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

      Alert.alert('Success', 'Profile updated!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Back button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          {/* Screen Title */}
          <Text style={styles.title}>Edit Your Profile</Text>

          {/* Description text for guidance */}
          <Text style={styles.description}>
            Update your avatar, username, bio, and location so others can learn more about you. A
            complete profile helps build trust between lenders and borrowers.
          </Text>

          {/* Avatar Upload Section */}
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer} disabled={saving}>
            {saving && !avatarUrl ? (
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

          {/* Username Field */}
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
          />
          <Text style={styles.fieldDescription}>
            This is your public name. Keep it simple and recognizable.
          </Text>

          {/* Bio Field */}
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.input}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us something about you"
            multiline
          />
          <Text style={styles.fieldDescription}>
            Share a few lines about your interests, style, or what makes you unique.
          </Text>

          {/* Location Field */}
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Your city"
          />
          <Text style={styles.fieldDescription}>
            This helps show where you're lending or borrowing from.
          </Text>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: saving ? '#ccc' : '#000' }]}
            onPress={handleSave}
            disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24 },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
  },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
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
  fieldDescription: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    marginBottom: 8,
  },
  button: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
