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
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from 'utils/supabase';
import { Buffer } from 'buffer';
import { useNavigation } from '@react-navigation/native';
import Header from 'components/Header';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useRef, useMemo, useCallback } from 'react';

export default function EditProfile() {
  const navigation = useNavigation();

  const [avatarUrl, setAvatarUrl] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['50%'], []); // adjust height as needed

  const openBottomSheet = () => bottomSheetRef.current?.expand();
  const closeBottomSheet = () => bottomSheetRef.current?.close();

  const styleOptions = [
    'Athleisure',
    'Beachwear',
    'Boho',
    'Bold',
    'Business Casual',
    'Casual',
    'Chic',
    'Cocktail',
    'Cruise',
    'Designer',
    'Elegant',
    'Evening Wear',
    'Festival',
    'Formal',
    'Grunge',
    'Minimalist',
    'Outdoor Adventure',
    'Preppy',
    'Resort Chic',
    'Smart Casual',
    'Sporty',
    'Streetwear',
    'Travel Comfort',
    'Vintage',
    'Wedding Guest',
  ];

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
        setSelectedTags(profileData.style_tags || []);
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
        style_tags: selectedTags,
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

  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        // Remove if already selected
        return prev.filter((t) => t !== tag);
      } else {
        if (prev.length >= 5) {
          Alert.alert('Limit reached', 'You can only select up to 5 styles.');
          return prev;
        }
        // Add new tag
        return [...prev, tag];
      }
    });
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
      <Header
        title="Edit Profile"
        leftButton={
          <MaterialCommunityIcons name="arrow-left" size={30} onPress={() => navigation.goBack()} />
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.description}>
            Update your avatar, username, bio, location, and style so others can learn more about
            you.
          </Text>

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

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.input}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us something about you"
            multiline
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Your city"
          />
          <View>
            <Text style={styles.label}>Styles</Text>
          </View>

          <TouchableOpacity onPress={openBottomSheet} style={styles.tagPicker}>
            <Text style={styles.tagText}>
              {selectedTags.length > 0 ? selectedTags.join(', ') : 'Select your style'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: saving ? '#ccc' : '#000' }]}
            onPress={handleSave}
            disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </ScrollView>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          backgroundStyle={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}>
          <BottomSheetView style={{ padding: 24 }}>
            <Text style={styles.modalTitle}>Pick your style</Text>
            <View style={styles.tagGrid}>
              {styleOptions.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.tagButton, selectedTags.includes(tag) && styles.tagSelected]}>
                  <Text
                    style={[
                      styles.tagButtonText,
                      selectedTags.includes(tag) && styles.tagButtonTextSelected,
                    ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={closeBottomSheet} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>
      </KeyboardAvoidingView>

      {/* Modal for style tag selection */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select up to 5 style</Text>
            <View style={styles.tagGrid}>
              {styleOptions.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  disabled={selectedTags.length >= 5 && !selectedTags.includes(tag)} // disable if limit reached and not already selected
                  style={[
                    styles.tagButton,
                    selectedTags.includes(tag) && styles.tagSelected,
                    selectedTags.length >= 5 && !selectedTags.includes(tag) && { opacity: 0.5 }, // faded look
                  ]}>
                  <Text
                    style={[
                      styles.tagButtonText,
                      selectedTags.includes(tag) && styles.tagButtonTextSelected,
                    ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  backButtonText: { fontSize: 16, color: '#333' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  description: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 20 },
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
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tagPicker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  tagText: { fontSize: 16, color: '#555' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    margin: 4,
  },
  tagButtonText: { fontSize: 14, color: '#333' },
  tagSelected: { backgroundColor: '#000', borderColor: '#000' },
  tagButtonTextSelected: { color: '#fff' },
  modalCloseButton: {
    marginTop: 24,
    alignSelf: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalCloseText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
