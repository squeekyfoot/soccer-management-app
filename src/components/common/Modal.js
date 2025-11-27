import React, { useEffect } from 'react';
import { COLORS } from '../../constants';
import Button from './Button';

const Modal = ({ title, children, onClose, actions }) => {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)', 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      zIndex: 2000, padding: '20px', boxSizing: 'border-box'
    }} onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
        style={{
          backgroundColor: COLORS.sidebar, // Match AuthPage
          padding: '30px', 
          borderRadius: '12px',            // Match AuthPage
          maxWidth: '400px',               // Match AuthPage width
          width: '100%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', // Match AuthPage shadow
          border: `1px solid ${COLORS.border}`,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <h3 style={{ marginTop: 0, color: 'white', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '10px', marginBottom: '20px' }}>
          {title}
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          {children}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          {actions}
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;