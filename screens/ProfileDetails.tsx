import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from 'utils/supabase';
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTripCart } from 'context/TripCartContext';
import { streamClient } from 'utils/streamClient';
import Header from 'components/Header';

const screenWidth = Dimensions.get('window').width;
const itemCardWidth = (screenWidth - 48) / 2;

const categories = ['All', 'Tops', 'Bottoms', 'Footwear', 'Outerwear', 'Accessories'];

export default function ProfileDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { profile, currentUserId, tripCity, tripStartDate, tripEndDate } = route.params;

  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { tripCart, addToCart, removeFromCart } = useTripCart();
  const fallbackAvatar = 'https://via.placeholder.com/100';

  useEffect(() => {
    fetchWardrobeItems();
  }, []);

  const fetchWardrobeItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select(
        `
        id,
        name,
        category,
        size,
        condition,
        description,
        price_per_day,
        profile:profile_id (
          id,
          username
        ),
        wardrobe_item_photos (
          id,
          photo_url
        )
      `
      )
      .eq('profile_id', profile.id);

    if (error) {
      console.error('Error loading wardrobe:', error);
    } else {
      setWardrobeItems(data || []);
    }
    setLoading(false);
  };

  const filteredItems =
    selectedCategory === 'All'
      ? wardrobeItems
      : wardrobeItems.filter((item) => item.category === selectedCategory);

  const isInCart = (itemId) => tripCart.some((i) => i.id === itemId);

  const renderWardrobeItem = ({ item }) => {
    const thumbnail = item.wardrobe_item_photos?.[0]?.photo_url;
    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() =>
          navigation.navigate('WardrobeItemDetails', {
            item: {
              ...item,
              allPhotos: item.wardrobe_item_photos?.map((photo) => photo.photo_url) || [],
              lender_name: item.profile?.username || 'Unknown',
              price_per_day: item.price_per_day,
            },
            tripCity,
            tripStartDate,
            tripEndDate,
            profile,
          })
        }>
        {thumbnail && <Image source={{ uri: thumbnail }} style={styles.thumbnail} />}
        <Text style={styles.priceText}>${item.price_per_day} / day</Text>
        <TouchableOpacity
          onPress={() => {
            isInCart(item.id)
              ? removeFromCart(item.id)
              : addToCart({
                  ...item,
                  lender_name: item.profile?.username || 'Unknown',
                  lender_id: item.profile?.id,
                });
          }}
          style={{
            position: 'absolute',
            right: 13,
            top: 12,
            borderColor: 'white',
            borderWidth: 1,
            borderRadius: 5,
            backgroundColor: isInCart(item.id) ? 'green' : 'black',
            opacity: 0.6,
            padding: 5,
          }}>
          <FontAwesome6
            name={isInCart(item.id) ? 'check' : 'cart-flatbed-suitcase'}
            size={15}
            color={'white'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="ProfileDetails.tsx"
        leftButton={
          <MaterialCommunityIcons onPress={() => navigation.goBack()} name="arrow-left" size={30} />
        }
      />
      <View style={{ flex: 1 }}>
        {/* Fixed Top Section */}
        <View style={styles.topContainer}>
          <View style={styles.tripBanner}>
            <Text style={styles.tripBannerText}>
              Trip to {tripCity} • {new Date(tripStartDate).toLocaleDateString()} →{' '}
              {new Date(tripEndDate).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.profileCard}>
            <Image source={{ uri: profile.avatar_url || fallbackAvatar }} style={styles.avatar} />
            <Text style={styles.username}>{profile.username || 'Unnamed User'}</Text>
            <Text style={styles.location}>{profile.location || 'No location set'}</Text>
            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

            <TouchableOpacity
              onPress={async () => {
                try {
                  console.log('Opening chat with user:', profile.id);
                  // Create or get the channel with these 2 members
                  const channel = streamClient.channel('messaging', {
                    members: [streamClient.user.id, profile.id],
                  });
                  await channel.watch();

                  console.log('Navigating to DirectMessageScreen with channel:', channel.id);
                  navigation.navigate('DirectMessageScreen', {
                    channelId: channel.id,
                    otherUserId: profile.id,
                  });
                } catch (error) {
                  console.error('Failed to open chat:', error);
                  alert('Unable to open chat right now.');
                }
              }}
              style={{ position: 'absolute', top: 10, right: 10 }}>
              <Ionicons name="chatbox-ellipses-outline" size={28} color="gray" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.tab, selectedCategory === cat && styles.tabActive]}>
                <Text style={selectedCategory === cat ? styles.tabTextActive : styles.tabText}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 5,
              paddingVertical: 10,
            }}>
            <Text style={styles.sectionTitle}>Wardrobe ({filteredItems.length})</Text>
          </View>
        </View>

        {/* Scrollable Wardrobe Items */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderWardrobeItem}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={styles.itemsContainer}
          ListEmptyComponent={
            !loading && <Text style={styles.emptyText}>No items in this category.</Text>
          }
          ListFooterComponent={<View style={{ height: 140 }} />}
        />
      </View>

      {/* Reserve Button */}
      <View style={styles.reserveContainer}>
        <TouchableOpacity
          style={styles.reserveButton}
          onPress={() =>
            navigation.navigate('TripCartScreen', {
              tripCity,
              tripStartDate,
              tripEndDate,
              currentUserId,
            })
          }>
          <Text style={styles.reserveButtonText}>Reserve</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  topContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 4,
  },
  itemsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 200,
  },
  tripBanner: {
    backgroundColor: '#007AFF',
    padding: 12,
    marginVertical: 16,
    borderRadius: 10,
  },
  tripBannerText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    backgroundColor: '#ccc',
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
  },
  tabTextActive: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  itemCard: {
    width: itemCardWidth,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  thumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  reserveContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 999,
  },
  reserveButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  priceText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});
