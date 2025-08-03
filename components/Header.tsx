import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Header({ title, leftButton = null, rightComponent = null }) {
  return (
    <View style={styles.header}>
      <View style={{ width: 34 }}>{leftButton || <View style={{ width: 34 }} />}</View>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 34 }}>{rightComponent}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
