import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { supabase } from 'utils/supabase';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from 'components/Header';

export default function WardrobeScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    async function fetchUserAndWardrobe() {
      try {
        setLoading(true);
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) throw userError || new Error('No user found');
        setUserId(user.id);

        const { data: wardrobeData, error: wardrobeError } = await supabase
          .from('wardrobe_items')
          .select('id, name, wardrobe_item_photos (photo_url)')
          .eq('profile_id', user.id);
        if (wardrobeError) throw wardrobeError;

        const itemsWithPhotos = wardrobeData.map((item) => ({
          ...item,
          firstPhotoUrl: item.wardrobe_item_photos?.[0]?.photo_url || null,
        }));

        setWardrobeItems(itemsWithPhotos);
      } catch (e) {
        Alert.alert('Error loading wardrobe', e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUserAndWardrobe();
  }, []);

  const deleteWardrobeItem = async (id) => {
    try {
      const { error } = await supabase
        .from('wardrobe_item_photos')
        .delete()
        .eq('wardrobe_item_id', id);
      if (error) throw error;

      const { error: itemError } = await supabase.from('wardrobe_items').delete().eq('id', id);
      if (itemError) throw itemError;

      setWardrobeItems((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      Alert.alert('Error deleting item', e.message);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="My Wardrobe"
        leftButton={
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="black" />
          </TouchableOpacity>
        }
      />

      {wardrobeItems.length === 0 ? (
        <Text style={styles.emptyText}>No items found.</Text>
      ) : (
        <FlatList
          data={wardrobeItems}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <Image
                source={{ uri: item.firstPhotoUrl || 'https://via.placeholder.com/100' }}
                style={styles.image}
              />
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate('WardrobeEditor', { itemId: item.id })}>
                  <MaterialCommunityIcons name="pencil-outline" size={20} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteWardrobeItem(item.id)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666' },
  grid: {
    paddingBottom: 100,
  },
  itemContainer: {
    flex: 1 / 3,
    margin: 6,
    position: 'relative',
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#ddd',
  },
  itemName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 100,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 6,
    right: 8,
  },
  editButton: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 2,
    marginRight: 4,
    elevation: 4,
  },
  deleteButton: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 2,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
});
