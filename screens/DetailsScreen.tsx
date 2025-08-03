import { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../utils/supabase';

type Shirt = {
  id: string;
  size: string;
  condition: string;
  profiles?: { email: string; id?: string }; // lender info (email + id)
};

export default function DetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { shirt }: { shirt: Shirt } = route.params;

  const [loading, setLoading] = useState(false);

  const handleRequestBorrow = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Error', 'You must be logged in to request a shirt.');
      setLoading(false);
      return;
    }

    try {
      // Correct lender_id: use shirt.profiles.id (the lender), fallback only for safety
      const { error } = await supabase.from('borrow_requests').insert([
        {
          shirt_id: shirt.id,
          lender_id: shirt.profiles?.id || user.id, // lender = shirt owner
          borrower_id: user.id, // borrower = current user
          status: 'pending',
          requested_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Success',
          'Borrow request sent! You will be notified when the lender approves or denies your request'
        );
        navigation.navigate('BorrowerRequest');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Shirt Details</Text>
        <Text style={styles.label}>Size:</Text>
        <Text style={styles.value}>{shirt.size}</Text>
        <Text style={styles.label}>Condition:</Text>
        <Text style={styles.value}>{shirt.condition}</Text>
        <Text style={styles.label}>Lender Email:</Text>
        <Text style={styles.value}>{shirt.profiles?.email || 'Unknown'}</Text>

        <View style={{ marginTop: 30 }}>
          <Button
            title={loading ? 'Sending Request...' : 'Request to Borrow'}
            onPress={handleRequestBorrow}
            disabled={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  container: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 18, fontWeight: '600', marginTop: 10 },
  value: { fontSize: 18 },
});
