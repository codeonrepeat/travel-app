import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import StoryProgressBar from 'components/StoryProgressBar';

const STYLE_TAG_OPTIONS = [
  'Streetwear',
  'Vintage',
  'Minimalist',
  'Elegant',
  'Bold',
  'Casual',
  'Designer',
  'Boho',
  'Grunge',
  'Preppy',
  'Beachwear',
  'Resort Chic',
  'Formal',
  'Evening Wear',
  'Cocktail',
  'Outdoor Adventure',
  'Festival',
  'Travel Comfort',
  'Wedding Guest',
  'Cruise',
];

export default function Step2StyleTags({ navigation, route }) {
  const { profileData } = route.params;
  const [selectedTags, setSelectedTags] = useState(profileData.style_tags || []);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length < 5) {
        setSelectedTags([...selectedTags, tag]);
      } else {
        Alert.alert('Limit reached', 'You can select up to 5 style tags.');
      }
    }
  };

  const handleNext = () => {
    if (selectedTags.length === 0) {
      Alert.alert('Select at least one style tag to continue.');
      return;
    }

    navigation.navigate('Step3Location', {
      profileData: { ...profileData, style_tags: selectedTags },
    });
  };

  const handleSkip = () => {
    navigation.navigate('Step3Location', { profileData });
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header Row with Back and Skip */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, styles.skipText]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main container with padding */}
      <View style={styles.container}>
        {/* Progress Bar aligned with Step 1 */}
        <StoryProgressBar currentStep={2} totalSteps={5} />

        <Text style={styles.title}>Step 2: Pick Your Style Tags</Text>
        <Text style={styles.subtitle}>Select up to 5 tags that describe your personal style</Text>

        <ScrollView
          contentContainerStyle={styles.tagsContainer}
          showsVerticalScrollIndicator={false}>
          {STYLE_TAG_OPTIONS.map((tag) => {
            const selected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, selected && styles.tagSelected]}
                onPress={() => toggleTag(tag)}>
                <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[styles.button, selectedTags.length === 0 && { opacity: 0.5 }]}
          onPress={handleNext}
          disabled={selectedTags.length === 0}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'black', // same as Step 1
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  headerButton: {},
  headerButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  skipText: {
    color: '#6b7280',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 16,
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 24,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  tagText: {
    color: '#d1d5db',
  },
  tagTextSelected: {
    color: 'white',
  },
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
