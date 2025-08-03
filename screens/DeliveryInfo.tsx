import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from 'utils/supabase';

export default function DeliveryInfoScreen({ route, navigation }) {
  const { tripCity, tripStartDate, tripEndDate, currentUserId, tripCart, paymentOption } =
    route.params;

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitDelivery = async () => {
    if (!deliveryAddress.trim()) {
      Alert.alert('Validation', 'Please enter a delivery address or instructions.');
      return;
    }

    setLoading(true);

    try {
      // Calculate total price
      const totalPrice = tripCart.reduce((sum, item) => sum + (item.price || 0), 0);

      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            borrower_id: currentUserId,
            trip_city: tripCity,
            start_date: tripStartDate,
            end_date: tripEndDate,
            status: 'pending',
            total_price: totalPrice,
            delivery_address: deliveryAddress, // You might need to add this column to orders table
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order_items
      const orderItems = tripCart.map((item) => ({
        order_id: orderData.id,
        item_id: item.id,
        lender_id: item.lender_id,
        price: item.price || 0,
        status: 'pending',
      }));

      const { error: orderItemsError } = await supabase.from('order_items').insert(orderItems);
      if (orderItemsError) throw orderItemsError;

      // Insert notifications for lenders with delivery info in message
      const notifications = tripCart.map((item) => ({
        recipient_id: item.lender_id,
        message: `New borrow request for "${item.name}". Delivery info: ${deliveryAddress}`,
        is_read: false,
        order_id: orderData.id,
      }));

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);
      if (notificationError) throw notificationError;

      Alert.alert('Success', 'Your borrow request has been submitted.');
      navigation.popToTop();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Enter delivery address or instructions:</Text>
      <TextInput
        style={styles.textInput}
        multiline
        placeholder="e.g. Meet me at the hotel lobby, or locker #123 near airport"
        value={deliveryAddress}
        onChangeText={setDeliveryAddress}
      />

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmitDelivery}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit Reservation</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { fontSize: 18, marginBottom: 12 },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: { backgroundColor: '#999' },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
