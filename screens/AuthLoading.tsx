import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from 'utils/supabase';

export default function AuthLoading({ navigation }) {
  useEffect(() => {
    const checkProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return navigation.replace('Auth');

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, bio, avatar_url')
        .eq('id', user.id)
        .single();

      const isComplete = profile?.username && profile?.bio && profile?.avatar_url;

      navigation.replace(isComplete ? 'RoleSelect' : 'Onboarding');
    };

    checkProfile();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#22c55e" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
