import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('sorilotx-current-user');
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    setLoading(false);
  }, []);

  const register = (login, password) => {
    const users = JSON.parse(localStorage.getItem('sorilotx-users') || '[]');
    if (users.some(u => u.username === login)) {
      message.error('Пользователь с таким логином уже существует');
      return false;
    }

    const newUser = {
      id: Date.now().toString(),
      username: login,
      password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('sorilotx-users', JSON.stringify(users));
    setCurrentUser(newUser);
    localStorage.setItem('sorilotx-current-user', JSON.stringify(newUser));
    return true;
  };

  const login = (login, password) => {
    const users = JSON.parse(localStorage.getItem('sorilotx-users') || '[]');
    const user = users.find(u => u.username === login && u.password === password);

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('sorilotx-current-user', JSON.stringify(user));
      message.success(`Добро пожаловать, ${login}!`);
      return true;
    } else {
      message.error('Неверный логин или пароль');
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sorilotx-current-user');
    message.success('Вы вышли из системы');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
