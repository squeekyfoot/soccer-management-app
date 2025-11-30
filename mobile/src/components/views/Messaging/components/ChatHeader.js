import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ChevronLeft, MoreVertical } from 'lucide-react-native';
import { COLORS } from '../../../../lib/constants';

export default function ChatHeader({ 
  chat, 
  currentUser, 
  onBack, 
  onShowDetails 
}) {
  if (!chat) return null;

  // --- Logic Parity with Web ---
  const isDM = chat.type === 'dm' || (chat.participants?.length === 2 && chat.type !== 'roster');
  let displayTitle = chat.name;
  let iconImage = null;
  let subText = "";

  if (isDM) {
    // For DMs, find the *other* user
    const otherUser = chat.participantDetails?.find(p => p.uid !== currentUser.uid);
    if (otherUser) {
      displayTitle = otherUser.name || otherUser.playerName || "Unknown User";
      iconImage = otherUser.photoURL;
    }
  } else if (chat.type === 'roster') {
    displayTitle = `⚽ ${chat.name}`;
    iconImage = chat.photoURL; // Rosters might have a team logo
    subText = `${chat.participantDetails?.length || 0} members`;
  } else {
    // Group Chat
    iconImage = chat.photoURL;
    subText = `${chat.participantDetails?.length || 0} members`;
  }

  // Fallback initial if no image
  const initial = displayTitle ? displayTitle.charAt(0).toUpperCase() : "?";

  return (
    <View style={styles.container}>
      
      {/* Left: Back Button */}
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ChevronLeft size={28} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Center: Avatar & Info (Clickable to open details) */}
      <TouchableOpacity style={styles.titleContainer} onPress={onShowDetails} activeOpacity={0.7}>
        <View style={styles.avatarContainer}>
          {iconImage ? (
            <Image source={{ uri: iconImage }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.initial}>{initial}</Text>
            </View>
          )}
        </View>

        <View>
          <Text style={styles.title} numberOfLines={1}>{displayTitle}</Text>
          {subText ? <Text style={styles.subText}>{subText}</Text> : null}
        </View>
      </TouchableOpacity>

      {/* Right: Settings Icon */}
      <TouchableOpacity onPress={onShowDetails} style={styles.settingsBtn}>
        <MoreVertical size={24} color="#666" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50, // Safe Area padding (approximate)
    paddingBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: {
    padding: 5,
    marginRight: 5,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center content like web
    marginRight: 30, // Balance the back button spacing
  },
  
  // Avatar Styles
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  initial: {
    color: '#ccc',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Text Styles
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  subText: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },

  settingsBtn: {
    padding: 5,
  }
});