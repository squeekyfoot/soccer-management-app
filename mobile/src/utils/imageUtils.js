import ImageResizer from '@bam.tech/react-native-image-resizer';

/**
 * Compresses an image using native hardware APIs.
 * * @param {string} uri - The local file URI of the image
 * @param {number} maxWidth - Max width (default 800 to match web parity)
 * @param {number} quality - JPEG quality 0-100 (default 80)
 * @returns {Promise<string>} - The URI of the compressed image
 */
export const compressImage = async (uri, maxWidth = 800, quality = 80) => {
  try {
    // React Native Image Resizer creates a new version of the image
    // args: uri, width, height, format, quality, rotation, outputPath
    const response = await ImageResizer.createResizedImage(
      uri,
      maxWidth,
      maxWidth, // maintain aspect ratio
      'JPEG',
      quality,
      0, // rotation
      null // use default cache dir
    );
    
    return response.uri;
  } catch (error) {
    console.error("Image compression failed:", error);
    // Fallback: return original if compression fails
    return uri;
  }
};