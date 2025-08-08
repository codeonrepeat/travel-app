// import React, { useState } from 'react';
// import { StyleSheet, View, TextInput, Text, TouchableOpacity, SafeAreaView } from 'react-native';
// import { supabase } from 'utils/supabase';

// export default function AuthScreen({ navigation }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');

//   // Check profile completeness including avatar_url
//   async function checkUserProfile() {
//     const {
//       data: { user },
//       error: userError,
//     } = await supabase.auth.getUser();
//     if (userError || !user) return false;

//     const { data: profile, error: profileError } = await supabase
//       .from('profiles')
//       .select('username, bio, avatar_url')
//       .eq('id', user.id)
//       .single();

//     if (profileError || !profile) return false;

//     return Boolean(profile.username?.trim() && profile.bio?.trim() && profile.avatar_url?.trim());
//   }

//   const signIn = async () => {
//     const { error } = await supabase.auth.signInWithPassword({ email, password });
//     if (error) return setError(error.message);

//     const profileComplete = await checkUserProfile();

//     if (profileComplete) {
//       navigation.navigate('RoleSelect');
//     } else {
//       navigation.navigate('Onboarding');
//     }
//   };

//   // const signUp = async () => {
//   //   const { data, error } = await supabase.auth.signUp({ email, password });
//   //   if (error) return setError(error.message);

//   //   // Insert profile immediately
//   //   await supabase.from('profiles').insert({ id: data.user.id, email });

//   //   // Wait for auth session to become active
//   //   const {
//   //     data: { session },
//   //   } = await supabase.auth.getSession();

//   //   if (!session) {
//   //     // You could show a message or redirect to sign in
//   //     return setError('Please check your email to confirm your account before logging in.');
//   //   }

//   //   const profileComplete = await checkUserProfile();

//   //   if (profileComplete) {
//   //     navigation.navigate('RoleSelect');
//   //   } else {
//   //     navigation.navigate('ProfileSetup');
//   //   }
//   // };

//   const signUp = async () => {
//     const { data, error } = await supabase.auth.signUp({ email, password });

//     if (error) return setError(error.message);

//     await supabase.from('profiles').insert({ id: data.user.id, email });

//     // Use session from signUp response (may be null if confirmation required)
//     const session = data.session;

//     if (!session) {
//       return setError('Please check your email to confirm your account before logging in.');
//     }

//     const profileComplete = await checkUserProfile();

//     if (profileComplete) {
//       navigation.navigate('RoleSelect');
//     } else {
//       navigation.navigate('Onboarding');
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <Text>AuthScreen.tsx</Text>
//       <View style={styles.header}>
//         <Text style={styles.title}>Welcome</Text>
//         <Text style={styles.subtitle}>Sign in or create an account to get started</Text>
//       </View>

//       <View style={styles.form}>
//         <View>
//           <Text style={styles.label}>Email</Text>
//           <TextInput
//             style={styles.input}
//             onChangeText={setEmail}
//             value={email}
//             autoCapitalize="none"
//             keyboardType="email-address"
//             placeholder="you@example.com"
//           />
//         </View>

//         <View>
//           <Text style={styles.label}>Password</Text>
//           <TextInput
//             style={styles.input}
//             onChangeText={setPassword}
//             value={password}
//             secureTextEntry
//             placeholder="Enter your password"
//           />
//         </View>

//         {error ? <Text style={styles.error}>{error}</Text> : null}

//         <TouchableOpacity style={styles.signInBtn} onPress={signIn}>
//           <Text style={styles.signInText}>Sign In</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.signUpBtn} onPress={signUp}>
//           <Text style={styles.signUpText}>Sign Up</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     margin: 25,
//     paddingHorizontal: 32,
//     paddingVertical: 24,
//     justifyContent: 'center',
//   },
//   header: {
//     marginBottom: 40,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     color: '#1f2937',
//   },
//   subtitle: {
//     fontSize: 16,
//     textAlign: 'center',
//     color: '#6b7280',
//     marginTop: 8,
//   },
//   form: {
//     gap: 16,
//   },
//   label: {
//     color: '#374151',
//     marginBottom: 4,
//     fontSize: 14,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#d1d5db',
//     borderRadius: 16,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#111827',
//   },
//   error: {
//     color: '#dc2626',
//     fontSize: 14,
//     textAlign: 'center',
//     marginTop: 8,
//   },
//   signInBtn: {
//     backgroundColor: '#22c55e',
//     borderRadius: 9999,
//     paddingVertical: 12,
//     marginTop: 16,
//   },
//   signInText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: 16,
//     textAlign: 'center',
//   },
//   signUpBtn: {
//     borderWidth: 1,
//     borderColor: '#d1d5db',
//     borderRadius: 9999,
//     paddingVertical: 12,
//     marginTop: 8,
//   },
//   signUpText: {
//     color: '#374151',
//     fontWeight: '600',
//     fontSize: 16,
//     textAlign: 'center',
//   },
// });

import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  TouchableWithoutFeedback,
} from '@gorhom/bottom-sheet';
import { supabase } from 'utils/supabase';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Header from 'components/Header';

function SignUpContent({ onSuccess, onCancel, navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function checkUserProfile() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return false;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, bio, avatar_url')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) return false;

    return Boolean(profile.username?.trim() && profile.bio?.trim() && profile.avatar_url?.trim());
  }

  const signUp = async () => {
    setError('');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setError(error.message);

    await supabase.from('profiles').insert({ id: data.user.id, email });

    const session = data.session;

    if (!session) {
      return setError('Please check your email to confirm your account before logging in.');
    }

    setTimeout(async () => {
      const profileComplete = await checkUserProfile();

      if (profileComplete) {
        navigation.navigate('RoleSelect');
      } else {
        navigation.navigate('Onboarding');
      }

      onSuccess(); // closes modal
    }, 5000); // ⏳ 1 second wait
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <View style={{ height: 905, padding: 20 }}>
            <Header
              title="Create Account"
              leftButton={
                <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
                  <Text style={styles.closeText}>Cancel</Text>
                </TouchableOpacity>
              }
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              onChangeText={setEmail}
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#aaa"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              onChangeText={setPassword}
              value={password}
              secureTextEntry
              placeholder="Enter your password"
              placeholderTextColor="#aaa"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.signUpBtn} onPress={signUp}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const bottomSheetModalRef = useRef(null);
  const snapPoints = useMemo(() => ['100%'], []);

  async function checkUserProfile() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return false;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, bio, avatar_url')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) return false;

    return Boolean(profile.username?.trim() && profile.bio?.trim() && profile.avatar_url?.trim());
  }

  const signIn = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setError(error.message);

    const profileComplete = await checkUserProfile();

    if (profileComplete) {
      navigation.navigate('RoleSelect');
    } else {
      navigation.navigate('Onboarding');
    }
  };

  const openSignUpModal = useCallback(() => {
    const modal = bottomSheetModalRef.current;
    if (!modal) return;

    modal.present(0); // 👈 This will open directly to 100% snap point
  }, []);

  const closeSignUpModal = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>Sign in or create an account to get started</Text>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                onChangeText={setEmail}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
              />
            </View>

            <View>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                onChangeText={setPassword}
                value={password}
                secureTextEntry
                placeholder="Enter your password"
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.signInBtn} onPress={signIn}>
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signUpBtn} onPress={openSignUpModal}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <BottomSheetModal
            ref={bottomSheetModalRef}
            snapPoints={snapPoints}
            enablePanDownToClose
            onDismiss={() => {}}>
            <BottomSheetView style={{ flex: 1 }}>
              <SignUpContent
                onSuccess={closeSignUpModal}
                onCancel={closeSignUpModal}
                navigation={navigation}
              />
            </BottomSheetView>
          </BottomSheetModal>
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 25,
    paddingHorizontal: 32,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  label: {
    color: '#374151',
    marginBottom: 4,
    fontSize: 14,
    marginVertical: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  signInBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 9999,
    paddingVertical: 12,
    marginTop: 16,
  },
  signInText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  signUpBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 9999,
    paddingVertical: 12,
    marginVertical: 30,
  },
  signUpText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },

  closeBtn: { width: 60, marginRight: 40 },
  closeText: {
    textAlign: 'center',
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
});
