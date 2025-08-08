import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

type RouteParams = {
  shirtSize: string;
  shirtCondition: string;
  lenderEmail: string;
  paymentDate: string; // existing: use requested_at or updated_at as payment proxy if needed
  // rentalStart and rentalEnd not in current schema — MOCK for now
};

export default function TransactionSummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { shirtSize, shirtCondition, lenderEmail, paymentDate } = (route.params ||
    {}) as RouteParams;

  // MOCK rental dates - replace when schema has these
  const rentalStart = 'TBD';
  const rentalEnd = 'TBD';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Transaction Summary</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          <Text style={styles.text}>Size: {shirtSize || 'N/A'}</Text>
          <Text style={styles.text}>Condition: {shirtCondition || 'N/A'}</Text>
          <Text style={styles.text}>Lender: {lenderEmail || 'N/A'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Text style={styles.text}>
            Paid on: {paymentDate ? new Date(paymentDate).toLocaleDateString() : 'N/A'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Period (MOCK)</Text>
          <Text style={styles.text}>
            {rentalStart} {' → '} {rentalEnd}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Care Instructions (MOCK)</Text>
          <Text style={styles.text}>
            - Wash with cold water{'\n'}- Do not bleach{'\n'}- Hang dry recommended{'\n'}- Iron on
            low heat if needed
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Return Instructions (MOCK)</Text>
          <Text style={styles.text}>
            Please return the item clean and in the same condition. Coordinate pickup or drop-off
            with the lender.
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => navigation.replace('RoleSelect')}>
          <Text style={styles.buttonText}>Back to My Items</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 8,
    color: '#333',
  },
  text: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  button: {
    marginTop: 30,
    backgroundColor: 'green',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
