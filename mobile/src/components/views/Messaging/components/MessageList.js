import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../../lib/constants';

// FIX: Ensure onImageClick is destructured here
export default function MessageList({ messages, currentUser, onImageClick }) {
  
  const renderItem = ({ item }) => {
    if (item.type === 'system') {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    const isMe = item.senderId === currentUser.uid;

    return (
      <View style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}>
        {!isMe && (
           <View style={styles.avatarContainer}>
             {item.senderPhoto ? (
               <Image source={{ uri: item.senderPhoto }} style={styles.avatar} />
             ) : (
               <View style={styles.avatarPlaceholder}>
                 <Text style={styles.avatarInitials}>{item.senderName?.charAt(0) || '?'}</Text>
               </View>
             )}
           </View>
        )}

        <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
          {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
          
          {/* IMAGE RENDERER */}
          {item.imageUrl && (
            <TouchableOpacity onPress={() => onImageClick && onImageClick(item.imageUrl)}>
              <Image 
                source={{ uri: item.imageUrl }} 
                style={styles.msgImage} 
                resizeMode="cover" 
              />
            </TouchableOpacity>
          )}

          {item.text ? (
            <Text style={isMe ? styles.textRight : styles.textLeft}>{item.text}</Text>
          ) : null}

          <Text style={[styles.timestamp, isMe ? styles.timeRight : styles.timeLeft]}>
            {item.createdAt?.seconds 
              ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Just now'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={messages}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      inverted
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16, paddingBottom: 20 },
  systemMessageContainer: { alignSelf: 'center', marginVertical: 10, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  systemMessageText: { color: '#888', fontSize: 12, fontStyle: 'italic' },
  messageRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  avatarContainer: { marginRight: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#444', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { color: '#ccc', fontSize: 12, fontWeight: 'bold' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 20 },
  bubbleRight: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleLeft: { backgroundColor: '#2a2e36', borderBottomLeftRadius: 4 },
  senderName: { color: '#888', fontSize: 10, marginBottom: 4 },
  textRight: { color: '#121212', fontSize: 16 },
  textLeft: { color: 'white', fontSize: 16 },
  msgImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 5, backgroundColor: '#000' },
  timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  timeRight: { color: 'rgba(0,0,0,0.6)' },
  timeLeft: { color: 'rgba(255,255,255,0.4)' },
});