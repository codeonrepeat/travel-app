// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
// import { useNavigation } from '@react-navigation/native';

// export default function SuccessScreen() {
//   const navigation = useNavigation();
//   const [pickupOption, setPickupOption] = useState('');

//   const pickupOptions = ['Meet in Person', 'Pickup at Locker', 'Hotel Delivery'];

//   const onConfirm = () => {
//     if (!pickupOption) {
//       Alert.alert('Please select a pickup option before proceeding.');
//       return;
//     }
//     Alert.alert(`${pickupOption} Confirmed`, `Enjoy Your Trip!`);
//     navigation.navigate('TransactionSummaryScreen');
//   };

//   return (
//     <SafeAreaView style={styles.safe}>
//       <View style={styles.container}>
//         <Text style={styles.title}>Payment Confirmed</Text>

//         <Text style={styles.subtitle}>Select a pickup option:</Text>

//         {pickupOptions.map((option) => (
//           <TouchableOpacity
//             key={option}
//             style={[styles.optionButton, pickupOption === option && styles.optionButtonSelected]}
//             onPress={() => setPickupOption(option)}>
//             <Text style={[styles.optionText, pickupOption === option && styles.optionTextSelected]}>
//               {option}
//             </Text>
//           </TouchableOpacity>
//         ))}

//         <TouchableOpacity style={styles.button} onPress={onConfirm}>
//           <Text style={styles.buttonText}>Confirm Pickup Option</Text>
//         </TouchableOpacity>

//         <View style={styles.dateContainer}>
//           <Text style={styles.dateLabel}>Rental Dates</Text>
//           <Text style={styles.dateText}></Text>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: {
//     flex: 1,
//     backgroundColor: 'white',
//   },
//   container: {
//     flex: 1,
//     padding: 24,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 24,
//     color: 'green',
//     fontWeight: 'bold',
//     marginBottom: 16,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#555',
//     textAlign: 'center',
//     marginBottom: 24,
//   },
//   optionButton: {
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//     borderRadius: 30,
//     borderWidth: 1,
//     borderColor: '#ccc',
//     marginBottom: 12,
//     width: '80%',
//     alignItems: 'center',
//   },
//   optionButtonSelected: {
//     backgroundColor: 'green',
//     borderColor: 'darkgreen',
//   },
//   optionText: {
//     fontSize: 16,
//     color: '#333',
//   },
//   optionTextSelected: {
//     color: 'white',
//     fontWeight: '600',
//   },
//   button: {
//     backgroundColor: 'green',
//     borderRadius: 30,
//     paddingVertical: 12,
//     paddingHorizontal: 28,
//     marginTop: 30,
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   dateContainer: {
//     alignItems: 'center',
//     marginTop: 40,
//   },
//   dateLabel: {
//     fontSize: 14,
//     color: '#888',
//     marginBottom: 4,
//   },
//   dateText: {
//     fontSize: 16,
//     color: '#333',
//     fontWeight: '500',
//   },
// });

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../utils/supabase'; // adjust path if needed

export default function SuccessScreen() {
  const navigation = useNavigation();
  const [pickupOption, setPickupOption] = useState('');

  const pickupOptions = ['Meet in Person', 'Pickup at Locker', 'Hotel Delivery'];

  const onConfirm = async () => {
    if (!pickupOption) {
      Alert.alert('Please select a pickup option before proceeding.');
      return;
    }

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert('Error fetching user.');
        return;
      }

      // Update borrow_request where borrower_id = current user and status = 'approved'
      const { error } = await supabase
        .from('borrow_requests')
        .update({
          pickup_requested: true,
          pickup_option: pickupOption, // only if pickup_option column exists
        })
        .eq('borrower_id', user.id)
        .eq('status', 'approved');

      if (error) {
        Alert.alert('Error updating pickup option:', error.message);
        return;
      }

      Alert.alert(`${pickupOption} Confirmed`, `Enjoy Your Trip!`);
      navigation.navigate('TransactionSummaryScreen');
    } catch (err) {
      Alert.alert('Unexpected error:', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Payment Confirmed</Text>

        <Text style={styles.subtitle}>Select a pickup option:</Text>

        {pickupOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.optionButton, pickupOption === option && styles.optionButtonSelected]}
            onPress={() => setPickupOption(option)}>
            <Text style={[styles.optionText, pickupOption === option && styles.optionTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.button} onPress={onConfirm}>
          <Text style={styles.buttonText}>Confirm Pickup Option</Text>
        </TouchableOpacity>

        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Rental Dates</Text>
          <Text style={styles.dateText}></Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: 'green',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    width: '80%',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: 'green',
    borderColor: 'darkgreen',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  button: {
    backgroundColor: 'green',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dateContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  dateLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});
