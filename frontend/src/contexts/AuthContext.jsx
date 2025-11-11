// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';

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
    const savedUser = localStorage.getItem('sorilotx-current-user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    const users = JSON.parse(localStorage.getItem('sorilotx-users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('sorilotx-current-user', JSON.stringify(user));
      message.success(`Добро пожаловать, ${username}!`);
      return true;
    } else {
      message.error('Неверный логин или пароль');
      return false;
    }
  };

  const register = (username, password) => {
    const users = JSON.parse(localStorage.getItem('sorilotx-users') || '[]');
    
    if (users.find(u => u.username === username)) {
      message.error('Пользователь с таким логином уже существует');
      return false;
    }
    
    const newUser = {
      id: Date.now().toString(),
      username,
      password,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('sorilotx-users', JSON.stringify(users));
    
    setCurrentUser(newUser);
    localStorage.setItem('sorilotx-current-user', JSON.stringify(newUser));
    message.success('Регистрация прошла успешно!');
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sorilotx-current-user');
    message.success('Вы вышли из системы');
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};