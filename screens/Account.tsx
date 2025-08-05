import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from 'utils/supabase';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Header from 'components/Header';

export default function Account() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

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
        setProfile(profileData);
      } catch (e) {
        Alert.alert('Error', e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!userId) return;
    async function fetchNotifications() {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Notification fetch error:', error);
        setHasUnreadNotifications(false);
        return;
      }
      setHasUnreadNotifications((data?.length ?? 0) > 0);
    }
    fetchNotifications();

    const unsubscribe = navigation.addListener('focus', fetchNotifications);
    return unsubscribe;
  }, [userId, navigation]);

  if (loading || !profile) {
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Account"
        leftButton={
          <TouchableOpacity onPress={() => navigation.navigate('RoleSelect')}>
            <MaterialCommunityIcons name="home" size={28} color="black" />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={() => navigation.navigate('InboxScreen')} style={{ flex: 1 }}>
            <Ionicons name="chatbox-ellipses-outline" size={28} color="black" />
          </TouchableOpacity>
        }
      />

      {/* Profile Header */}

      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
          <Image
            source={{ uri: profile.avatar_url || 'https://picsum.photos/100' }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{profile.username || 'Unnamed'}</Text>
          {profile.role && <Text style={styles.roleBadge}>{profile.role}</Text>}
          <Text style={styles.location}>{profile.location || 'Unknown location'}</Text>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}>
            <MaterialCommunityIcons name="account-edit-outline" size={20} color="#007AFF" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        {/* <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={styles.notificationBell}>
          <MaterialCommunityIcons name="bell-outline" size={28} color="#333" />
          {hasUnreadNotifications && <View style={styles.notificationDot} />}
        </TouchableOpacity> */}
      </View>
      {/* Quick Action Cards */}
      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => navigation.navigate('WardrobeEditor', { userId })}>
          <Text style={styles.sectionTitle}>Upload New Item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => navigation.navigate('WardrobeScreen')}>
          <Text style={styles.sectionTitle}>👚 View Wardrobe</Text>
          <Text style={styles.sectionDescription}>See all your uploaded wardrobe items</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => navigation.navigate('MyRequests')}>
          <Text style={styles.sectionTitle}>🧾 My Requests</Text>
          <Text style={styles.sectionDescription}>View your submitted wardrobe requests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.sectionTitle}>🧾 Incoming Requests</Text>
          <Text style={styles.sectionDescription}>View requests for your wardrobe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => navigation.navigate('LenderAvailability')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Set Unavailability</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[styles.authButton, { backgroundColor: '#007AFF' }]}
          onPress={() => supabase.auth.signOut()}>
          <Text style={[styles.authButtonText, { color: 'white' }]}>Sign Out</Text>
        </TouchableOpacity>
        {/* 
        <TouchableOpacity
          style={[styles.authButton, { backgroundColor: '#FF3B30' }]}
          onPress={() => Alert.alert('Delete account feature coming soon')}>
          <Text style={[styles.authButtonText, { color: 'white' }]}>Delete Account</Text>
        </TouchableOpacity> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 20,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
  },

  userInfo: { flex: 1 },

  username: {
    fontSize: 24,
    fontWeight: '700',
  },

  location: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  roleBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#eee',
    color: '#333',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
  },

  editProfileButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  editProfileText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },

  notificationBell: {
    position: 'absolute',
    right: 15,
    top: 24,
    padding: 6,
  },

  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    borderWidth: 1,
    borderColor: 'white',
  },

  cardsContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },

  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },

  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },

  authButton: {
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },

  authButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'space-between',
  },

  homeIcon: {
    color: '#007AFF',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
    color: '#007AFF',
  },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', flex: 1 },
});
