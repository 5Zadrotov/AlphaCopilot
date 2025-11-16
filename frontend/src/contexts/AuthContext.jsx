import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('current-user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.warn('Failed to load user from storage:', error);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });
      
      if (response.token) {
        const user = { id: response.userId, username, token: response.token };
        setCurrentUser(user);
        localStorage.setItem('current-user', JSON.stringify(user));
        localStorage.setItem('authToken', response.token);
        message.success(`Добро пожаловать, ${username}!`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      message.error('Неверные данные для входа');
      return false;
    }
  };

  const register = async (username, password) => {
    try {
      const response = await authAPI.register({ username, password });
      
      if (response.token) {
        const user = { id: response.userId, username, token: response.token };
        setCurrentUser(user);
        localStorage.setItem('current-user', JSON.stringify(user));
        localStorage.setItem('authToken', response.token);
        message.success('Регистрация успешна!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      message.error('Ошибка регистрации');
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current-user');
    localStorage.removeItem('authToken');
    message.success('Вы вышли из системы');
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!currentUser // Добавляем флаг аутентификации
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};