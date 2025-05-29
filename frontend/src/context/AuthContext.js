import React, {createContext, useContext, useEffect, useState} from 'react';
import {
  listenToAuthChanges,
  getUserProfile,
  createUserProfile as createProfile,
} from '../services/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToAuthChanges(async firebaseUser => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Buscar perfil do usuário no Firestore
        try {
          const profileDoc = await getUserProfile(firebaseUser.uid);
          if (profileDoc.exists) {
            setUserProfile(profileDoc.data());
          } else {
            // Se não existe perfil, criar um
            await createProfile();
            const newProfileDoc = await getUserProfile(firebaseUser.uid);
            if (newProfileDoc.exists) {
              setUserProfile(newProfileDoc.data());
            }
          }
        } catch (error) {
          console.error('Erro ao buscar perfil do usuário:', error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateProfile = newProfileData => {
    setUserProfile(prev => ({...prev, ...newProfileData}));
  };

  const value = {
    user,
    userProfile,
    loading,
    updateProfile,
    isAuthenticated: !!user,
    isProfileComplete: userProfile?.profileSetupComplete || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
