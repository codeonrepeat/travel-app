// import React, { useState } from 'react';
// import { SafeAreaView, View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

// export default function FakePaymentScreen({ route, navigation }) {
//   const { amount, requestId } = route.params;
//   const [cardNumber, setCardNumber] = useState('');
//   const [expiry, setExpiry] = useState('');
//   const [cvc, setCvc] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleFakePay = async () => {
//     setLoading(true);

//     // Simulate network delay
//     setTimeout(() => {
//       setLoading(false);

//       if (cardNumber.length === 16 && expiry && cvc.length >= 3) {
//         Alert.alert('Payment successful!');
//         // Here you can update Supabase request status to 'paid' if you want
//         // For now, just go back or navigate somewhere
//         navigation.goBack();
//       } else {
//         Alert.alert('Payment failed', 'Please enter valid card details');
//       }
//     }, 1500);
//   };

//   return (
//     <SafeAreaView style={styles.safe}>
//       <View style={styles.container}>
//         <Text style={styles.title}>Fake Payment</Text>
//         <Text style={styles.amount}>Amount: ${(amount / 100).toFixed(2)}</Text>

//         <TextInput
//           placeholder="Card Number"
//           keyboardType="number-pad"
//           maxLength={16}
//           value={cardNumber}
//           onChangeText={setCardNumber}
//           style={styles.input}
//         />
//         <TextInput
//           placeholder="Expiry MM/YY"
//           value={expiry}
//           onChangeText={setExpiry}
//           style={styles.input}
//         />
//         <TextInput
//           placeholder="CVC"
//           keyboardType="number-pad"
//           maxLength={4}
//           value={cvc}
//           onChangeText={setCvc}
//           style={styles.input}
//           secureTextEntry
//         />

//         <Button
//           title={loading ? 'Processing...' : 'Pay Now'}
//           onPress={handleFakePay}
//           disabled={loading}
//         />
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: 'white' },
//   container: { padding: 20, flex: 1, justifyContent: 'center' },
//   title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
//   amount: { fontSize: 22, marginBottom: 30, textAlign: 'center' },
//   input: {
//     borderColor: '#ccc',
//     borderWidth: 1,
//     borderRadius: 6,
//     padding: 12,
//     marginBottom: 15,
//     fontSize: 18,
//   },
// });

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';

export default function FakePaymentScreen({ route, navigation }) {
  const { requestId } = route.params;
  const [cardNumber, setCardNumber] = useState('');

  const handlePay = () => {
    Alert.alert('Payment processed for request ' + requestId);
    navigation.replace('SuccessScreen');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Fake Payment</Text>
          <TextInput
            style={styles.input}
            placeholder="Card Number"
            keyboardType="number-pad"
            value={cardNumber}
            onChangeText={setCardNumber}
            maxLength={16}
          />
          <Button title="Pay" onPress={handlePay} />
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 18,
  },
});
