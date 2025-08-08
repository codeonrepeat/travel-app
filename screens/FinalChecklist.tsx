import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { supabase } from 'utils/supabase';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const fallbackImage = 'https://via.placeholder.com/100';

const CHECKLIST_STEPS = [
  {
    step_key: 'clean_items',
    label: 'Clean all items',
    description: 'Ensure all wardrobe items are clean and fresh for the borrower.',
  },
  {
    step_key: 'pack_items',
    label: 'Pack items securely',
    description: 'Pack the items carefully to avoid damage during delivery.',
  },
  {
    step_key: 'confirm_location',
    label: 'Confirm delivery location',
    description: 'Verify the delivery address and arrange drop-off or pickup details.',
  },
  {
    step_key: 'contact_borrower',
    label: 'Contact borrower',
    description: 'Reach out to the borrower to coordinate delivery timing and details.',
  },
];

export default function FinalChecklistScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params;

  const [order, setOrder] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStepId, setUpdatingStepId] = useState(null);
  const [updatingReady, setUpdatingReady] = useState(false);

  useEffect(() => {
    fetchOrderAndChecklist();
  }, []);

  const fetchOrderAndChecklist = async () => {
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(
          `
          id,
          trip_city,
          start_date,
          end_date,
          delivery_method,
          status,
          borrower:profiles (
            username,
            avatar_url
          ),
          order_items (
            id,
            price,
            status,
            item:wardrobe_items (
              id,
              name,
              wardrobe_item_photos (
                photo_url
              )
            )
          )
        `
        )
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      let { data: checklistData, error: checklistError } = await supabase
        .from('order_checklist')
        .select('*')
        .eq('order_id', orderId);

      if (checklistError) throw checklistError;

      if (!checklistData || checklistData.length === 0) {
        const stepsToInsert = CHECKLIST_STEPS.map((step) => ({
          order_id: orderId,
          step_key: step.step_key,
          completed: false,
        }));
        const { error: insertError } = await supabase.from('order_checklist').insert(stepsToInsert);
        if (insertError) throw insertError;

        ({ data: checklistData, error: checklistError } = await supabase
          .from('order_checklist')
          .select('*')
          .eq('order_id', orderId));
        if (checklistError) throw checklistError;
      }

      setChecklist(checklistData);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = async (step) => {
    setUpdatingStepId(step.id);
    try {
      const { error } = await supabase
        .from('order_checklist')
        .update({ completed: !step.completed })
        .eq('id', step.id);

      if (error) throw error;

      setChecklist((prev) =>
        prev.map((s) => (s.id === step.id ? { ...s, completed: !step.completed } : s))
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setUpdatingStepId(null);
    }
  };

  const handleConfirmReady = async () => {
    const allCompleted = checklist.every((step) => step.completed);
    if (!allCompleted) {
      Alert.alert(
        'Incomplete Checklist',
        'Please complete all checklist steps before marking as ready.'
      );
      return;
    }

    setUpdatingReady(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      setOrder((prev) => ({ ...prev, status: 'ready' }));

      Alert.alert('Success', 'Order marked as Ready for Delivery.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setUpdatingReady(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Order not found.</Text>
      </SafeAreaView>
    );
  }

  const allCompleted = checklist.every((step) => step.completed);
  const isOrderReady = order.status === 'ready';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Final Checklist</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.saveExitButton}
          disabled={updatingReady}>
          <Text style={styles.saveExitText}>Save & Exit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.blurbContainer}>
          <Text style={styles.blurbText}>
            To ensure a smooth and successful delivery experience for you and the borrower, please
            carefully complete each step below. This checklist guides you through preparing the
            items, confirming details, and coordinating delivery. Once all steps are complete, you
            can mark the order as ready.
          </Text>
        </View>

        <FlatList
          data={order.order_items}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8 }}
          renderItem={({ item }) => {
            const photo = item.item?.wardrobe_item_photos?.[0]?.photo_url || fallbackImage;
            return (
              <View style={styles.itemRow}>
                <Image source={{ uri: photo }} style={styles.itemImageSmall} />
                <Text numberOfLines={1} style={styles.itemNameSmall}>
                  {item.item?.name || 'Unnamed'}
                </Text>
              </View>
            );
          }}
        />

        <Text style={styles.sectionTitle}>Checklist</Text>
        {checklist.map((step) => {
          const stepInfo = CHECKLIST_STEPS.find((s) => s.step_key === step.step_key);
          return (
            <TouchableOpacity
              key={step.id}
              style={[
                styles.checklistItem,
                step.completed ? styles.completedStep : styles.incompleteStep,
                updatingStepId === step.id && { opacity: 0.5 },
              ]}
              onPress={() => toggleStep(step)}
              disabled={updatingStepId === step.id || isOrderReady}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.checklistText, step.completed && styles.checklistTextCompleted]}>
                  {stepInfo?.label || step.step_key}
                </Text>
                {stepInfo?.description && (
                  <Text style={styles.stepDescription}>{stepInfo.description}</Text>
                )}
              </View>
              {step.completed ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <Text style={styles.checkmarkPlaceholder} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.orderInfoCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={styles.borrowerRow}>
            <Image
              source={{ uri: order.borrower?.avatar_url || fallbackImage }}
              style={styles.avatarSmall}
            />
            <Text style={styles.borrowerName}>{order.borrower?.username || 'Unknown'}</Text>
          </View>
          <View>
            <Text style={styles.cardText}>
              Trip: {new Date(order.start_date).toLocaleDateString()} →{' '}
              {new Date(order.end_date).toLocaleDateString()}
            </Text>
            <Text style={styles.cardText}>
              Delivery: {order.delivery_method || 'Not specified'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          isOrderReady
            ? { backgroundColor: '#4caf50' }
            : (!allCompleted || updatingReady) && styles.buttonDisabled,
        ]}
        onPress={handleConfirmReady}
        disabled={isOrderReady || !allCompleted || updatingReady}>
        {updatingReady ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isOrderReady ? 'Ready for Delivery' : 'Mark as Ready for Delivery'}
          </Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginLeft: 90,
  },
  saveExitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveExitText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  blurbContainer: {
    backgroundColor: '#eef6fd',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#a6c8ff',
  },
  blurbText: {
    fontSize: 14,
    color: '#33475b',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  completedStep: {
    backgroundColor: '#e6f9e9',
    borderColor: '#4caf50',
  },
  incompleteStep: {
    backgroundColor: '#fff',
  },
  checklistText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#4caf50',
  },
  stepDescription: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
  },
  checkmark: {
    fontSize: 22,
    color: '#4caf50',
    fontWeight: '700',
    marginLeft: 12,
  },
  checkmarkPlaceholder: {
    width: 22,
    marginLeft: 12,
  },
  button: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    zIndex: 20,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  orderInfoCard: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    zIndex: 15,
  },
  borrowerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  borrowerName: {
    fontWeight: '600',
    fontSize: 16,
  },
  cardText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  itemRow: {
    width: 60,
    marginLeft: 15,
    alignItems: 'center',
  },
  itemImageSmall: {
    width: 55,
    height: 55,
    borderRadius: 10,
    backgroundColor: '#ddd',
  },
  itemNameSmall: {
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 55,
  },
});
