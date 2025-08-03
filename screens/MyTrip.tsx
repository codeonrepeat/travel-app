import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { supabase } from 'utils/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from 'components/Header';

export default function MyTrip({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fallbackImage = 'https://via.placeholder.com/100';

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) throw userError || new Error('No user found');

        const { data, error } = await supabase
          .from('orders')
          .select(
            `
            id,
            trip_city,
            start_date,
            end_date,
            status,
            total_price,
            order_items (
              id,
              price,
              wardrobe_item:wardrobe_items (
                id,
                name,
                wardrobe_item_photos (
                  id,
                  photo_url
                ),
                profile:profiles (
                  username
                )
              )
            )
          `
          )
          .eq('borrower_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (e) {
        console.error('Error fetching orders:', e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Extract unique lender usernames from order items
  const getLenderUsernames = (order) => {
    const usernames = order.order_items
      .map((oi) => oi.wardrobe_item?.profile?.username)
      .filter(Boolean);
    return [...new Set(usernames)];
  };

  // Compose the info message based on status
  const getStatusInfoMessage = (status, lenders) => {
    if (status === 'pending' || status === 'accepted') {
      return `Payment accepted. Waiting for ${
        lenders.length > 1 ? lenders.join(', ') : lenders[0] || 'the lender'
      } to accept or reject your request. Keep an eye on notifications or check back later for updates.`;
    } else if (status === 'ready') {
      return `Good news! ${
        lenders.length > 1 ? lenders.join(', ') : lenders[0] || 'the lender'
      } has marked your items as ready for pickup or delivery.`;
    } else if (status === 'rejected') {
      return `Unfortunately, your request was rejected by ${
        lenders.length > 1 ? lenders.join(', ') : lenders[0] || 'the lender'
      }. You can try borrowing other items or contact the lender for details.`;
    } else {
      return '';
    }
  };

  const renderOrderItem = ({ item }) => {
    const photo = item.wardrobe_item?.wardrobe_item_photos?.[0]?.photo_url || fallbackImage;

    return (
      <View style={styles.orderItemCard}>
        <Image source={{ uri: photo }} style={styles.itemImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>{item.wardrobe_item?.name || 'Item'}</Text>
          {/* Price */}
          <Text style={styles.priceText}>${item.price?.toFixed(2) || '0.00'}</Text>
        </View>
      </View>
    );
  };

  const renderOrder = ({ item }) => {
    const lenderUsernames = getLenderUsernames(item);
    const statusMessage = getStatusInfoMessage(item.status, lenderUsernames);
    const showInfoBox = ['pending', 'accepted', 'ready', 'rejected'].includes(item.status);

    return (
      <View style={styles.orderCard}>
        <Text style={styles.tripCityText}>Trip to {item.trip_city}</Text>
        <Text style={styles.datesText}>
          {new Date(item.start_date).toLocaleDateString()} →{' '}
          {new Date(item.end_date).toLocaleDateString()}
        </Text>
        <Text style={[styles.statusText, item.status === 'rejected' && styles.statusRejected]}>
          Status: {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
        <Text style={styles.totalPriceText}>
          Total Price: ${item.total_price?.toFixed(2) || '0.00'}
        </Text>

        {showInfoBox && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{statusMessage}</Text>
          </View>
        )}

        <FlatList
          data={item.order_items}
          keyExtractor={(orderItem) => orderItem.id}
          renderItem={renderOrderItem}
          scrollEnabled={false}
          style={{ marginTop: 12 }}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (!orders.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="My Trip"
          leftButton={
            <TouchableOpacity onPress={() => navigation.navigate('Account')} style={{ padding: 6 }}>
              {/* <MaterialCommunityIcons name="arrow-left" size={28} color="black" /> */}
            </TouchableOpacity>
          }
        />
        <Text style={styles.emptyText}>You haven't made any requests yet.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="My Trip"
        leftButton={
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
            {/* <MaterialCommunityIcons name="arrow-left" size={28} color="black" /> */}
          </TouchableOpacity>
        }
      />

      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        renderItem={renderOrder}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('RoleSelect')}>
        <Text style={styles.floatingButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },

  orderCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  tripCityText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  datesText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#007AFF',
  },
  statusRejected: {
    color: '#FF3B30',
  },
  totalPriceText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },

  infoBox: {
    backgroundColor: '#E7F3FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#004085',
    lineHeight: 20,
  },

  orderItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 5, // for Android shadow
    shadowColor: '#000', // for iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#ccc',
    marginRight: 12,
  },
  itemName: {
    fontWeight: '600',
    fontSize: 16,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 6,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#777',
  },
});
