import { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../utils/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

type Request = {
  id: string;
  status: string;
  requested_at: string;
  shirt: {
    id: string;
    size: string;
    condition: string;
    created_at: string;
  };
  borrower: {
    email: string;
  };
};

export default function LenderRequestsScreen() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const fetchRequests = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('borrow_requests')
      .select(
        `
        id,
        status,
        requested_at,
        shirt:shirts(id, size, condition, created_at),
        borrower:profiles!borrower_id(email)
      `
      )
      .eq('lender_id', user?.id)
      .order('requested_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  };

  const updateRequestStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('borrow_requests').update({ status }).eq('id', id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      fetchRequests();
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const renderItem = ({ item }: { item: Request }) => (
    <View style={styles.card}>
      <Text style={styles.text}>Shirt Size: {item.shirt.size}</Text>
      <Text style={styles.text}>Condition: {item.shirt.condition}</Text>
      <Text style={styles.text}>
        Posted: {new Date(item.shirt.created_at).toLocaleDateString()}
      </Text>
      <Text style={styles.text}>Borrower: {item.borrower.email}</Text>
      <Text style={styles.text}>Status: {item.status}</Text>

      {item.status === 'pending' && (
        <View style={styles.buttonRow}>
          <Button title="Approve" onPress={() => updateRequestStatus(item.id, 'approved')} />
          <Button
            title="Reject"
            color="red"
            onPress={() => updateRequestStatus(item.id, 'rejected')}
          />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingRight: 20,
        }}>
        <Text style={styles.title}>Borrow Requests</Text>
        <MaterialIcons name="home" size={30} onPress={() => navigation.navigate('RoleSelect')} />
      </View>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchRequests}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.text}>No requests found.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  title: { fontSize: 28, fontWeight: 'bold', padding: 20 },
  list: { paddingHorizontal: 20 },
  card: {
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  text: { fontSize: 16, marginBottom: 5 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
});

// import { useEffect, useState } from 'react';
// import { SafeAreaView, View, Text, FlatList, Button, StyleSheet, Alert } from 'react-native';
// import { supabase } from '../utils/supabase';
// import { MaterialIcons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';

// type Request = {
//   id: string;
//   status: string;
//   requested_at: string;
//   pickup_requested: boolean; // new field
//   shirt: {
//     id: string;
//     size: string;
//     condition: string;
//     created_at: string;
//   };
//   borrower: {
//     email: string;
//   };
// };

// export default function LenderRequestsScreen() {
//   const [requests, setRequests] = useState<Request[]>([]);
//   const [loading, setLoading] = useState(false);
//   const navigation = useNavigation();

//   const fetchRequests = async () => {
//     setLoading(true);

//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     const { data, error } = await supabase
//       .from('borrow_requests')
//       .select(
//         `
//         id,
//         status,
//         requested_at,
//         pickup_requested,
//         shirt:shirts(id, size, condition, created_at),
//         borrower:profiles!borrower_id(email)
//       `
//       )
//       .eq('lender_id', user?.id)
//       .order('requested_at', { ascending: false });

//     if (error) {
//       Alert.alert('Error', error.message);
//     } else {
//       setRequests(data || []);
//     }

//     setLoading(false);
//   };

//   const updateRequestStatus = async (
//     id: string,
//     status: 'approved' | 'rejected' | 'borrowed' | 'returned'
//   ) => {
//     const { error } = await supabase.from('borrow_requests').update({ status }).eq('id', id);

//     if (error) {
//       Alert.alert('Error', error.message);
//     } else {
//       fetchRequests();
//     }
//   };

//   useEffect(() => {
//     fetchRequests();
//   }, []);

//   const renderItem = ({ item }: { item: Request }) => (
//     <View style={styles.card}>
//       <Text style={styles.text}>Shirt Size: {item.shirt.size}</Text>
//       <Text style={styles.text}>Condition: {item.shirt.condition}</Text>
//       <Text style={styles.text}>
//         Posted: {new Date(item.shirt.created_at).toLocaleDateString()}
//       </Text>
//       <Text style={styles.text}>Borrower: {item.borrower.email}</Text>
//       <Text style={styles.text}>Status: {item.status}</Text>

//       {item.status === 'pending' && (
//         <View style={styles.buttonRow}>
//           <Button title="Approve" onPress={() => updateRequestStatus(item.id, 'approved')} />
//           <Button
//             title="Reject"
//             color="red"
//             onPress={() => updateRequestStatus(item.id, 'rejected')}
//           />
//         </View>
//       )}

//       {item.status === 'approved' && (
//         <>
//           <Text style={styles.text}>Pickup Requested: {item.pickup_requested ? 'Yes' : 'No'}</Text>

//           {item.pickup_requested && (
//             <Button
//               title="Confirm Pickup"
//               onPress={() => updateRequestStatus(item.id, 'borrowed')}
//             />
//           )}
//         </>
//       )}

//       {item.status === 'borrowed' && (
//         <Button title="Mark as Returned" onPress={() => updateRequestStatus(item.id, 'returned')} />
//       )}

//       {item.status === 'returned' && (
//         <Text style={styles.text}>Item has been returned and is now available again.</Text>
//       )}
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.safe}>
//       <Text>LenderRequestScreen.tsx</Text>
//       <View
//         style={{
//           flexDirection: 'row',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           paddingRight: 20,
//         }}>
//         <Text style={styles.title}>Borrow Requests</Text>
//         <MaterialIcons name="home" size={30} onPress={() => navigation.navigate('RoleSelect')} />
//       </View>
//       <FlatList
//         data={requests}
//         keyExtractor={(item) => item.id}
//         renderItem={renderItem}
//         refreshing={loading}
//         onRefresh={fetchRequests}
//         contentContainerStyle={styles.list}
//         ListEmptyComponent={<Text style={styles.text}>No requests found.</Text>}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: 'white' },
//   title: { fontSize: 28, fontWeight: 'bold', padding: 20 },
//   list: { paddingHorizontal: 20 },
//   card: {
//     backgroundColor: '#eee',
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 15,
//   },
//   text: { fontSize: 16, marginBottom: 5 },
//   buttonRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginTop: 10,
//   },
// });

// import { useEffect, useState } from 'react';
// import { SafeAreaView, View, Text, FlatList, Button, StyleSheet, Alert } from 'react-native';
// import { supabase } from '../utils/supabase';
// import { MaterialIcons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';

// type Request = {
//   id: string;
//   status: string;
//   requested_at: string;
//   pickup_requested: boolean;
//   pickup_option: string | null; // new field
//   shirt: {
//     id: string;
//     size: string;
//     condition: string;
//     created_at: string;
//   };
//   borrower: {
//     email: string;
//   };
// };

// export default function LenderRequestsScreen() {
//   const [requests, setRequests] = useState<Request[]>([]);
//   const [loading, setLoading] = useState(false);
//   const navigation = useNavigation();

//   const fetchRequests = async () => {
//     setLoading(true);

//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     const { data, error } = await supabase
//       .from('borrow_requests')
//       .select(
//         `
//         id,
//         status,
//         requested_at,
//         pickup_requested,
//         pickup_option,
//         shirt:shirts(id, size, condition, created_at),
//         borrower:profiles!borrower_id(email)
//       `
//       )
//       .eq('lender_id', user?.id)
//       .order('requested_at', { ascending: false });

//     if (error) {
//       Alert.alert('Error', error.message);
//     } else {
//       setRequests(data || []);
//     }

//     setLoading(false);
//   };

//   const updateRequestStatus = async (
//     id: string,
//     status: 'approved' | 'rejected' | 'borrowed' | 'returned'
//   ) => {
//     const { error } = await supabase.from('borrow_requests').update({ status }).eq('id', id);

//     if (error) {
//       Alert.alert('Error', error.message);
//     } else {
//       fetchRequests();
//     }
//   };

//   useEffect(() => {
//     fetchRequests();
//   }, []);

//   const renderItem = ({ item }: { item: Request }) => (
//     <View style={styles.card}>
//       <Text style={styles.text}>Shirt Size: {item.shirt.size}</Text>
//       <Text style={styles.text}>Condition: {item.shirt.condition}</Text>
//       <Text style={styles.text}>
//         Posted: {new Date(item.shirt.created_at).toLocaleDateString()}
//       </Text>
//       <Text style={styles.text}>Borrower: {item.borrower.email}</Text>
//       <Text style={styles.text}>Status: {item.status}</Text>

//       {item.status === 'pending' && (
//         <View style={styles.buttonRow}>
//           <Button title="Approve" onPress={() => updateRequestStatus(item.id, 'approved')} />
//           <Button
//             title="Reject"
//             color="red"
//             onPress={() => updateRequestStatus(item.id, 'rejected')}
//           />
//         </View>
//       )}

//       {item.status === 'approved' && (
//         <>
//           <Text style={styles.text}>Pickup Requested: {item.pickup_requested ? 'Yes' : 'No'}</Text>

//           {item.pickup_requested && (
//             <>
//               <Text style={styles.text}>
//                 Pickup Option: {item.pickup_option || 'Not specified'}
//               </Text>
//               <Button
//                 title="Confirm Pickup"
//                 onPress={() => updateRequestStatus(item.id, 'borrowed')}
//               />
//             </>
//           )}
//         </>
//       )}

//       {item.status === 'borrowed' && (
//         <Button title="Mark as Returned" onPress={() => updateRequestStatus(item.id, 'returned')} />
//       )}

//       {item.status === 'returned' && (
//         <Text style={styles.text}>Item has been returned and is now available again.</Text>
//       )}
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.safe}>
//       <Text>LenderRequestScreen.tsx</Text>
//       <View
//         style={{
//           flexDirection: 'row',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           paddingRight: 20,
//         }}>
//         <Text style={styles.title}>Borrow Requests</Text>
//         <MaterialIcons name="home" size={30} onPress={() => navigation.navigate('RoleSelect')} />
//       </View>
//       <FlatList
//         data={requests}
//         keyExtractor={(item) => item.id}
//         renderItem={renderItem}
//         refreshing={loading}
//         onRefresh={fetchRequests}
//         contentContainerStyle={styles.list}
//         ListEmptyComponent={<Text style={styles.text}>No requests found.</Text>}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: 'white' },
//   title: { fontSize: 28, fontWeight: 'bold', padding: 20 },
//   list: { paddingHorizontal: 20 },
//   card: {
//     backgroundColor: '#eee',
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 15,
//   },
//   text: { fontSize: 16, marginBottom: 5 },
//   buttonRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginTop: 10,
//   },
// });
