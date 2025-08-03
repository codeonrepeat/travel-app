import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from 'utils/supabase';

export default function UserBuilder() {
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    location: '',
    profile_photo_url: '',
  });

  const [wardrobe, setWardrobe] = useState([]);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    size: '',
  });

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Load user profile and wardrobe on mount
  useEffect(() => {
    const getUserAndData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        await loadProfile(user.id);
        await loadWardrobe(user.id);
      } else {
        Alert.alert('Error', 'User not logged in');
      }

      setLoading(false);
    };

    getUserAndData();
  }, []);

  const loadProfile = async (id) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();

    if (error) console.error('Error loading profile:', error);
    else setProfile(data);
  };

  const loadWardrobe = async (id) => {
    const { data, error } = await supabase.from('wardrobe_items').select('*').eq('profile_id', id);

    if (error) console.error('Error loading wardrobe:', error);
    else setWardrobe(data);
  };

  const saveProfile = async () => {
    if (!userId) return;

    const updates = {
      id: userId, // required for upsert
      name: profile.name,
      bio: profile.bio,
      location: profile.location,
      profile_photo_url: profile.profile_photo_url,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates, { onConflict: 'id' });

    if (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Could not save profile');
    } else {
      Alert.alert('Success', 'Profile saved');
    }
  };

  const addWardrobeItem = async () => {
    if (!newItem.name.trim()) {
      Alert.alert('Validation', 'Item name is required');
      return;
    }

    const { data, error } = await supabase.from('wardrobe_items').insert([
      {
        ...newItem,
        profile_id: userId,
      },
    ]);

    if (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Could not add wardrobe item');
    } else {
      setWardrobe([...wardrobe, ...data]);
      setNewItem({ name: '', category: '', size: '' });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  console.log('User ID:', user.id);
  console.log('User Email:', user.email);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>

        <TouchableOpacity onPress={pickProfilePhoto} style={styles.photoContainer}>
          {profile.profile_photo_url ? (
            <Image source={{ uri: profile.profile_photo_url }} style={styles.photo} />
          ) : (
            <Text style={styles.photoPlaceholder}>Tap to upload photo</Text>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Name"
          value={profile.name}
          onChangeText={(text) => setProfile({ ...profile, name: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Bio"
          value={profile.bio}
          onChangeText={(text) => setProfile({ ...profile, bio: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Location"
          value={profile.location}
          onChangeText={(text) => setProfile({ ...profile, location: text })}
        />

        <Button title="Save Profile" onPress={saveProfile} />

        <Text style={styles.title}>Your Wardrobe</Text>

        <FlatList
          data={wardrobe}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Text style={styles.itemText}>
                {item.name} ({item.size})
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text>No items yet.</Text>}
        />

        <Text style={styles.subtitle}>Add New Item</Text>

        <TextInput
          style={styles.input}
          placeholder="Item Name"
          value={newItem.name}
          onChangeText={(text) => setNewItem({ ...newItem, name: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Category (e.g. jacket)"
          value={newItem.category}
          onChangeText={(text) => setNewItem({ ...newItem, category: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Size (e.g. M)"
          value={newItem.size}
          onChangeText={(text) => setNewItem({ ...newItem, size: text })}
        />

        <Button title="Add Item" onPress={addWardrobeItem} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginVertical: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 20,
    marginBottom: 8,
  },
  photoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#eee',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    overflow: 'hidden',
  },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  photoPlaceholder: {
    color: '#999',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemCard: {
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
  },
});
