import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { supabase } from 'utils/supabase';
import StoryProgressBar from 'components/StoryProgressBar';
import * as Location from 'expo-location';
import LottieView from 'lottie-react-native';

global.atob = atob; // for Buffer in React Native

const STYLE_TAG_OPTIONS = [
  'Streetwear',
  'Vintage',
  'Minimalist',
  'Elegant',
  'Bold',
  'Casual',
  'Designer',
  'Boho',
  'Grunge',
  'Preppy',
  'Beachwear',
  'Resort Chic',
  'Formal',
  'Evening Wear',
  'Cocktail',
  'Outdoor Adventure',
  'Festival',
  'Travel Comfort',
  'Wedding Guest',
  'Cruise',
];

const SIZE_OPTIONS_TOP = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SIZE_OPTIONS_BOTTOM = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const SIZE_OPTIONS_TOP_MALE = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const SIZE_OPTIONS_TOP_FEMALE = ['XS', 'S', 'M', 'L', 'XL'];
export const SIZE_OPTIONS_TOP_UNISEX = ['XS', 'S', 'M', 'L', 'XL'];

export const SIZE_OPTIONS_BOTTOM_MALE = ['28', '30', '32', '34', '36', '38', '40', '42', '44'];
export const SIZE_OPTIONS_BOTTOM_FEMALE = ['0', '2', '4', '6', '8', '10', '12'];
export const SIZE_OPTIONS_BOTTOM_UNISEX = ['S', 'M', 'L', 'XL'];

const USERNAME_MAX_LENGTH = 20;
const BIO_MAX_LENGTH = 150;

export default function Onboarding({ navigation, route }) {
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1 state
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');

  // Step 2 state
  const [selectedTags, setSelectedTags] = useState([]);

  // Step 3 state
  const [location, setLocation] = useState('');

  // Step 4 state
  const [topSize, setTopSize] = useState('');
  const [bottomSize, setBottomSize] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [selectedGender, setSelectedGender] = useState('Male');

  // Step 5 state
  const [loading, setLoading] = useState(false);

  const [delayed, setDelayed] = useState(true); // initially true if you want a delay when step starts

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

  useEffect(() => {
    const timeout = setTimeout(() => setDelayed(false), 2500); // 1.5s delay
    return () => clearTimeout(timeout); // cleanup
  }, [currentStep]); // run on each step change

  // Handlers for Step 1: pick avatar
  // const handlePickAvatar = async () => {
  //   try {
  //     const result = await ImagePicker.launchImageLibraryAsync({
  //       allowsEditing: true,
  //       quality: 0.7,
  //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     });

  //     if (!result.cancelled) {
  //       setUploading(true);
  //       const ext = result.assets[0].uri.split('.').pop();
  //       const fileName = `avatars/${Date.now()}.${ext}`;
  //       const response = await FileSystem.readAsStringAsync(result.assets[0].uri, {
  //         encoding: FileSystem.EncodingType.Base64,
  //       });

  //       const fileBuffer = Buffer.from(response, 'base64');

  //       const { error: uploadError } = await supabase.storage
  //         .from('avatars')
  //         .upload(fileName, fileBuffer, {
  //           contentType: 'image/jpeg',
  //           upsert: true,
  //         });

  //       if (uploadError) {
  //         setError(uploadError.message);
  //         setUploading(false);
  //         return;
  //       }

  //       const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
  //       setAvatarUrl(publicUrlData.publicUrl);
  //       setUploading(false);
  //     }
  //   } catch (err) {
  //     setError('Failed to pick/upload avatar');
  //     setUploading(false);
  //   }
  // };

  //Profile Setup for supabase storage
  const handlePickAvatar = async () => {
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

  // Step 1 input handlers with validation
  const handleUsernameChange = (text) => {
    const filtered = text.replace(/[^a-zA-Z0-9_]/g, '').slice(0, USERNAME_MAX_LENGTH);
    setUsername(filtered);
  };
  const handleBioChange = (text) => {
    setBio(text.slice(0, BIO_MAX_LENGTH));
  };

  // Step 2 toggle tags
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length < 5) {
        setSelectedTags([...selectedTags, tag]);
      } else {
        Alert.alert('Limit reached', 'You can select up to 5 style tags.');
      }
    }
  };

  useEffect(() => {
    const requestAndSetLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is needed for this step.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const places = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (places.length > 0 && (places[0].city || places[0].locality)) {
          setLocation(places[0].city || places[0].locality);
        } else {
          Alert.alert('Location not found', 'Could not detect your city automatically.');
        }
      } catch (err) {
        Alert.alert('Error', 'Could not get location.');
      }
    };

    if (currentStep === 3 && !location) {
      requestAndSetLocation();
    }
  }, [currentStep]);

  // Validation & navigation between steps
  const handleNext = () => {
    setError('');
    if (currentStep === 1) {
      if (!username.trim()) {
        setError('Username is required.');
        return;
      }

      if (!avatarUrl) {
        setError('Please upload a profile photo.');
        return;
      }

      if (!bio.trim()) {
        setError('Style guide is required.');
        return;
      }

      setError(null); // clear any previous error
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedTags.length === 0) {
        Alert.alert('Select at least one style tag to continue.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!location.trim()) {
        Alert.alert('Please enter or detect your location.');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!topSize || !bottomSize || !shoeSize.trim()) {
        Alert.alert('Please fill in all size fields to continue.');
        return;
      }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      handleSaveProfile();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setError('');
      setCurrentStep(currentStep - 1);
    }
  };

  // Skip button handler
  const handleSkip = async () => {
    try {
      setLoading(true);

      // Optionally mark onboarding complete (e.g., Supabase)
      await supabase.from('users').update({ onboarding_complete: true }).eq('id', user.id);

      // Navigate out of onboarding
      navigation.replace('RoleSelect'); // or whatever screen follows
    } catch (error) {
      console.error('Skip failed:', error);
      Alert.alert('Oops', 'Something went wrong while skipping onboarding.');
    } finally {
      setLoading(false);
    }
  };

  // Save profile data on final step
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const updates = {
        id: userId,
        username,
        avatar_url: avatarUrl || null,
        bio,
        style_tags: selectedTags,
        location,
        top_size: topSize,
        bottom_size: bottomSize,
        shoe_size: shoeSize,
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
    // Your supabase save logic here
    // const { error } = await supabase.from('profiles').upsert(updates);
    // if (error) throw error;

    // Simulate delay for demo:
    //   await new Promise((r) => setTimeout(r, 1500));

    //   Alert.alert('Success', 'Profile saved successfully!');
    //   // navigation.reset({index: 0, routes: [{name: 'Home'}]});
    // } catch (err) {
    //   Alert.alert('Error', err.message || 'Failed to save profile.');
    // } finally {
    //   setLoading(false);
    // }
  };

  // Descriptions per step for welcoming + why (preserving your style)
  const stepDescriptions = {
    1: 'Choose a unique username so others can find you easily. This helps lenders and friends recognize you.',
    2: "Select up to 5 style tags that best describe your personal fashion. This helps us recommend items you'll love.",
    3: 'Your location connects you with lenders nearby for faster delivery and pick-up. It is detected automatically here.',
    4: 'Provide your clothing sizes so lenders can show you items that fit you perfectly.',
    5: 'Review all your information before finishing. You can always edit later in your profile.',
  };

  // Render different step contents:
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.containerzero}>
            {/* <Image source={require('../assets/logo.png')} style={styles.logo} /> */}

            <Text style={styles.titlezero}>Welcome to Unpack</Text>

            <Text style={styles.description}>
              A travel clothing rental experience — curated just for you.
            </Text>

            <Text style={styles.description}>
              To get started, we’ll help you create a quick profile with your size, style, and
              location.
            </Text>

            <Text style={styles.description}>
              Thanks for being part of the luggage-free future 🌍
            </Text>

            <TouchableOpacity style={styles.navButtonzero} onPress={() => setCurrentStep(1)}>
              <Text style={styles.navButtonTextzero}>Get Started</Text>
            </TouchableOpacity>
          </View>
        );
      case 1:
        return (
          <>
            <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : uploading ? (
                <Text style={styles.avatarPlaceholder}>Uploading...</Text>
              ) : (
                <Text style={styles.avatarPlaceholder}>Pick Avatar</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Upload a clear photo of yourself. Tap to pick or update anytime.
            </Text>

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
              Letters, numbers, underscores only. Max {USERNAME_MAX_LENGTH} chars.
            </Text>
            <Text style={styles.charCount}>
              {username.length} / {USERNAME_MAX_LENGTH}
            </Text>

            <Text style={styles.label}>Describe your style *</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={bio}
              onChangeText={handleBioChange}
              placeholder="If your closet could talk what would it say?"
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={BIO_MAX_LENGTH}
            />
            <Text style={styles.helperText}>
              Short description of your style or interests. Max {BIO_MAX_LENGTH} chars.
            </Text>
            <Text style={styles.charCount}>
              {bio.length} / {BIO_MAX_LENGTH}
            </Text>
            <LottieView
              source={require('../../assets/Travel icons - Passport.json')}
              autoPlay
              loop
              style={{ width: 200, height: 200, marginLeft: 90, marginTop: 15 }}
            />
          </>
        );

      case 2:
        return (
          <>
            {/* <Text style={styles.subtitle}>{stepDescriptions[2]}</Text> */}
            <ScrollView contentContainerStyle={styles.tagsContainer}>
              {STYLE_TAG_OPTIONS.map((tag) => {
                const selected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tag, selected && styles.tagSelected]}
                    onPress={() => toggleTag(tag)}>
                    <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <LottieView
              source={require('../../assets/Digital Designer.json')}
              autoPlay
              loop
              style={{ width: 200, height: 200, marginLeft: 100, marginTop: 100 }}
            />
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.label}>Location *</Text>
            <Text style={styles.helperText}>{stepDescriptions[3]}</Text>
            <TextInput
              style={styles.input}
              placeholder="Your city or area"
              value={location}
              onChangeText={setLocation}
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
            <LottieView
              source={require('../../assets/Travel Icons - Map.json')}
              autoPlay
              loop
              style={{ width: 200, height: 200, marginLeft: 85, marginTop: 225 }}
            />
          </>
        );

      // case 4:
      //   return (
      //     <>
      //       <Text style={styles.subtitle}>{stepDescriptions[4]}</Text>

      //       <Text style={styles.label}>Typical Top Size *</Text>
      //       <View style={styles.sizeRow}>
      //         {SIZE_OPTIONS_TOP.map((size) => (
      //           <TouchableOpacity
      //             key={`top-${size}`}
      //             style={[styles.sizeBox, topSize === size && styles.sizeBoxSelected]}
      //             onPress={() => setTopSize(size)}>
      //             <Text style={[styles.sizeText, topSize === size && styles.sizeTextSelected]}>
      //               {size}
      //             </Text>
      //           </TouchableOpacity>
      //         ))}
      //       </View>

      //       <Text style={styles.label}>Typical Bottom Size *</Text>
      //       <View style={styles.sizeRow}>
      //         {SIZE_OPTIONS_BOTTOM.map((size) => (
      //           <TouchableOpacity
      //             key={`bottom-${size}`}
      //             style={[styles.sizeBox, bottomSize === size && styles.sizeBoxSelected]}
      //             onPress={() => setBottomSize(size)}>
      //             <Text style={[styles.sizeText, bottomSize === size && styles.sizeTextSelected]}>
      //               {size}
      //             </Text>
      //           </TouchableOpacity>
      //         ))}
      //       </View>

      //       <Text style={styles.label}>Typical Shoe Size *</Text>
      //       <TextInput
      //         style={styles.input}
      //         placeholder="e.g. 10.5 US Men"
      //         value={shoeSize}
      //         onChangeText={setShoeSize}
      //         keyboardType="default"
      //         autoCapitalize="none"
      //       />
      //       <LottieView
      //         source={require('../../assets/scan body.json')}
      //         autoPlay
      //         loop
      //         style={{ width: 350, height: 450, marginLeft: 15, marginTop: -20 }}
      //       />
      //     </>
      //   );

      case 4:
        return (
          <>
            <Text style={styles.subtitle}>{stepDescriptions[4]}</Text>

            {/* Gender Selection Tabs */}
            <View style={styles.tabRow}>
              {['Male', 'Female'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[styles.tab, selectedGender === gender && styles.tabSelected]}
                  onPress={() => setSelectedGender(gender)}>
                  <Text
                    style={[styles.tabText, selectedGender === gender && styles.tabTextSelected]}>
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Top Size */}
            <Text style={styles.label}>Typical Top Size *</Text>
            <View style={styles.sizeRow}>
              {(selectedGender === 'Male'
                ? SIZE_OPTIONS_TOP_MALE
                : selectedGender === 'Female'
                  ? SIZE_OPTIONS_TOP_FEMALE
                  : SIZE_OPTIONS_TOP_UNISEX
              ).map((size) => (
                <TouchableOpacity
                  key={`top-${size}`}
                  style={[styles.sizeBox, topSize === size && styles.sizeBoxSelected]}
                  onPress={() => setTopSize(size)}>
                  <Text style={[styles.sizeText, topSize === size && styles.sizeTextSelected]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bottom Size */}
            <Text style={styles.label}>Typical Bottom Size *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sizeRow}>
              {(selectedGender === 'Male'
                ? SIZE_OPTIONS_BOTTOM_MALE
                : selectedGender === 'Female'
                  ? SIZE_OPTIONS_BOTTOM_FEMALE
                  : SIZE_OPTIONS_BOTTOM_UNISEX
              ).map((size) => (
                <TouchableOpacity
                  key={`bottom-${size}`}
                  style={[styles.sizeBox, bottomSize === size && styles.sizeBoxSelected]}
                  onPress={() => setBottomSize(size)}>
                  <Text style={[styles.sizeText, bottomSize === size && styles.sizeTextSelected]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Shoe Size */}
            <Text style={styles.label}>Typical Shoe Size *</Text>
            <TextInput
              style={styles.input}
              placeholder={
                selectedGender === 'Female'
                  ? 'e.g. 8 US Women'
                  : selectedGender === 'Male'
                    ? 'e.g. 10.5 US Men'
                    : 'e.g. 9.5 US'
              }
              value={shoeSize}
              onChangeText={setShoeSize}
              keyboardType="default"
              autoCapitalize="none"
            />

            {/* Body Scan Animation */}
            <LottieView
              source={require('../../assets/scan body.json')}
              autoPlay
              loop
              style={{ width: 350, height: 450, marginLeft: 15, marginTop: -20 }}
            />
          </>
        );

      case 5:
        return (
          <>
            <Text style={styles.subtitle}>{stepDescriptions[5]}</Text>

            <View style={styles.summaryItem}>
              <Text style={styles.label}>Username:</Text>
              <Text style={styles.value}>{username}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.label}>Bio:</Text>
              <Text style={styles.value}>{bio || '-'}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.label}>Style Tags:</Text>
              <Text style={styles.value}>{selectedTags.join(', ') || '-'}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.label}>Location:</Text>
              <Text style={styles.value}>{location || '-'}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.label}>Sizes:</Text>
              <Text style={styles.value}>
                Top: {topSize || '-'}, Bottom: {bottomSize || '-'}, Shoe: {shoeSize || '-'}
              </Text>
            </View>
            <LottieView
              source={require('../../assets/Profile user card.json')}
              autoPlay
              loop
              style={{ width: 350, height: 450, marginLeft: 10, marginTop: -50 }}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StoryProgressBar currentStep={currentStep} totalSteps={5} />
      <View style={styles.container}>
        <Text style={styles.title}>Step {currentStep} of 5</Text>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={styles.welcomeDescription}>{stepDescriptions[currentStep]}</Text>
          {renderStepContent()}
        </ScrollView>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
            disabled={currentStep === 0}
            onPress={handleBack}>
            <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
              Back
            </Text>
          </TouchableOpacity>
          {/* 
          {currentStep < 5 && (
            <TouchableOpacity style={{}} onPress={handleSkip} disabled={loading}>
              <Text style={{ color: 'white', marginTop: 10, fontSize: 16, fontWeight: 'bold' }}>
                Skip
              </Text>
            </TouchableOpacity>
          )} */}

          {/* <TouchableOpacity style={styles.navButton} onPress={handleNext} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#22c55e" />
            ) : (
              <Text style={styles.navButtonText}>{currentStep === 5 ? 'Finish' : 'Next'}</Text>
            )}
            
          </TouchableOpacity> */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNext}
            disabled={loading || delayed} // block while delayed
          >
            {loading || delayed ? (
              <ActivityIndicator color="#22c55e" />
            ) : (
              <Text style={styles.navButtonText}>{currentStep === 5 ? 'Finish' : 'Next'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 18, fontWeight: '600', color: 'white', marginBottom: 12 },
  welcomeDescription: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 16,
    lineHeight: 18,
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
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { color: '#9ca3af' },
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
  tag: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  tagText: { color: '#ccc' },
  tagTextSelected: { color: 'white' },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 3,
  },

  sizeBox: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
    marginBottom: 8,
  },
  sizeBoxSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  sizeText: { color: '#ccc' },
  sizeTextSelected: { color: 'white' },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  navButton: {
    backgroundColor: '#27272a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 75,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#18181b',
  },
  navButtonText: { color: '#a3a3a3', fontWeight: '600' },
  navButtonTextDisabled: { color: '#52525b' },
  error: {
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: 12,
    marginTop: -8,
    textAlign: 'center',
  },
  summaryItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
    paddingVertical: 10,
  },
  value: { color: 'white', marginTop: 2 },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
  },
  containerzero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#111', // Or whatever your brand uses
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  titlezero: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 8,
  },
  navButtonzero: {
    marginTop: 32,
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  navButtonTextzero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },

  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },

  tabSelected: {
    backgroundColor: '#000', // or your primary brand color
    borderColor: '#000',
  },

  tabText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },

  tabTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
