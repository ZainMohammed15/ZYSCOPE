import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UserContext = createContext({ user: null, setUser: () => {} });

const STORAGE_KEY = 'zyscope_user';

export function UserProvider({ children }) {
  // Initialize user from localStorage
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.error('Failed to restore user from localStorage:', err);
      return null;
    }
  });

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch (err) {
        console.error('Failed to save user to localStorage:', err);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const value = useMemo(() => ({ user, setUser }), [user]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
