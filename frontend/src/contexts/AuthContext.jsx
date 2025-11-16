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

  const login = (username, password) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('current-user', JSON.stringify(user));
        message.success(`Добро пожаловать, ${username}!`);
        return true;
      } else {
        message.error('Неверный логин или пароль');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('Ошибка входа');
      return false;
    }
  };

  const register = (username, password) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
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
      localStorage.setItem('users', JSON.stringify(users));
      
      setCurrentUser(newUser);
      localStorage.setItem('current-user', JSON.stringify(newUser));
      message.success('Регистрация прошла успешно!');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      message.error('Ошибка регистрации');
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current-user');
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