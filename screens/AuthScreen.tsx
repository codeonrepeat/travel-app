import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { supabase } from 'utils/supabase';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check profile completeness including avatar_url
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setError(error.message);

    const profileComplete = await checkUserProfile();

    if (profileComplete) {
      navigation.navigate('RoleSelect');
    } else {
      navigation.navigate('Onboarding');
    }
  };

  // const signUp = async () => {
  //   const { data, error } = await supabase.auth.signUp({ email, password });
  //   if (error) return setError(error.message);

  //   // Insert profile immediately
  //   await supabase.from('profiles').insert({ id: data.user.id, email });

  //   // Wait for auth session to become active
  //   const {
  //     data: { session },
  //   } = await supabase.auth.getSession();

  //   if (!session) {
  //     // You could show a message or redirect to sign in
  //     return setError('Please check your email to confirm your account before logging in.');
  //   }

  //   const profileComplete = await checkUserProfile();

  //   if (profileComplete) {
  //     navigation.navigate('RoleSelect');
  //   } else {
  //     navigation.navigate('ProfileSetup');
  //   }
  // };

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return setError(error.message);

    await supabase.from('profiles').insert({ id: data.user.id, email });

    // Use session from signUp response (may be null if confirmation required)
    const session = data.session;

    if (!session) {
      return setError('Please check your email to confirm your account before logging in.');
    }

    const profileComplete = await checkUserProfile();

    if (profileComplete) {
      navigation.navigate('RoleSelect');
    } else {
      navigation.navigate('Onboarding');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text>AuthScreen.tsx</Text>
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

        <TouchableOpacity style={styles.signUpBtn} onPress={signUp}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    marginTop: 8,
  },
  signUpText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
