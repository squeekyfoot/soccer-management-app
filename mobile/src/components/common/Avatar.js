import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../../lib/constants';

export default function Avatar({ photoURL, name, size = 40, onPress, style, bordered = false }) {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Reset states when URL changes
  useEffect(() => {
    setImageError(false);
    setLoading(true);
  }, [photoURL]);

  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const Container = onPress ? TouchableOpacity : View;

  // Determine what to show
  const showImage = photoURL && !imageError;

  return (
    <Container onPress={onPress} activeOpacity={0.7} style={[styles.container, style]}>
      
      {/* 1. Placeholder (Always rendered behind or as fallback) */}
      <View 
        style={[
          styles.placeholder, 
          { width: size, height: size, borderRadius: size / 2 },
          bordered && styles.bordered,
          // If we are showing an image and it's done loading, hide the placeholder background to avoid artifacts
          (showImage && !loading) && { backgroundColor: 'transparent', borderWidth: 0 } 
        ]}
      >
        {(!showImage || loading) && (
           <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
        )}
      </View>

      {/* 2. Network Image ( overlaid on top) */}
      {showImage && (
        <Image 
          source={{ uri: photoURL }} 
          style={[
            styles.image, 
            { width: size, height: size, borderRadius: size / 2 },
            // Absolute positioning to sit exactly on top of the placeholder
            StyleSheet.absoluteFillObject
          ]} 
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setImageError(true);
          }}
        />
      )}

      {/* 3. Loading Spinner (Optional, mostly for large profile headers) */}
      {showImage && loading && size > 60 && (
         <View style={[styles.loadingOverlay, { borderRadius: size/2 }]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
         </View>
      )}

    </Container>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  
  // Base circle for initials or background
  placeholder: { 
    backgroundColor: '#333', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderColor: '#555', 
    borderWidth: 1,
    overflow: 'hidden'
  },
  
  // The actual image
  image: { 
    // No background color here to prevent the "black circle" effect if transparent/loading
  },
  
  bordered: { borderWidth: 2, borderColor: COLORS.primary },
  initial: { color: '#ccc', fontWeight: 'bold' },
  
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)'
  }
});