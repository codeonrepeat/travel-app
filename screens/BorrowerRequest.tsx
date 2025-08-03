// import { useEffect, useState } from 'react';
// import {
//   SafeAreaView,
//   View,
//   Text,
//   FlatList,
//   Button,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import { supabase } from '../utils/supabase';

// type Request = {
//   id: string;
//   status: string;
//   requested_at: string;
//   shirt: { size: string; condition: string };
//   lender: { email: string };
// };

// export default function MyBorrowedItemsScreen() {
//   const [requests, setRequests] = useState<Request[]>([]);
//   const [loading, setLoading] = useState(false);

//   const fetchRequests = async () => {
//     setLoading(true);
//     const { data: userData, error: userError } = await supabase.auth.getUser();

//     if (userError || !userData.user) {
//       Alert.alert('Error', 'User not logged in.');
//       return;
//     }

//     const { data, error } = await supabase
//       .from('borrow_requests')
//       .select(
//         `
//         id,
//         status,
//         requested_at,
//         shirt:shirts(size, condition),
//         lender:profiles!fk_lender(email)
//       `
//       )
//       .eq('borrower_id', userData.user.id)
//       .order('requested_at', { ascending: false });

//     if (error) {
//       Alert.alert('Error fetching requests', error.message);
//     } else if (data) {
//       setRequests(data);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchRequests();
//   }, []);

//   const handleFakePayment = async (requestId: string) => {
//     const { error } = await supabase
//       .from('borrow_requests')
//       .update({ status: 'paid' })
//       .eq('id', requestId);

//     if (error) {
//       Alert.alert('Error', 'Could not update payment status.');
//     } else {
//       Alert.alert('Payment Successful', 'You have paid to borrow this item.');
//       fetchRequests(); // refresh list
//     }
//   };

//   const renderItem = ({ item }: { item: Request }) => (
//     <View style={styles.card}>
//       <Text style={styles.text}>Shirt Size: {item.shirt.size}</Text>
//       <Text style={styles.text}>Condition: {item.shirt.condition}</Text>
//       <Text style={styles.text}>Lender: {item.lender.email}</Text>
//       <Text style={styles.text}>Requested: {new Date(item.requested_at).toLocaleDateString()}</Text>
//       <Text style={styles.status}>Status: {item.status.toUpperCase()}</Text>

//       {item.status === 'approved' && (
//         <Button title="Pay to Borrow" onPress={() => handleFakePayment(item.id)} />
//       )}
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.safe}>
//       <Text style={styles.title}>My Borrowed Items</Text>
//       {loading ? (
//         <ActivityIndicator size="large" />
//       ) : (
//         <FlatList
//           data={requests}
//           keyExtractor={(item) => item.id}
//           renderItem={renderItem}
//           contentContainerStyle={styles.list}
//           ListEmptyComponent={<Text style={styles.text}>No borrow requests yet.</Text>}
//         />
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: 'white' },
//   title: { fontSize: 28, fontWeight: 'bold', padding: 20 },
//   list: { paddingHorizontal: 20 },
//   card: {
//     backgroundColor: '#f1f1f1',
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 15,
//   },
//   text: { fontSize: 16, marginBottom: 5 },
//   status: { fontWeight: 'bold', marginTop: 5 },
// });

import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../utils/supabase';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

type Request = {
  id: string;
  status: string;
  requested_at: string;
  shirt: { size: string; condition: string };
  lender: { email: string };
};

export default function MyBorrowedItemsScreen() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      Alert.alert('Error', 'User not logged in.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('borrow_requests')
      .select(
        `
        id,
        status,
        requested_at,
        shirt:shirts(size, condition),
        lender:profiles!fk_lender(email)
      `
      )
      .eq('borrower_id', userData.user.id)
      .order('requested_at', { ascending: false });

    if (error) {
      Alert.alert('Error fetching requests', error.message);
    } else if (data) {
      setRequests(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Navigate to FakePaymentScreen with requestId param
  const handleGoToFakePayment = (requestId: string) => {
    navigation.navigate('FakePaymentScreen', { requestId });
  };

  const renderItem = ({ item }: { item: Request }) => (
    <View style={styles.card}>
      <Text style={styles.text}>Shirt Size: {item.shirt.size}</Text>
      <Text style={styles.text}>Condition: {item.shirt.condition}</Text>
      <Text style={styles.text}>Lender: {item.lender.email}</Text>
      <Text style={styles.text}>Requested: {new Date(item.requested_at).toLocaleDateString()}</Text>
      <Text style={styles.status}>Status: {item.status.toUpperCase()}</Text>

      {item.status === 'approved' && (
        <Button title="Pay to Borrow" onPress={() => handleGoToFakePayment(item.id)} />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Text>BorrowerRequest.tsx</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingRight: 20,
        }}>
        <Text style={styles.title}>My Borrowed Items</Text>
        <MaterialIcons name="home" size={30} onPress={() => navigation.navigate('RoleSelect')} />
      </View>
      <Text style={{ alignSelf: 'center', margin: 20 }}>
        Here you will find your request status
      </Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.text}>No borrow requests yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  title: { fontSize: 28, fontWeight: 'bold', padding: 10 },
  list: { paddingHorizontal: 20 },
  card: {
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  text: { fontSize: 16, marginBottom: 5 },
  status: { fontWeight: 'bold', marginTop: 5 },
});
