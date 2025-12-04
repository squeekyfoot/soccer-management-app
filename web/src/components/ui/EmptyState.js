import React from 'react';

const EmptyState = ({ message = "No items found." }) => {
  return (
    <div style={{ 
      textAlign: 'center', 
      color: '#888', 
      marginTop: '30px',
      fontStyle: 'italic'
    }}>
      <p>{message}</p>
    </div>
  );
};

export default EmptyState;