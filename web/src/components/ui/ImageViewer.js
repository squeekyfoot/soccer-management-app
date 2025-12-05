import React from 'react';
import { createPortal } from 'react-dom';

const ImageViewer = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return createPortal(
    <div 
      onClick={onClose} 
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.95)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        zIndex: 9999, 
        flexDirection: 'column'
      }}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation(); 
          onClose();
        }}
        style={{
          position: 'absolute', 
          top: '40px', 
          right: '20px',
          width: '50px', 
          height: '50px',
          borderRadius: '50%',
          backgroundColor: 'rgba(50, 50, 50, 0.8)', 
          border: '2px solid white', 
          color: 'white', 
          fontSize: '24px', 
          cursor: 'pointer',
          zIndex: 10000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}
      >
        ✕
      </button>
      
      <img 
        src={imageUrl} 
        alt="Full size" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '100%', 
          maxHeight: '85%', 
          objectFit: 'contain',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)'
        }}
      />
    </div>,
    document.body 
  );
};

export default ImageViewer;