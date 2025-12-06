import React, { useEffect } from 'react';
import { X } from 'lucide-react'; 
import { COLORS } from '../../lib/constants';
// Removed unused Button import

const Modal = ({ title, children, onClose, actions }) => {
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
        onClick={(e) => e.stopPropagation()} 
        style={{
          backgroundColor: COLORS.sidebar,
          padding: '30px', 
          borderRadius: '12px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          border: `1px solid ${COLORS.border}`,
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative' 
        }}
      >
        <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: `1px solid ${COLORS.border}`, 
            paddingBottom: '10px', 
            marginBottom: '20px' 
        }}>
            <h3 style={{ margin: 0, color: 'white' }}>{title}</h3>
            
            <button 
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                onMouseOut={(e) => e.currentTarget.style.color = '#888'}
            >
                <X size={24} />
            </button>
        </div>
        
        <div style={{ marginBottom: actions ? '20px' : '0' }}>
          {children}
        </div>

        {actions && (
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                {actions}
            </div>
        )}
      </div>
    </div>
  );
};

export default Modal;