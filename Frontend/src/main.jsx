import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Single router wrapper for the entire app */}
    <BrowserRouter>
      {/* Optional: provide auth context for role switching */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);