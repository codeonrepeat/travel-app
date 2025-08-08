import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { supabase } from 'utils/supabase';
import { useNavigation } from '@react-navigation/native';
import Header from 'components/Header';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Notifications() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [responses, setResponses] = useState({});
  const fallbackImage = 'https://via.placeholder.com/100';
  const navigation = useNavigation();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('order_items')
        .select(
          `
          id,
          price,
          status,
          order_id,
          item:wardrobe_items (
            id,
            name,
            wardrobe_item_photos (
              photo_url
            )
          ),
          order:orders (
            id,
            trip_city,
            start_date,
            end_date,
            delivery_method,
            status,
            borrower:profiles (
              username,
              avatar_url
            )
          )
        `
        )
        .eq('lender_id', user.id);

      if (error) {
        console.error('Error fetching order items:', error);
      } else {
        const grouped = {};
        for (const item of data) {
          const orderId = item.order.id;
          if (!grouped[orderId]) {
            grouped[orderId] = {
              order_id: orderId,
              trip_city: item.order.trip_city,
              delivery_method: item.order.delivery_method,
              start_date: item.order.start_date,
              end_date: item.order.end_date,
              borrower: item.order.borrower,
              status: item.order.status,
              items: [],
            };
          }
          grouped[orderId].items.push(item);
        }
        setOrders(Object.values(grouped));
      }

      setLoading(false);
    };

    fetchOrders();
  }, [responses]);

  const handleResponse = async (orderId, newStatus) => {
    if (responses[orderId]) return;

    setUpdatingOrderId(orderId);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      setUpdatingOrderId(null);
      return;
    }

    try {
      const { error: itemsError } = await supabase
        .from('order_items')
        .update({ status: newStatus })
        .eq('order_id', orderId)
        .eq('lender_id', user.id);

      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      const { error: notificationError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('order_id', orderId);

      if (itemsError || orderError || notificationError) {
        Alert.alert('Error', 'Failed to update order or notifications.');
        setUpdatingOrderId(null);
        return;
      }

      setResponses((prev) => ({
        ...prev,
        [orderId]: newStatus,
      }));

      setTimeout(() => {
        setUpdatingOrderId(null);
        if (newStatus === 'accepted') {
          navigation.navigate('FinalChecklist', { orderId });
        }
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
      setUpdatingOrderId(null);
    }
  };

  const renderItem = ({ item }) => {
    const { trip_city, start_date, end_date, delivery_method, borrower, items, order_id, status } =
      item;

    const localResponse = responses[order_id];
    const currentStatus = localResponse || status;

    const isAccepted = currentStatus === 'accepted';
    const isRejected = currentStatus === 'rejected';
    const isResponded = isAccepted || isRejected;
    const isUpdating = updatingOrderId === order_id;

    return (
      <View style={[styles.card, isResponded && styles.archivedCard]}>
        <View style={styles.header}>
          <Image source={{ uri: borrower?.avatar_url || fallbackImage }} style={styles.avatar} />
          <View>
            <Text style={styles.username}>{borrower?.username || 'Unknown'}</Text>
            <Text style={styles.dates}>
              {trip_city} | {new Date(start_date).toLocaleDateString()} →{' '}
              {new Date(end_date).toLocaleDateString()}
            </Text>
            <Text style={styles.delivery}>Delivery: {delivery_method || 'Unspecified'}</Text>
          </View>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const photo = item.item?.wardrobe_item_photos?.[0]?.photo_url || fallbackImage;
            return (
              <View style={styles.itemCard}>
                <Image source={{ uri: photo }} style={styles.itemImage} />
                <Text numberOfLines={1} style={styles.itemName}>
                  {item.item?.name || 'Unnamed'}
                </Text>
              </View>
            );
          }}
        />

        {!isResponded && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: '#4CAF50' },
                isUpdating && styles.buttonDisabled,
              ]}
              onPress={() => handleResponse(order_id, 'accepted')}
              disabled={isUpdating}>
              {isUpdating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Accept</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: '#f44336' },
                isUpdating && styles.buttonDisabled,
              ]}
              onPress={() => handleResponse(order_id, 'rejected')}
              disabled={isUpdating}>
              {isUpdating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reject</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {isAccepted && (
          <TouchableOpacity
            onPress={() => navigation.navigate('FinalChecklist', { orderId: order_id })}
            style={{ marginTop: 10 }}>
            <Text style={styles.status}>✅ Accepted – View Final Checklist</Text>
          </TouchableOpacity>
        )}
        {isRejected && <Text style={styles.status}>❌ Rejected</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Notifications.tsx"
        leftButton={
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="black" />
          </TouchableOpacity>
        }
      />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : orders.length === 0 ? (
        <Text style={styles.emptyText}>No new requests.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.order_id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  archivedCard: {
    opacity: 0.6,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 10 },
  username: { fontWeight: '600', fontSize: 16 },
  dates: { color: '#666' },
  delivery: { color: '#444', fontStyle: 'italic', fontSize: 13 },
  itemCard: {
    width: 80,
    marginRight: 10,
    alignItems: 'center',
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#ccc',
  },
  itemName: { fontSize: 12, textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  button: {
    flex: 1,
    padding: 10,
    marginHorizontal: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: { color: 'white', fontWeight: '600' },
  status: {
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
    textDecorationLine: 'underline',
  },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#777' },
});
