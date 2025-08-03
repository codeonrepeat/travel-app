import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from 'utils/supabase';
import Header from 'components/Header';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LenderAvailabilitySection({ profileId, navigation }) {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  async function fetchAvailability() {
    const { data, error } = await supabase
      .from('lender_availability')
      .select('*')
      .eq('profile_id', profileId)
      .order('start_date', { ascending: true });

    if (!error) setAvailability(data);
  }

  async function addAvailability() {
    if (endDate < startDate) {
      Alert.alert('End date must be after start date.');
      return;
    }

    const { error } = await supabase.from('lender_availability').insert([
      {
        profile_id: profileId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      },
    ]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      fetchAvailability();
    }
  }

  async function deleteAvailability(id) {
    const { error } = await supabase.from('lender_availability').delete().eq('id', id);

    if (!error) fetchAvailability();
  }

  return (
    <SafeAreaView className="rounded-xl bg-white p-4 shadow">
      <Header
        title="My Unavailability"
        leftButton={
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="black" />
          </TouchableOpacity>
        }
      />

      <Text>Start Date:</Text>
      <DateTimePicker
        value={startDate}
        mode="date"
        onChange={(e, date) => setStartDate(date || startDate)}
      />

      <Text>End Date:</Text>
      <DateTimePicker
        value={endDate}
        mode="date"
        onChange={(e, date) => setEndDate(date || endDate)}
      />

      <Button title="Add Unavailability" onPress={addAvailability} />

      <FlatList
        className="mt-4"
        data={availability}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between border-b border-gray-200 py-2">
            <Text>
              {item.start_date} → {item.end_date}
            </Text>
            <Button title="Delete" color="red" onPress={() => deleteAvailability(item.id)} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
