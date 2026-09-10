import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('metrocheck_token');
    const savedUser = localStorage.getItem('metrocheck_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await loginApi(email, password);
    const { access_token, user: userData } = response.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('metrocheck_token', access_token);
    localStorage.setItem('metrocheck_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('metrocheck_token');
    localStorage.removeItem('metrocheck_user');
  };

  const isAdmin = user?.role === 'admin';
  const isOfficer = user?.role === 'enforcement_officer';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAdmin, isOfficer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
