import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { supabase } from 'utils/supabase';
import { useTripCart } from 'context/TripCartContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TripCartScreen({ route, navigation }) {
  const { tripCity, tripStartDate, tripEndDate, currentUserId } = route.params;
  const { tripCart, removeFromCart, clearCart } = useTripCart();

  const [loading, setLoading] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'now' | 'later'>('now');
  const [deliveryMethod, setDeliveryMethod] = useState<'meetup' | 'hotel_dropoff' | 'pickup'>(
    'meetup'
  );

  // Calculate the number of days between start and end (inclusive)
  const tripDays = useMemo(() => {
    const start = new Date(tripStartDate);
    const end = new Date(tripEndDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include last day
    return diffDays > 0 ? diffDays : 1;
  }, [tripStartDate, tripEndDate]);

  // Calculate total price as sum of (price_per_day * tripDays)
  const totalPrice = useMemo(() => {
    return tripCart.reduce((sum, item) => {
      const pricePerDay = item.price_per_day || 0;
      return sum + pricePerDay * tripDays;
    }, 0);
  }, [tripCart, tripDays]);

  const handleSubmit = async () => {
    if (tripCart.length === 0) {
      Alert.alert('Cart is empty', 'Please add items to your cart before submitting.');
      return;
    }

    if (paymentOption === 'now') {
      Alert.alert('Payment', 'Simulated payment flow...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setLoading(true);

    try {
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
            delivery_method: deliveryMethod,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = tripCart.map((item) => ({
        order_id: orderData.id,
        item_id: item.id,
        lender_id: item.lender_id,
        price: (item.price_per_day || 0) * tripDays, // price for entire rental period
      }));

      const { error: orderItemsError } = await supabase.from('order_items').insert(orderItems);
      if (orderItemsError) throw orderItemsError;

      const notifications = tripCart.map((item) => ({
        recipient_id: item.lender_id,
        order_id: orderData.id,
        message: `New borrow request for "${item.name}"`,
        is_read: false,
      }));

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);
      if (notificationError) throw notificationError;

      Alert.alert('Success', 'Your borrow request has been submitted.');
      clearCart();
      navigation.replace('MyTrip');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }) => {
    const thumbnail =
      item.wardrobe_item_photos?.[0]?.photo_url || 'https://via.placeholder.com/100';

    const itemTotalPrice = (item.price_per_day || 0) * tripDays;

    return (
      <View style={styles.cartItemCard}>
        <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.lenderName}>Lender: {item.lender_name || 'Unknown'}</Text>
          <Text style={styles.itemPrice}>
            ${itemTotalPrice.toFixed(2)} ({(item.price_per_day || 0).toFixed(2)} x {tripDays} days)
          </Text>
        </View>
        <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(item.id)}>
          <MaterialCommunityIcons name="close-circle" size={28} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.screenTitle}>Your Trip Cart</Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Trip Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <Text style={styles.sectionDescription}>
            Review your destination and travel dates here to confirm your trip information.
          </Text>
          <Text style={styles.tripInfoText}>
            Destination: <Text style={styles.bold}>{tripCity}</Text>
          </Text>
          <Text style={styles.tripInfoText}>
            Dates:{' '}
            <Text style={styles.bold}>
              {new Date(tripStartDate).toLocaleDateString()} -{' '}
              {new Date(tripEndDate).toLocaleDateString()}
            </Text>
          </Text>
          <Text style={styles.tripInfoText}>
            Total Days: <Text style={styles.bold}>{tripDays}</Text>
          </Text>
        </View>

        {/* Cart Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items in Cart ({tripCart.length})</Text>
          <Text style={styles.sectionDescription}>
            These are the wardrobe items you’ve selected to borrow during your trip. You can remove
            any item you no longer want.
          </Text>
          {tripCart.length === 0 ? (
            <Text style={styles.emptyText}>Your cart is currently empty.</Text>
          ) : (
            <FlatList
              data={tripCart}
              keyExtractor={(item) => item.id}
              renderItem={renderCartItem}
              scrollEnabled={false} // Scroll handled by ScrollView parent
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          )}
          {tripCart.length > 0 && (
            <TouchableOpacity
              style={styles.clearCartButton}
              onPress={() =>
                Alert.alert('Clear Cart', 'Are you sure you want to clear your cart?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: clearCart },
                ])
              }>
              <Text style={styles.clearCartText}>Clear Cart</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Delivery Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Method</Text>
          <Text style={styles.sectionDescription}>
            Choose how you want to receive your items. You can meet the lender in person, have them
            dropped off at your hotel or Airbnb, or pick up from a location.
          </Text>
          {['meetup', 'hotel_dropoff', 'pickup'].map((method) => {
            let label = '';
            if (method === 'meetup') label = 'Meet up in person';
            else if (method === 'hotel_dropoff') label = 'Hotel or Airbnb drop-off';
            else if (method === 'pickup') label = 'Pick up from airport';

            return (
              <TouchableOpacity
                key={method}
                style={styles.radioOption}
                onPress={() => setDeliveryMethod(method)}>
                <MaterialCommunityIcons
                  name={deliveryMethod === method ? 'radiobox-marked' : 'radiobox-blank'}
                  size={24}
                  color="#007AFF"
                />
                <Text style={styles.radioText}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Options</Text>
          <Text style={styles.sectionDescription}>
            Select whether you want to pay now or reserve the items and pay later.
          </Text>
          {['now', 'later'].map((option) => {
            const label = option === 'now' ? 'Pay now' : 'Pay later';
            return (
              <TouchableOpacity
                key={option}
                style={styles.radioOption}
                onPress={() => setPaymentOption(option)}>
                <MaterialCommunityIcons
                  name={paymentOption === option ? 'radiobox-marked' : 'radiobox-blank'}
                  size={24}
                  color="#007AFF"
                />
                <Text style={styles.radioText}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <View style={styles.totalWrapper}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>${totalPrice.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (loading || tripCart.length === 0) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={loading || tripCart.length === 0}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutText}>
              {paymentOption === 'now' ? 'Pay and Reserve' : 'Reserve without Payment'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// styles unchanged, can be copied from your original code or kept same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 0,
    color: '#222',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 140, // Leave room for footer
  },

  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 14,
    lineHeight: 20,
  },

  tripInfoText: {
    fontSize: 16,
    marginBottom: 6,
    color: '#555',
  },
  bold: {
    fontWeight: '700',
    color: '#222',
  },

  cartItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#ddd',
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    color: '#222',
  },
  lenderName: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  removeButton: {
    padding: 4,
  },

  clearCartButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  clearCartText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
  },

  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },

  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    fontSize: 16,
    paddingVertical: 20,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  totalWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    color: '#666',
    marginRight: 8,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007AFF',
  },

  checkoutButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 30,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  checkoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
