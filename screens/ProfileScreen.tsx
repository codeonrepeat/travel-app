import { useEffect, useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Button,
  StyleSheet,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from 'utils/supabase';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigation = useNavigation();
  const [hasBorrowRequests, setHasBorrowRequests] = useState(false);
  return (
    <SafeAreaView>
      <Text>ProfileScreen.tsx</Text>
      {userEmail && <Text style={styles.userEmail}>Logged in as: {userEmail}</Text>}
      <View style={styles.header}>
        {/* <Text style={styles.title}>Available Shirts</Text> */}
        <Button title="Your Shirts" onPress={() => navigation.navigate('BorrowerRequest')} />
        {hasBorrowRequests && (
          <View style={styles.requestsButtonContainer}>
            <Button title="Requests" onPress={() => navigation.navigate('LenderRequestScreen')} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  userEmail: {
    fontSize: 14,
    color: 'gray',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  requestsButtonContainer: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 1,
  },
  filterLabel: { fontSize: 16, marginRight: 10 },
  picker: {
    flex: 1,
    ...Platform.select({
      android: { color: 'black' },
    }),
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchInput: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  list: { padding: 20 },
  card: {
    backgroundColor: '#f1f1f1',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  cardText: { fontSize: 16 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: 'black',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: 'white', fontSize: 28 },
});

export default ProfileScreen;
