import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function Step4Sizing({ navigation, route }) {
  const { profileData } = route.params;

  const [topSize, setTopSize] = useState(profileData.top_size || '');
  const [bottomSize, setBottomSize] = useState(profileData.bottom_size || '');
  const [shoeSize, setShoeSize] = useState(profileData.shoe_size || '');

  const handleNext = () => {
    if (!topSize || !bottomSize || !shoeSize.trim()) {
      Alert.alert('Please fill in all size fields to continue.');
      return;
    }

    navigation.navigate('ProfileSummary', {
      profileData: {
        ...profileData,
        top_size: topSize,
        bottom_size: bottomSize,
        shoe_size: shoeSize.trim(),
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <ProgressBar currentStep={4} totalSteps={4} />

        <Text style={styles.title}>Step 4: Your Sizes</Text>
        <Text style={styles.subtitle}>Tell us your typical clothing sizes</Text>

        <Text style={styles.label}>Typical Top Size</Text>
        <View style={styles.sizeRow}>
          {SIZE_OPTIONS.map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.sizeBox, topSize === size && styles.sizeBoxSelected]}
              onPress={() => setTopSize(size)}>
              <Text style={[styles.sizeText, topSize === size && styles.sizeTextSelected]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Typical Bottom Size</Text>
        <View style={styles.sizeRow}>
          {SIZE_OPTIONS.map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.sizeBox, bottomSize === size && styles.sizeBoxSelected]}
              onPress={() => setBottomSize(size)}>
              <Text style={[styles.sizeText, bottomSize === size && styles.sizeTextSelected]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Typical Shoe Size</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 10.5 US Men"
          value={shoeSize}
          onChangeText={setShoeSize}
          keyboardType="default"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, !(topSize && bottomSize && shoeSize.trim()) && { opacity: 0.5 }]}
          disabled={!(topSize && bottomSize && shoeSize.trim())}
          onPress={handleNext}>
          <Text style={styles.buttonText}>Finish</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 24 },
  label: { fontSize: 14, color: '#444', marginTop: 16, marginBottom: 8 },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  sizeBox: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  sizeBoxSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  sizeText: {
    color: '#444',
    fontSize: 14,
  },
  sizeTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
