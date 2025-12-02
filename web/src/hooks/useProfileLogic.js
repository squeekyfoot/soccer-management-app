import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useProfileLogic = () => {
  const { loggedInUser, updateProfile } = useAuth();
  
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
         
         // Fetch Soccer Details independently
         const fetchSoccer = async () => {
             const ref = doc(db, "users", loggedInUser.uid, "sportsDetails", "soccer");
             const snap = await getDoc(ref);
             if (snap.exists()) setSoccerDetails(snap.data());
         };
         fetchSoccer();
     }
  }, [loggedInUser]);

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
    const success = await updateProfile(profileFormData, selectedFile, isRemovingImage);
    if (success) {
      setIsEditingProfile(false);
      setSelectedFile(null);
      setIsRemovingImage(false);
    }
  };

  const updateSoccerDetails = async (soccerData) => {
      try {
        const dataToSave = {
          ...soccerData,
          currentRosters: soccerData.currentRosters.split(',').map(item => item.trim()),
          rosterJerseysOwned: soccerData.rosterJerseysOwned.split(',').map(item => item.trim()),
          playerNumber: Number(soccerData.playerNumber) || 0,
        };
        await setDoc(doc(db, "users", loggedInUser.uid, "sportsDetails", "soccer"), dataToSave);
        setSoccerDetails(dataToSave);
        return true;
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