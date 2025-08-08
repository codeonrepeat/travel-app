import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const Sizing = ({ selectedCategory, onSaveSize }) => {
  const [topSize, setTopSize] = useState('');
  const [bottomSize, setBottomSize] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [selectedGender, setSelectedGender] = useState('Male');

  const SIZE_OPTIONS_TOP_MALE = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const SIZE_OPTIONS_TOP_FEMALE = ['XS', 'S', 'M', 'L', 'XL'];

  const SIZE_OPTIONS_BOTTOM_MALE = ['28', '30', '32', '34', '36', '38', '40'];
  const SIZE_OPTIONS_BOTTOM_FEMALE = ['0', '2', '4', '6', '8', '10', '12'];

  const SIZE_OPTIONS_SHOES = ['6', '7', '8', '9', '10', '11', '12', '13', '14'];

  const SIZE_OPTIONS_OUTERWEAR_MALE = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const SIZE_OPTIONS_OUTERWEAR_FEMALE = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Clear sizes when category changes to avoid invalid leftover sizes
  useEffect(() => {
    setTopSize('');
    setBottomSize('');
    setShoeSize('');
  }, [selectedCategory]);

  const getSelectedSize = () => {
    switch (selectedCategory) {
      case 'Tops':
      case 'Outerwear': // outerwear uses topSize state
        return topSize;
      case 'Bottoms':
        return bottomSize;
      case 'Footwear':
        return shoeSize;
      default:
        return '';
    }
  };

  const renderSizeButtons = (options, selectedValue, onSelect) => (
    <View style={styles.sizeRow}>
      {options.map((size) => (
        <TouchableOpacity
          key={size}
          style={[styles.sizeBox, selectedValue === size && styles.sizeBoxSelected]}
          onPress={() => onSelect(size)}>
          <Text style={[styles.sizeText, selectedValue === size && styles.sizeTextSelected]}>
            {size}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSizeOptions = () => {
    if (selectedCategory === 'Tops') {
      const options = selectedGender === 'Male' ? SIZE_OPTIONS_TOP_MALE : SIZE_OPTIONS_TOP_FEMALE;
      return renderSizeButtons(options, topSize, setTopSize);
    } else if (selectedCategory === 'Bottoms') {
      const options =
        selectedGender === 'Male' ? SIZE_OPTIONS_BOTTOM_MALE : SIZE_OPTIONS_BOTTOM_FEMALE;
      return renderSizeButtons(options, bottomSize, setBottomSize);
    } else if (selectedCategory === 'Footwear') {
      return renderSizeButtons(SIZE_OPTIONS_SHOES, shoeSize, setShoeSize);
    } else if (selectedCategory === 'Outerwear') {
      const options =
        selectedGender === 'Male' ? SIZE_OPTIONS_OUTERWEAR_MALE : SIZE_OPTIONS_OUTERWEAR_FEMALE;
      return renderSizeButtons(options, topSize, setTopSize);
    }
    return null;
  };

  if (selectedCategory === 'Accessories') {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ fontStyle: 'italic', color: '#666', textAlign: 'center' }}>
          No sizing required for Accessories.
        </Text>
        <TouchableOpacity style={styles.saveButton} onPress={() => onSaveSize?.('')}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ padding: 16 }}>
      {/* Gender Toggle */}
      <View style={styles.tabRow}>
        {['Male', 'Female'].map((gender) => (
          <TouchableOpacity
            key={gender}
            style={[styles.tab, selectedGender === gender && styles.tabSelected]}
            onPress={() => setSelectedGender(gender)}>
            <Text style={[styles.tabText, selectedGender === gender && styles.tabTextSelected]}>
              {gender}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Size Picker */}
      {renderSizeOptions()}

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => {
          const selected = getSelectedSize();
          if (selected || selectedCategory === 'Accessories') {
            onSaveSize?.(selected);
          }
        }}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Sizing;

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  tabSelected: {
    backgroundColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#000',
  },
  tabTextSelected: {
    color: '#fff',
  },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  sizeBox: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  sizeBoxSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  sizeText: {
    fontSize: 14,
    color: '#000',
  },
  sizeTextSelected: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
