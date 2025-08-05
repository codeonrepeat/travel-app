import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { supabase } from 'utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList from 'react-native-draggable-flatlist';
import DropDownPicker from 'react-native-dropdown-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const priceRanges = {
  Tops: '$5 – $10',
  Bottoms: '$7 – $15',
  Footwear: '$10 – $20',
  Outerwear: '$15 – $30',
  Accessories: '$3 – $10',
  Default: '$5 – $20',
};

const RENTAL_DAYS = 7;

export default function WardrobeBuilder({ route, navigation }) {
  const userId = route.params?.userId;
  const itemId = route.params?.itemId || null;

  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState(null);
  const [categoryItems, setCategoryItems] = useState([
    { label: 'Tops', value: 'Tops' },
    { label: 'Bottoms', value: 'Bottoms' },
    { label: 'Footwear', value: 'Footwear' },
    { label: 'Outerwear', value: 'Outerwear' },
    { label: 'Accessories', value: 'Accessories' },
  ]);

  const [conditionOpen, setConditionOpen] = useState(false);
  const [conditionValue, setConditionValue] = useState(null);
  const [conditionItems, setConditionItems] = useState([
    { label: 'New', value: 'New' },
    { label: 'Excellent', value: 'Excellent' },
    { label: 'Good', value: 'Good' },
    { label: 'Fair', value: 'Fair' },
    { label: 'Worn', value: 'Worn' },
  ]);

  const [pricePerDay, setPricePerDay] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    (async () => {
      try {
        setUploading(true);
        const { data: itemData, error: itemError } = await supabase
          .from('wardrobe_items')
          .select('*')
          .eq('id', itemId)
          .single();
        if (itemError) throw itemError;

        setName(itemData.name);
        setCategoryValue(itemData.category);
        setSize(itemData.size);
        setConditionValue(itemData.condition);
        setDescription(itemData.description);
        setPricePerDay(itemData.price_per_day.toString());

        const { data: photosData, error: photosError } = await supabase
          .from('wardrobe_item_photos')
          .select('photo_url')
          .eq('wardrobe_item_id', itemId);
        if (photosError) throw photosError;

        const photoAssets = photosData.map((p) => ({
          uri: p.photo_url,
          remote: true,
        }));
        setImages(photoAssets);
      } catch (error) {
        Alert.alert('Error loading item for editing', error.message);
      } finally {
        setUploading(false);
      }
    })();
  }, [itemId]);

  const estimatedEarnings = () => {
    const price = parseFloat(pricePerDay);
    if (isNaN(price)) return null;
    return (price * RENTAL_DAYS * 0.9).toFixed(2);
  };

  const pickImages = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      selectionLimit: 5 - images.length,
    });

    if (!result.canceled) {
      const newAssets = result.assets.slice(0, 5 - images.length);
      setImages((prev) => [...prev, ...newAssets]);
    }
  };

  const takePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 images.');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission denied', 'Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0]]);
    }
  };

  const uploadImage = async (itemId, asset) => {
    const fileExt = asset.uri.split('.').pop();
    const fileName = `${itemId}-${Date.now()}-${uuidv4()}.${fileExt}`;
    const filePath = fileName;

    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const buffer = Buffer.from(base64, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('wardrobe')
      .upload(filePath, buffer, {
        contentType: asset.mimeType || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from('wardrobe').getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const uploadAllImages = async (itemId, imagesToUpload) => {
    for (const asset of imagesToUpload) {
      const photoUrl = await uploadImage(itemId, asset);
      const { error: insertError } = await supabase.from('wardrobe_item_photos').insert({
        wardrobe_item_id: itemId,
        photo_url: photoUrl,
      });
      if (insertError) throw insertError;
    }
  };

  const handleSubmit = async () => {
    if (
      !name ||
      !categoryValue ||
      !conditionValue ||
      images.length === 0 ||
      !pricePerDay ||
      isNaN(parseFloat(pricePerDay))
    ) {
      Alert.alert('Missing Fields', 'Please fill all fields including a valid price and image.');
      return;
    }

    try {
      setUploading(true);

      let item;
      if (itemId) {
        const { data: updatedItem, error: updateError } = await supabase
          .from('wardrobe_items')
          .update({
            name,
            category: categoryValue,
            size,
            condition: conditionValue,
            description,
            price_per_day: parseFloat(pricePerDay),
          })
          .eq('id', itemId)
          .select()
          .single();
        if (updateError) throw updateError;
        item = updatedItem;
      } else {
        const { data: newItem, error: insertError } = await supabase
          .from('wardrobe_items')
          .insert({
            profile_id: userId,
            name,
            category: categoryValue,
            size,
            condition: conditionValue,
            description,
            price_per_day: parseFloat(pricePerDay),
          })
          .select()
          .single();
        if (insertError) throw insertError;
        item = newItem;
      }

      const newImages = images.filter((img) => !img.remote);
      await uploadAllImages(item.id, newImages);

      Alert.alert('Success', 'Wardrobe item and photos saved!', [
        {
          text: 'Add Another',
          onPress: () => {
            setName('');
            setCategoryValue(null);
            setSize('');
            setConditionValue(null);
            setDescription('');
            setPricePerDay('');
            setImages([]);
            if (itemId) navigation.goBack();
          },
        },
        {
          text: 'Go Back',
          onPress: () => navigation.goBack(),
          style: 'cancel',
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Header with Back Button and Title */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>{itemId ? 'Edit Wardrobe Item' : 'Add Wardrobe Item'}</Text>
          <View style={{ width: 28 }} /> {/* Placeholder for spacing */}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Image Upload Section */}
            <View style={styles.imageUploadRow}>
              <TouchableOpacity onPress={pickImages} style={styles.iconButton}>
                <MaterialCommunityIcons name="image-multiple" size={32} color="#555" />
              </TouchableOpacity>
              <TouchableOpacity onPress={takePhoto} style={styles.iconButton}>
                <MaterialCommunityIcons name="camera" size={32} color="#555" />
              </TouchableOpacity>
              <Text style={styles.imageCount}>{images.length} / 5 Images</Text>
            </View>

            {images.length === 0 && (
              <Text style={styles.hintText}>Add photos first — up to 5 images</Text>
            )}

            <DraggableFlatList
              horizontal
              data={images}
              keyExtractor={(_, index) => `image-${index}`}
              onDragEnd={({ data }) => setImages(data)}
              renderItem={({ item, index, drag }) => (
                <TouchableOpacity
                  onLongPress={drag}
                  style={styles.thumbnailWrapper}
                  disabled={uploading}>
                  <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                  <View style={styles.deleteIcon}>
                    <TouchableOpacity onPress={() => deleteImage(index)}>
                      <MaterialCommunityIcons name="close-circle" size={24} color="red" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingVertical: 10 }}
            />

            {/* Form Inputs */}
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <View style={{ zIndex: 3000, marginBottom: 16 }}>
              <DropDownPicker
                open={categoryOpen}
                value={categoryValue}
                items={categoryItems}
                setOpen={setCategoryOpen}
                setValue={setCategoryValue}
                setItems={setCategoryItems}
                placeholder="Select Category"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropDownContainer}
                containerStyle={{ height: 40 }}
                textStyle={{ fontSize: 14 }}
              />
            </View>

            <View style={{ zIndex: 2000, marginBottom: 16 }}>
              <DropDownPicker
                open={conditionOpen}
                value={conditionValue}
                items={conditionItems}
                setOpen={setConditionOpen}
                setValue={setConditionValue}
                setItems={setConditionItems}
                placeholder="Select Condition"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropDownContainer}
                containerStyle={{ height: 40 }}
                textStyle={{ fontSize: 14 }}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Size"
              value={size}
              onChangeText={setSize}
              autoCapitalize="characters"
            />

            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Description"
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <TextInput
              style={styles.input}
              placeholder="Price Per Day (e.g. 15)"
              value={pricePerDay}
              onChangeText={setPricePerDay}
              keyboardType="numeric"
            />

            {/* <Text style={styles.tipText}>
              Suggested price range for {categoryValue || 'this category'}:{' '}
              {priceRanges[categoryValue] || priceRanges.Default}
            </Text> */}
            <Text style={styles.tipText}>
              {`Suggested price range for ${categoryValue || 'this category'}: ${
                priceRanges[categoryValue] || priceRanges.Default
              }`}
            </Text>

            {estimatedEarnings() && (
              <Text style={styles.earningsText}>
                Estimated Earnings: ${estimatedEarnings()} for a {RENTAL_DAYS}-day rental (after 10%
                fee)
              </Text>
            )}

            {uploading ? (
              <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : (
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitText}>{itemId ? 'Save Changes' : 'Save Item'}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 6,
  },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  dropdown: {
    backgroundColor: '#fafafa',
    borderColor: '#ccc',
  },
  dropDownContainer: {
    backgroundColor: '#fafafa',
    borderColor: '#ccc',
  },
  imageUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 6,
  },
  iconButton: {
    padding: 6,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginRight: 10,
  },
  imageCount: {
    fontSize: 14,
    color: '#333',
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  thumbnailWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  deleteIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: 'black',
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
  },
  submitText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    marginTop: -10,
  },
  earningsText: {
    fontSize: 13,
    color: 'green',
    marginBottom: 16,
  },
});
