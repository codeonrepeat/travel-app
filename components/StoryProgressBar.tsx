import React from 'react';
import { View, StyleSheet } from 'react-native';

type StoryProgressBarProps = {
  currentStep: number;
  totalSteps: number;
};

export default function StoryProgressBar({ currentStep, totalSteps }: StoryProgressBarProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isFilled = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <View key={index} style={styles.segmentContainer}>
            <View
              style={[styles.segment, isFilled && styles.filled, isCurrent && styles.current]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  segmentContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'gray', // light gray background
    borderRadius: 4,
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
    width: '100%',
    backgroundColor: 'transparent',
  },
  filled: {
    backgroundColor: 'white', // green fill for completed steps
  },
  current: {
    backgroundColor: 'gray', // lighter green for current
  },
});
