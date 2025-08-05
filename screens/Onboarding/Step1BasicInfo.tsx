import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from 'utils/supabase';
import { Buffer } from 'buffer';
import StoryProgressBar from 'components/StoryProgressBar';
import LottieView from 'lottie-react-native';

global.atob = atob; // for Buffer in React Native

const USERNAME_MAX_LENGTH = 20;
const BIO_MAX_LENGTH = 150;

export default function Step1BasicInfo({ navigation, route }) {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.cancelled) {
      setUploading(true);
      const ext = result.assets[0].uri.split('.').pop();
      const fileName = `avatars/${Date.now()}.${ext}`;
      const response = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileBuffer = Buffer.from(response, 'base64');

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(publicUrlData.publicUrl);
      setUploading(false);
    }
  };

  const handleUsernameChange = (text) => {
    // Restrict characters to letters, numbers, and underscore only, max length
    const filtered = text.replace(/[^a-zA-Z0-9_]/g, '').slice(0, USERNAME_MAX_LENGTH);
    setUsername(filtered);
  };

  const handleBioChange = (text) => {
    setBio(text.slice(0, BIO_MAX_LENGTH));
  };

  const handleNext = () => {
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    setError('');
    navigation.navigate('Step2StyleTags', {
      profileData: {
        username,
        bio,
        avatar_url: avatarUrl || null,
      },
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <StoryProgressBar currentStep={1} totalSteps={5} />
        <Text style={styles.title}>Step 1: Your Profile</Text>

        {/* Avatar Section */}
        <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarPlaceholder}>Pick Avatar</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.helperText}>
          Upload a clear photo of yourself to represent your profile. Choose a well-lit, friendly
          picture showing your face clearly. You can update this anytime by tapping again.
        </Text>

        {/* Username Section */}
        <Text style={styles.label}>Username *</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={handleUsernameChange}
          placeholder="Your username"
          placeholderTextColor="#9ca3af"
          maxLength={USERNAME_MAX_LENGTH}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.helperText}>
          Use letters, numbers, or underscores only. No spaces or special symbols. Max{' '}
          {USERNAME_MAX_LENGTH} characters.
        </Text>
        <Text style={styles.charCount}>
          {username.length} / {USERNAME_MAX_LENGTH}
        </Text>

        {/* Bio Section */}
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={bio}
          onChangeText={handleBioChange}
          placeholder="Tell us about yourself (optional)"
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={BIO_MAX_LENGTH}
        />
        <Text style={styles.helperText}>
          Share a short description about your style, interests, or what makes you unique. Keep it
          under {BIO_MAX_LENGTH} characters.
        </Text>
        <Text style={styles.charCount}>
          {bio.length} / {BIO_MAX_LENGTH}
        </Text>

        {/* Error Message */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <LottieView
          source={require('../../assets/Travel icons - Passport.json')}
          autoPlay
          loop
          style={{ width: 150, height: 150, alignSelf: 'center', marginBottom: 24 }}
        />
        {/* Next Button */}
        <TouchableOpacity
          style={[styles.button, !username.trim() && { opacity: 0.5 }]}
          onPress={handleNext}
          disabled={!username.trim()}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'black', // Full black background like IG stories
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    color: 'white',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 8,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    color: '#9ca3af',
  },
  label: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
    marginTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 12,
    lineHeight: 16,
  },
  charCount: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: 'white',
    backgroundColor: '#111827',
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 9999,
    marginTop: 24,
    width: '100%',
  },

  buttonText: {
    color: 'black',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  error: {
    color: '#dc2626',
    marginTop: 8,
    textAlign: 'center',
  },
});
