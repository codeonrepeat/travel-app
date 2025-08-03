// import React, { useState } from 'react';
// import {
//   SafeAreaView,
//   FlatList,
//   View,
//   Text,
//   Image,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// export default function WardrobeItemDetails({ route, navigation }) {
//   const { item } = route.params;
//   const [added, setAdded] = useState(false);

//   const handleAdd = () => {
//     setAdded(true);
//     // TODO: Hook into global state or trip logic
//     console.log('Item added:', item.id);
//   };

//   const photos = item.allPhotos?.length > 0 ? item.allPhotos : [];

//   return (
//     <SafeAreaView style={styles.container}>
//       <Text>WardrobeItemDetails.tsx</Text>
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         {/* Back to wardrobe */}
//         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//           <Ionicons name="chevron-back" size={24} color="#000" />
//           <Text style={styles.backText}>Back to wardrobe</Text>
//         </TouchableOpacity>

//         {/* Item Name */}
//         <Text style={styles.title}>{item.name}</Text>

//         {/* Horizontal Image Carousel */}
//         <FlatList
//           data={photos}
//           horizontal
//           keyExtractor={(uri, index) => `${uri}-${index}`}
//           renderItem={({ item: photoUrl }) => (
//             <Image source={{ uri: photoUrl }} style={styles.photo} />
//           )}
//           ListEmptyComponent={
//             <View style={styles.photoPlaceholder}>
//               <Text style={styles.photoPlaceholderText}>No images available</Text>
//             </View>
//           }
//           showsHorizontalScrollIndicator={false}
//           style={styles.photoList}
//         />

//         {/* Info Section */}
//         <View style={styles.infoContainer}>
//           <Text style={styles.label}>Category</Text>
//           <Text style={styles.value}>{item.category || '-'}</Text>

//           <Text style={styles.label}>Size</Text>
//           <Text style={styles.value}>{item.size || '-'}</Text>

//           <Text style={styles.label}>Condition</Text>
//           <Text style={styles.value}>{item.condition || '-'}</Text>

//           <Text style={styles.label}>Description</Text>
//           <Text style={styles.value}>{item.description || 'No description provided.'}</Text>

//           {/* Optional: Price */}
//           {item.price && (
//             <>
//               <Text style={styles.label}>Price</Text>
//               <Text style={styles.value}>${item.price}</Text>
//             </>
//           )}

//           {/* Optional: Date Range */}
//           {item.available_from && (
//             <>
//               <Text style={styles.label}>Available</Text>
//               <Text style={styles.value}>
//                 {new Date(item.available_from).toLocaleDateString()} →{' '}
//                 {item.available_to ? new Date(item.available_to).toLocaleDateString() : 'Open'}
//               </Text>
//             </>
//           )}
//         </View>
//       </ScrollView>

//       {/* Add/Added Button */}
//       <View style={styles.footer}>
//         <TouchableOpacity
//           style={[styles.addButton, added && styles.addedButton]}
//           onPress={handleAdd}
//           disabled={added}>
//           <Text style={styles.addButtonText}>{added ? '✓ Added' : '＋ Add'}</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff' },
//   scrollContent: { padding: 20, paddingBottom: 100 },

//   backButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   backText: {
//     marginLeft: 4,
//     fontSize: 16,
//     color: '#007AFF',
//     fontWeight: '500',
//   },

//   title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },

//   photoList: { marginBottom: 20 },
//   photo: {
//     width: 280,
//     height: 280,
//     borderRadius: 12,
//     marginRight: 15,
//     backgroundColor: '#eee',
//   },
//   photoPlaceholder: {
//     width: 280,
//     height: 280,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f4f4f4',
//     borderRadius: 12,
//   },
//   photoPlaceholderText: {
//     color: '#888',
//     fontStyle: 'italic',
//   },

//   infoContainer: { marginTop: 10 },
//   label: { fontWeight: 'bold', fontSize: 16, marginTop: 14 },
//   value: { fontSize: 16, color: '#444', marginTop: 4 },

//   footer: {
//     position: 'absolute',
//     bottom: 45,
//     left: 20,
//     right: 20,
//   },
//   addButton: {
//     backgroundColor: '#000',
//     paddingVertical: 14,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   addedButton: {
//     backgroundColor: '#444',
//   },
//   addButtonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
// });

// Displays wardrobe item details with images and metadata.
// Allows add/remove from global trip cart via TripCartContext.
import React from 'react';
import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTripCart } from 'context/TripCartContext'; // adjust path as needed

export default function WardrobeItemDetails({ route, navigation }) {
  const { item } = route.params;
  const { tripCart, addToCart, removeFromCart } = useTripCart();

  const photos = item.allPhotos?.length > 0 ? item.allPhotos : [];

  const isInCart = tripCart.some((i) => i.id === item.id);

  const handleAddToggle = () => {
    if (isInCart) {
      removeFromCart(item.id);
    } else {
      addToCart({
        ...item,
        lender_id: item.profile?.id,
        lender_name: item.profile?.username || 'Unknown',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* KEEP THIS TEXT TO TRACK SCREEN */}
      <Text>WardrobeItemDetails.tsx</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back to wardrobe */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
          <Text style={styles.backText}>Back to wardrobe</Text>
        </TouchableOpacity>

        {/* Item Name */}
        <Text style={styles.title}>{item.name}</Text>

        {/* Horizontal Image Carousel */}
        <FlatList
          data={photos}
          horizontal
          keyExtractor={(uri, index) => `${uri}-${index}`}
          renderItem={({ item: photoUrl }) => (
            <Image source={{ uri: photoUrl }} style={styles.photo} />
          )}
          ListEmptyComponent={
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>No images available</Text>
            </View>
          }
          showsHorizontalScrollIndicator={false}
          style={styles.photoList}
        />

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>{item.category || '-'}</Text>

          <Text style={styles.label}>Size</Text>
          <Text style={styles.value}>{item.size || '-'}</Text>

          <Text style={styles.label}>Condition</Text>
          <Text style={styles.value}>{item.condition || '-'}</Text>

          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{item.description || 'No description provided.'}</Text>

          {/* Price per Day */}
          {item.price_per_day !== undefined && item.price_per_day !== null && (
            <>
              <Text style={styles.label}>Price per day</Text>
              <Text style={styles.value}>${item.price_per_day} / day</Text>
            </>
          )}

          {/* Optional: Date Range */}
          {item.available_from && (
            <>
              <Text style={styles.label}>Available</Text>
              <Text style={styles.value}>
                {new Date(item.available_from).toLocaleDateString()} →{' '}
                {item.available_to ? new Date(item.available_to).toLocaleDateString() : 'Open'}
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      {/* Add/Added Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addButton, isInCart && styles.addedButton]}
          onPress={handleAddToggle}>
          <Text style={styles.addButtonText}>{isInCart ? '✓ Added' : '＋ Add'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 100 },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    marginLeft: 4,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },

  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },

  photoList: { marginBottom: 20 },
  photo: {
    width: 280,
    height: 280,
    borderRadius: 12,
    marginRight: 15,
    backgroundColor: '#eee',
  },
  photoPlaceholder: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    borderRadius: 12,
  },
  photoPlaceholderText: {
    color: '#888',
    fontStyle: 'italic',
  },

  infoContainer: { marginTop: 10 },
  label: { fontWeight: 'bold', fontSize: 16, marginTop: 14 },
  value: { fontSize: 16, color: '#444', marginTop: 4 },

  footer: {
    position: 'absolute',
    bottom: 45,
    left: 20,
    right: 20,
  },
  addButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addedButton: {
    backgroundColor: '#444',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
