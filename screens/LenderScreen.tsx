import { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from 'utils/supabase';
import { useNavigation } from '@react-navigation/native';

export default function LenderScreen() {
  const [size, setSize] = useState('');
  const [condition, setCondition] = useState('');
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!size || !condition) {
      Alert.alert('Please fill out all fields');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('shirts').insert({
      size,
      condition,
      lender_id: user.id,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSize('');
      setCondition('');
      navigation.navigate('RoleSelect');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Lend a Shirt</Text>

        <TextInput
          placeholder="Shirt Size (e.g., M, L)"
          value={size}
          onChangeText={setSize}
          style={styles.input}
        />

        <TextInput
          placeholder="Condition (e.g., Like new)"
          value={condition}
          onChangeText={setCondition}
          style={styles.input}
        />

        <Button title="Submit Shirt" onPress={handleSubmit} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
});
