import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../../../context/ChatContext'; 
import { collection, query, orderBy, onSnapshot, limitToLast, where } from "firebase/firestore"; 
import { db } from "../../../firebase";
import { COLORS, MOBILE_BREAKPOINT } from '../../../constants';
import { compressImage } from '../../../utils/imageUtils'; 
import { SquarePen } from 'lucide-react';

// UPDATED IMPORTS
import UserSearch from '../../shared/UserSearch';
import Header from '../../common/Header'; 
import Button from '../../common/Button';

// Sub-components are now in the local ./components folder
import ChatList from './components/ChatList';
import ImageViewer from './components/ImageViewer';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import ChatDetailsModal from './components/ChatDetailsModal'; 

function TeamChat() {
  // ... (Paste full logic from previous TeamChat.js here)
  // ... The logic does not change, only the imports above.
  
  const { uploadImage, loggedInUser } = useAuth();
  // ... rest of the component
  return (
    <div className="view-container">
       {/* ... implementation ... */}
       <Header title="Messaging" />
       {/* ... implementation ... */}
    </div>
  );
}

export default TeamChat;