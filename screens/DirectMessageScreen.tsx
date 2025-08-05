import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  OverlayProvider,
} from 'stream-chat-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { streamClient } from '../utils/streamClient';

export default function DirectMessageScreen({ route, navigation }) {
  const { otherUserId } = route.params;
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    const createOrGetChannel = async () => {
      const newChannel = streamClient.channel('messaging', {
        members: [streamClient.user.id, otherUserId],
      });
      await newChannel.watch();
      setChannel(newChannel);
    };
    createOrGetChannel();

    return () => {
      if (channel) {
        channel.stopWatching();
      }
    };
  }, [otherUserId]);

  if (!channel) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading chat...</Text>
      </SafeAreaView>
    );
  }

  return (
    <OverlayProvider>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header with fixed height */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Chat container takes remaining space */}
        <View style={{ flex: 1 }}>
          <Chat client={streamClient} style={{ flex: 1 }}>
            <Channel channel={channel} style={{ flex: 1 }}>
              <MessageList />
              <MessageInput />
            </Channel>
          </Chat>
        </View>
      </SafeAreaView>
    </OverlayProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
