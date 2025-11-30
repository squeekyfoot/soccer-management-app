import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../../../context/ChatContext';
import Header from '../../common/Header';
import { COLORS } from '../../../lib/constants';
import { SquarePen } from 'lucide-react-native';

export default function MessagingScreen({ navigation }) {
  const { loggedInUser } = useAuth();
  const { myChats, leaveChat, hideChat } = useChat();

  const handleSelectChat = (chat) => {
    navigation.navigate("ChatScreen", { 
      chatId: chat.id, 
      chatName: getDisplayTitle(chat),
      chatType: chat.type 
    });
  };

  const handleDeleteChat = (chat) => {
    if (chat.type === 'roster') {
        Alert.alert("Cannot Delete", "Team Roster chats cannot be deleted.");
        return;
    }

    const isGroup = chat.type === 'group' || (chat.participants.length > 2 && chat.type !== 'roster');
    
    Alert.alert(
        isGroup ? "Leave Group" : "Delete Conversation",
        isGroup ? "Are you sure you want to leave this group?" : "Are you sure you want to hide this chat history?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: isGroup ? "Leave" : "Delete", 
                style: "destructive", 
                onPress: async () => {
                    if (isGroup) {
                        await leaveChat(chat.id);
                    } else {
                        await hideChat(chat.id, chat.visibleTo);
                    }
                }
            }
        ]
    );
  };

  const getDisplayTitle = (chat) => {
    if (chat.type === 'roster') return `⚽ ${chat.name}`;
    const isDM = chat.type === 'dm' || (chat.participants?.length === 2 && chat.type !== 'roster');
    if (isDM) {
      const otherUser = chat.participantDetails?.find(p => p.uid !== loggedInUser.uid);
      return otherUser?.name || otherUser?.playerName || "Unknown User";
    }
    return chat.name || "Group Chat";
  };

  const getIcon = (chat) => {
    if (chat.photoURL) return { uri: chat.photoURL };
    const isDM = chat.type === 'dm' || (chat.participants?.length === 2 && chat.type !== 'roster');
    if (isDM) {
      const otherUser = chat.participantDetails?.find(p => p.uid !== loggedInUser.uid);
      if (otherUser?.photoURL) return { uri: otherUser.photoURL };
    }
    return null; 
  };

  const renderItem = ({ item }) => {
    const title = getDisplayTitle(item);
    const iconSource = getIcon(item);
    const unreadCount = (item.unreadCounts && item.unreadCounts[loggedInUser.uid]) || 0;
    const hasUnread = unreadCount > 0;
    const initial = title.replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase();

    let timeDisplay = "";
    if (item.lastMessageTime) {
      const date = item.lastMessageTime.toDate ? item.lastMessageTime.toDate() : new Date(item.lastMessageTime);
      const now = new Date();
      timeDisplay = date.toDateString() === now.toDateString() 
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
    }

    return (
      <TouchableOpacity 
        style={[styles.chatItem, hasUnread && styles.unreadItem]} 
        onPress={() => handleSelectChat(item)}
        onLongPress={() => handleDeleteChat(item)}
        delayLongPress={500}
      >
        <View style={styles.avatarContainer}>
          {iconSource ? (
            <Image source={iconSource} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.initial}>{initial}</Text>
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.topRow}>
            <Text style={[styles.title, hasUnread && styles.unreadText]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.time, hasUnread && styles.unreadText]}>{timeDisplay}</Text>
          </View>
          
          <View style={styles.bottomRow}>
             <Text style={[styles.preview, hasUnread && styles.unreadPreview]} numberOfLines={1}>
               {item.lastMessage || "No messages yet"}
             </Text>
             {hasUnread && (
               <View style={styles.badge}>
                 <Text style={styles.badgeText}>
                   {unreadCount > 99 ? '99+' : unreadCount}
                 </Text>
               </View>
             )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Messaging" 
        actions={
            <TouchableOpacity onPress={() => navigation.navigate("NewChat")} style={{ padding: 5 }}>
                <SquarePen color={COLORS.primary} size={24} />
            </TouchableOpacity>
        }
      />
      <FlatList
        data={myChats}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No conversations yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#121212'
  },
  unreadItem: { backgroundColor: '#1a1a1a' },
  avatarContainer: { marginRight: 15, justifyContent: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  placeholderAvatar: { 
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#333',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#444'
  },
  initial: { color: '#ccc', fontSize: 20, fontWeight: 'bold' },
  contentContainer: { flex: 1, justifyContent: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  title: { color: 'white', fontSize: 16, fontWeight: '600', flex: 1, marginRight: 10 },
  time: { color: '#666', fontSize: 12 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  preview: { color: '#888', fontSize: 14, flex: 1, marginRight: 10 },
  unreadText: { color: 'white', fontWeight: 'bold' },
  unreadPreview: { color: '#ccc' },
  badge: { 
    backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 6, 
    paddingVertical: 2, minWidth: 20, alignItems: 'center' 
  },
  badgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#666' }
});