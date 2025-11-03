import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import { api, getAccessToken } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check for existing auth session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const data = await api.getUser();
          if (data.user) {
            setIsAuthenticated(true);
            setCurrentUser(data.user);
            setCurrentPage('dashboard');
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          // Token invalid, clear it
          await api.signout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleSignup = async (userData) => {
    try {
      const result = await api.signup(userData);
      if (result.success) {
        alert('Account created successfully! Please login.');
        setCurrentPage('login');
        return true;
      }
      return false;
    } catch (error) {
      alert(error.message || 'Signup failed. Please try again.');
      console.error('Signup error:', error);
      return false;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const data = await api.signin(username, password);
      if (data.success && data.user) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        setCurrentPage('dashboard');
        return true;
      }
      return false;
    } catch (error) {
      alert(error.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await api.signout();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentPage('landing');
      setProperties([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handlePropertyUpload = async (propertyData) => {
    try {
      const result = await api.createProperty(propertyData);
      if (result.success) {
        // Refresh properties list
        const propertiesData = await api.getProperties();
        setProperties(propertiesData.properties || []);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Property upload error:', error);
      alert(error.message || 'Failed to upload property');
      return false;
    }
  };

  const handleProfileUpdate = async (updatedProfile) => {
    try {
      const result = await api.updateProfile(updatedProfile);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      alert(error.message || 'Failed to update profile');
      return false;
    }
  };

  const navigateTo = (page) => {
    if ((page === 'dashboard' || page === 'profile') && !isAuthenticated) {
      setCurrentPage('login');
    } else {
      setCurrentPage(page);
    }
  };

  // Load properties when entering dashboard
  useEffect(() => {
    if (isAuthenticated && currentPage === 'dashboard') {
      const loadProperties = async () => {
        try {
          const data = await api.getProperties();
          setProperties(data.properties || []);
        } catch (error) {
          console.error('Failed to load properties:', error);
        }
      };
      loadProperties();
    }
  }, [isAuthenticated, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onNavigate={navigateTo} 
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        currentUser={currentUser}
        onProfileUpdate={handleProfileUpdate}
      />
      
      {currentPage === 'landing' && (
        <LandingPage onNavigate={navigateTo} />
      )}
      
      {currentPage === 'login' && (
        <LoginForm 
          onLogin={handleLogin}
          onNavigate={navigateTo}
        />
      )}
      
      {currentPage === 'signup' && (
        <SignupForm 
          onSignup={handleSignup}
          onNavigate={navigateTo}
        />
      )}
      
      {currentPage === 'dashboard' && isAuthenticated && (
        <Dashboard 
          onPropertyUpload={handlePropertyUpload}
          properties={properties}
          currentUser={currentUser}
        />
      )}

      {currentPage === 'profile' && isAuthenticated && (
        <ProfilePage 
          currentUser={currentUser}
          onProfileUpdate={handleProfileUpdate}
          onNavigate={navigateTo}
        />
      )}
    </div>
  );
}
