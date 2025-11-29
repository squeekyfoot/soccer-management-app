/**
 * Compresses and resizes an image file using modern createImageBitmap API.
 * This is faster and reduces main-thread blocking compared to FileReader.
 * * @param {File} file - The original image file
 * @param {number} maxWidth - Max width/height (default 300px)
 * @param {number} quality - JPEG quality 0-1 (default 0.7)
 */
export const compressImage = async (file, maxWidth = 300, quality = 0.7) => {
    try {
        // 1. Use createImageBitmap (modern, faster, async decoding)
        // This avoids the 'load' handler delays of FileReader
        const bitmap = await createImageBitmap(file);
        
        let width = bitmap.width;
        let height = bitmap.height;

        // 2. Calculate new dimensions
        if (width > height) {
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
        } else {
            if (height > maxWidth) {
                width = Math.round((width * maxWidth) / height);
                height = maxWidth;
            }
        }

        // 3. Draw to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, width, height);

        // 4. Convert to compressed Blob -> File
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Canvas is empty'));
                        return;
                    }
                    const newFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    // Clean up bitmap memory
                    bitmap.close();
                    resolve(newFile);
                },
                'image/jpeg',
                quality
            );
        });

    } catch (error) {
        console.error("Compression error:", error);
        // Fallback: If createImageBitmap fails (very old browsers), return original
        return file;
    }
};