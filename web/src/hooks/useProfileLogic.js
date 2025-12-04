// src/hooks/useProfileLogic.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserManager } from './useUserManager';

export const useProfileLogic = () => {
  const { loggedInUser } = useAuth();
  // Import the Brain
  const { 
    updateUserProfile, 
    uploadProfileAvatar, 
    fetchUserSportsDetails, 
    updateUserSportsDetails 
  } = useUserManager();
  
  // UI State
  const [currentView, setCurrentView] = useState('hub');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Form State
  const [profileFormData, setProfileFormData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  // Sports Details State
  const [soccerDetails, setSoccerDetails] = useState(null);

  useEffect(() => {
     if (loggedInUser) {
         setProfileFormData({
             ...loggedInUser,
             emergencyContactFirstName: loggedInUser.emergencyContact?.firstName || "",
             emergencyContactLastName: loggedInUser.emergencyContact?.lastName || "",
             emergencyContactPhone: loggedInUser.emergencyContact?.phone || "",
             emergencyContactRelationship: loggedInUser.emergencyContact?.relationship || ""
         });
         setPreviewUrl(loggedInUser.photoURL || "");
         
         // Fetch Soccer Details via Brain
         const loadSoccerDetails = async () => {
            const data = await fetchUserSportsDetails(loggedInUser.uid, 'soccer');
            if (data) setSoccerDetails(data);
         };
         loadSoccerDetails();
     }
  }, [loggedInUser, fetchUserSportsDetails]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsRemovingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setIsRemovingImage(true);
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!loggedInUser) return;

    try {
        let photoURL = profileFormData.photoURL;

        // 1. Handle Image Logic via Brain
        if (isRemovingImage) {
            photoURL = ""; 
            // Note: If you want to delete the file from Storage, 
            // you'd add a deleteProfileAvatar function to useUserManager
        } else if (selectedFile) {
            photoURL = await uploadProfileAvatar(loggedInUser.uid, selectedFile);
        }

        // 2. Prepare Data
        const updatedData = {
            firstName: profileFormData.firstName,
            lastName: profileFormData.lastName,
            preferredName: profileFormData.preferredName,
            phone: profileFormData.phone,
            notificationPreference: profileFormData.notificationPreference,
            emergencyContact: {
                firstName: profileFormData.emergencyContactFirstName,
                lastName: profileFormData.emergencyContactLastName,
                phone: profileFormData.emergencyContactPhone,
                relationship: profileFormData.emergencyContactRelationship
            },
            photoURL: photoURL
        };

        // 3. Update Profile via Brain
        await updateUserProfile(loggedInUser.uid, updatedData);

        setIsEditingProfile(false);
        setSelectedFile(null);
        setIsRemovingImage(false);
        
        // Note: You might need to reload the Auth Context user here 
        // if it doesn't listen to real-time changes automatically.
        
        return true;
    } catch (error) {
        console.error("Profile update failed", error);
        return false;
    }
  };

  const updateSoccerDetails = async (soccerData) => {
      try {
        const dataToSave = {
          ...soccerData,
          currentRosters: typeof soccerData.currentRosters === 'string' 
            ? soccerData.currentRosters.split(',').map(item => item.trim()) 
            : soccerData.currentRosters,
          rosterJerseysOwned: typeof soccerData.rosterJerseysOwned === 'string' 
            ? soccerData.rosterJerseysOwned.split(',').map(item => item.trim()) 
            : soccerData.rosterJerseysOwned,
          playerNumber: Number(soccerData.playerNumber) || 0,
        };

        // Use Brain for persistence
        const success = await updateUserSportsDetails(loggedInUser.uid, 'soccer', dataToSave);
        
        if (success) {
            setSoccerDetails(dataToSave);
            return true;
        }
        return false;
      } catch (error) {
        console.error(error);
        return false;
      }
  };

  return {
      currentView, setCurrentView,
      isEditingProfile, setIsEditingProfile,
      profileFormData, handleProfileFormChange,
      previewUrl, selectedFile, handleFileChange, handleRemoveImage,
      handleProfileSubmit,
      soccerDetails, updateSoccerDetails
  };
};