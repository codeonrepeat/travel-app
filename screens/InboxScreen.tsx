import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Chat, ChannelList, OverlayProvider } from 'stream-chat-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { streamClient } from '../utils/streamClient';

export default function InboxScreen({ navigation }) {
  const filters = {
    type: 'messaging',
    members: { $in: [streamClient.user?.id] },
  };
  const sort = { last_message_at: -1 };

  const onSelectChannel = (channel) => {
    const otherUser = Object.values(channel.state.members).find(
      (member) => member.user.id !== streamClient.user.id
    );
    if (!otherUser) return;

    navigation.navigate('DirectMessageScreen', {
      otherUserId: otherUser.user.id,
    });
  };

  return (
    <OverlayProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inbox</Text>
          <View style={{ width: 40 }} />
        </View>

        <Chat client={streamClient} style={{ flex: 1 }}>
          <ChannelList
            filters={filters}
            sort={sort}
            onSelect={onSelectChannel}
            PreviewAvatarSize={48}
            style={{ flex: 1 }}
          />
        </Chat>
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
});
