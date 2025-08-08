import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from 'utils/supabase';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { connectStreamUser } from 'utils/connectStreamUser';

import { copilot, walkthroughable, CopilotStep } from 'react-native-copilot';

export default function RoleSelect() {
  const navigation = useNavigation();

  // User info
  const [username, setUsername] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);

  // Search inputs
  const [destination, setDestination] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Profiles for after search
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const fallbackAvatar = 'https://via.placeholder.com/100';

  // Notification state
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  // Popup banner state
  const [showUploadHint, setShowUploadHint] = useState(false);

  const WalkthroughableText = walkthroughable(Text);
  const WalkthroughableTouchableOpacity = walkthroughable(TouchableOpacity);
  const WalkthroughableTextInput = walkthroughable(TextInput);

  useEffect(() => {
    if (!currentUserId) return;

    const connectUser = async () => {
      try {
        console.log('Connecting user to Stream:', currentUserId);
        await connectStreamUser({
          id: currentUserId,
          name: userEmail || 'User',
          image: currentUserAvatar || undefined,
        });
        console.log('Stream user connected successfully');
      } catch (error) {
        console.error('Error connecting Stream user:', error);
      }
    };

    connectUser();
  }, [currentUserId]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUserEmail(data.user.email);
        setCurrentUserId(data.user.id);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url,username')
          .eq('id', data.user.id)
          .single();

        if (profileData?.avatar_url) {
          setCurrentUserAvatar(profileData.avatar_url);
        }
        if (profileData?.username) {
          setUsername(profileData.username); // 👈 store it in state
        }
      }
    };

    const checkHint = async () => {
      const seen = await AsyncStorage.getItem('seenUploadHint');
      if (!seen) {
        setShowUploadHint(true);
      }
    };

    fetchUserInfo();
    checkHint();
  }, []);

  // Fetch unread notifications after currentUserId is set
  useEffect(() => {
    if (!currentUserId) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('recipient_id', currentUserId)
        .eq('is_read', false);

      if (error) {
        console.error('Notification fetch error:', error);
        setHasUnreadNotifications(false);
        return;
      }

      setHasUnreadNotifications((data?.length ?? 0) > 0);
    };

    fetchNotifications();

    // Also refresh on screen focus
    const unsubscribe = navigation.addListener('focus', fetchNotifications);

    return unsubscribe;
  }, [currentUserId, navigation]);

  // Save trip to trips table
  const saveTrip = async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase.from('trips').insert([
      {
        profile_id: currentUserId,
        city: destination.trim(),
        start_date: startDate?.toISOString().split('T')[0] || null,
        end_date: endDate?.toISOString().split('T')[0] || null,
      },
    ]);

    if (error) {
      console.error('Error saving trip:', error);
    } else {
      console.log('Trip saved:', data);
    }
  };

  // Search profiles matching city, after saving trip
  const searchProfiles = async () => {
    if (!destination.trim()) {
      alert('Please enter a destination city.');
      return;
    }
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    setLoadingProfiles(true);

    try {
      await saveTrip();

      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          username,
          location,
          bio,
          avatar_url,
          wardrobe_items (
            id,
            name,
            wardrobe_item_photos (
              id,
              photo_url
            )
          )
        `
        )
        .ilike('location', `%${destination.trim()}%`)
        .neq('id', currentUserId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        setProfiles([]);
      } else {
        setProfiles(data || []);
      }
    } catch (e) {
      console.error('Error in searchProfiles:', e);
      setProfiles([]);
    }

    setLoadingProfiles(false);
  };

  // Date picker handlers
  const onStartDateChange = (event, selectedDate) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      if (endDate && selectedDate > endDate) {
        setEndDate(null);
      }
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // Format date display
  const formatDate = (date) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString();
  };

  // Dismiss popup and save state
  const dismissHint = async () => {
    setShowUploadHint(false);
    await AsyncStorage.setItem('seenUploadHint', 'true');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userEmail}>{username || 'Traveler'}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={() => navigation.navigate('Account')}
          activeOpacity={0.7}>
          <View>
            <Image
              source={{ uri: currentUserAvatar || fallbackAvatar }}
              style={styles.userAvatar}
            />
            {hasUnreadNotifications && <View style={styles.notificationDot} />}
          </View>
        </TouchableOpacity>
      </View>

      {/* Trip Planner Inputs */}
      <View style={styles.tripPlanner}>
        <Text style={styles.label}>Destination City</Text>
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Enter city"
            value={destination}
            onChangeText={setDestination}
            style={[styles.textInput, { flex: 1 }]}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {destination.length > 0 && (
            <TouchableOpacity onPress={() => setDestination('')} style={styles.clearButton}>
              <MaterialIcons name="cancel" size={22} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.dateRow}>
          <View style={styles.datePickerContainer}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
              <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
              <MaterialIcons name="calendar-today" size={20} color="#007AFF" />
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={onStartDateChange}
              />
            )}
          </View>

          <View style={styles.datePickerContainer}>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
              <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
              <MaterialIcons name="calendar-today" size={20} color="#007AFF" />
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate || startDate || new Date()}
                mode="date"
                display="default"
                minimumDate={startDate || new Date()}
                onChange={onEndDateChange}
              />
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={searchProfiles}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Profiles List */}
      {loadingProfiles ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : profiles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No profiles found.</Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const wardrobeItems = item.wardrobe_items || [];
            const previewPhotos = wardrobeItems
              .flatMap((wi) => wi.wardrobe_item_photos || [])
              .slice(0, 3);

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate('ProfileDetails', {
                    profile: item,
                    currentUserId: currentUserId,
                    tripCity: destination.trim(),
                    tripStartDate: startDate?.toISOString(),
                    tripEndDate: endDate?.toISOString(),
                  })
                }>
                <View style={styles.profileRow}>
                  <Image
                    source={{ uri: item.avatar_url || fallbackAvatar }}
                    style={styles.avatar}
                  />
                  <Text style={styles.username}>{item.username || 'No Name'}</Text>
                  <Text style={styles.location}>{item.location || 'Unknown Location'}</Text>
                </View>

                {previewPhotos.length > 0 && (
                  <View style={styles.previewRow}>
                    {previewPhotos.map((photo) => (
                      <Image
                        key={photo.id}
                        source={{ uri: photo.photo_url }}
                        style={styles.previewImage}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Bottom popup banner */}
      {showUploadHint && (
        <View style={styles.bottomBanner}>
          <Text style={styles.bannerText}>
            Want to lend clothes? Tap your profile avatar to upload items.
          </Text>
          <TouchableOpacity onPress={dismissHint} style={styles.bannerCloseButton}>
            <MaterialIcons name="close" size={20} color="#555" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, margin: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  greeting: {
    fontSize: 14,
    color: 'gray',
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
  },
  avatarWrapper: {
    marginLeft: 180,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
  },

  tripPlanner: {
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  textInput: {
    height: 44,
    fontSize: 16,
  },
  clearButton: {
    marginLeft: 6,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePickerContainer: {
    flex: 1,
    marginRight: 10,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },

  searchButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },

  list: {
    paddingBottom: 40,
  },

  card: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  username: {
    fontWeight: '700',
    fontSize: 18,
    flex: 1,
  },
  location: {
    color: '#666',
  },
  previewRow: {
    flexDirection: 'row',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#ddd',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    marginRight: 12,
  },
  emptyContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    borderWidth: 1,
    borderColor: 'white',
  },

  // Bottom banner styles
  bottomBanner: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: '#FEF3C7', // soft yellow
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  bannerText: {
    flex: 1,
    color: '#92400E',
    fontSize: 14,
  },
  bannerCloseButton: {
    marginLeft: 12,
  },
});
