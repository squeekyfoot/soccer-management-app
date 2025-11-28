import React from 'react';
import { COLORS } from '../../constants';

const Loading = ({ message = "Loading..." }) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '40px', 
      color: COLORS.primary,
      fontStyle: 'italic'
    }}>
      {message}
    </div>
  );
};

export default Loading;