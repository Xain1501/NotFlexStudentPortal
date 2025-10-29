import React, { createContext, useContext, useEffect, useState } from 'react';

// Simple AuthContext to demo role-based navbars. Replace with real auth.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Try to restore saved user or default to student
    const saved = localStorage.getItem('user');
    if (saved) {
      setUser(JSON.parse(saved));
    } else {
      setUser({ username: 'demo', role: 'student' }); // default
    }
  }, []);

  function loginAsFaculty() {
    const u = { username: 'teacher', role: 'faculty' };
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  }

  function loginAsStudent() {
    const u = { username: 'student', role: 'student' };
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loginAsFaculty, loginAsStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}