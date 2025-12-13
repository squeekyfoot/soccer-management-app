import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';
// Import the new Provider
import { ConfirmationProvider } from './context/ConfirmationContext'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <NotificationProvider>
      <AuthProvider>
        {/* Wrap DataProvider and ChatProvider so they can also use confirmations if needed */}
        <ConfirmationProvider>
            <ChatProvider>
              <App />
            </ChatProvider>
        </ConfirmationProvider>
      </AuthProvider>
    </NotificationProvider>
  </BrowserRouter>
);

reportWebVitals();