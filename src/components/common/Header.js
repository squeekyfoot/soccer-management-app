import React from 'react';
// CHANGED: Point to 'lib' instead of 'config'
import { COLORS } from '../../lib/constants';
import { ChevronLeft } from 'lucide-react';

const Header = ({ title, actions, onBack, style, className }) => {
  return (
    <div 
      className={`view-header ${className || ''}`}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%', 
        boxSizing: 'border-box',
        ...style 
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        height: '44px', // FIXED HEIGHT: Ensures consistency
        paddingBottom: '10px',
        position: 'relative'
      }}>
        
        {/* LEFT SLOT: Back Button */}
        <div style={{ 
            width: '40px', 
            height: '100%',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-start',
            flexShrink: 0,
            zIndex: 2 
        }}>
            {onBack && (
                <button 
                    onClick={onBack}
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: COLORS.primary, 
                        cursor: 'pointer', 
                        padding: 0,
                        display: 'flex', 
                        alignItems: 'center'
                    }}
                >
                    <ChevronLeft size={24} />
                </button>
            )}
        </div>

        {/* CENTER SLOT: Title */}
        <div style={{ 
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            zIndex: 1,
            maxWidth: '60%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        }}>
            <h1 style={{ margin: 0, color: 'white', fontSize: '28px', lineHeight: '44px' }}>{title}</h1>
        </div>
        
        {/* RIGHT SLOT: Actions */}
        <div style={{ 
            display: 'flex', 
            gap: '10px', 
            alignItems: 'center', 
            justifyContent: 'flex-end',
            flexShrink: 0, 
            zIndex: 2,
            minWidth: '40px',
            height: '100%'
        }}>
            {actions}
        </div>
      </div>
      
      <div style={{ 
        height: '1px', 
        width: '100%', 
        backgroundColor: COLORS.border 
      }} />
    </div>
  );
};

export default Header;