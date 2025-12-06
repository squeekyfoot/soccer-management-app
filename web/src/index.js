import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext'; // NEW

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider> {/* Added Provider */}
        <ChatProvider>
          <App />
        </ChatProvider>
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
);

reportWebVitals();