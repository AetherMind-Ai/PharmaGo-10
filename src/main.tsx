import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { FirebaseProvider } from './contexts/FirebaseContext.tsx';
import { HelmetProvider } from 'react-helmet-async'; // Import HelmetProvider

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <FirebaseProvider>
        <HelmetProvider> {/* Wrap App with HelmetProvider */}
          <App />
        </HelmetProvider>
      </FirebaseProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
