import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../lib/firebase";

export const useStorage = () => {
  
  const upload = async (file, path) => {
    if (!file) return null;
    try {
      // Create a unique filename if needed, or rely on path
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const remove = async (path) => {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return true;
    } catch (error) {
      console.warn("Error deleting file (might not exist):", error);
      return false;
    }
  };

  return { upload, remove };
};