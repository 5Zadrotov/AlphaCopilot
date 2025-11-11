import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Space, Card, Badge } from 'antd';
import { PlusOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from './contexts/AuthContext';
import ChatInterface from './components/ChatInterface';
import CreateChatModal from './components/CreateChatModal';
import AuthModal from './components/AuthModal';
import './App.css';
import DBCleaner from './utils/DBCleaner';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// Хелпер для user-specific кастомных чатов
const getUserCustomChatsKey = (userId) => `sorilotx-custom-chats-${userId}`;

function App() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [unreadCategories, setUnreadCategories] = useState(new Set());
  const [customChats, setCustomChats] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const { currentUser, logout } = useAuth();

  const defaultCategories = [
    { id: 'general', name: 'Общий', icon: '💬', description: 'Задайте любой вопрос', isDefault: true },
    { id: 'finance', name: 'Финансы', icon: '💰', description: 'Налоги, отчетность, планирование', isDefault: true },
    { id: 'marketing', name: 'Маркетинг', icon: '📊', description: 'Продвижение, клиенты, реклама', isDefault: true },
    { id: 'legal', name: 'Юридическое', icon: '⚖️', description: 'Договоры, права, compliance', isDefault: true },
    { id: 'hr', name: 'HR', icon: '👥', description: 'Персонал, найм, управление', isDefault: true }
  ];

  // Загрузка кастомных чатов из localStorage
  useEffect(() => {
    if (!currentUser) {
      setCustomChats([]);
      return;
    }

    const userCustomChatsKey = getUserCustomChatsKey(currentUser.id);
    const savedCustomChats = localStorage.getItem(userCustomChatsKey);
    if (savedCustomChats) {
      setCustomChats(JSON.parse(savedCustomChats));
    } else {
      setCustomChats([]);
    }
  }, [currentUser]);

  // Сохранение кастомных чатов в localStorage
  useEffect(() => {
    if (customChats.length > 0 && currentUser) {
      const userCustomChatsKey = getUserCustomChatsKey(currentUser.id);
      localStorage.setItem(userCustomChatsKey, JSON.stringify(customChats));
    }
  }, [customChats, currentUser]);

  const allCategories = [...defaultCategories, ...customChats];

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    // Убираем категорию из непрочитанных при клике
    if (unreadCategories.has(categoryId)) {
      const newUnread = new Set(unreadCategories);
      newUnread.delete(categoryId);
      setUnreadCategories(newUnread);
    }
  };

  const handleCreateChat = (newChat) => {
    setCustomChats(prev => [...prev, newChat]);
    setActiveCategory(newChat.id);
  };

  const handleUnreadUpdate = (unreadSet) => {
    setUnreadCategories(unreadSet);
  };

  return (
    <Layout className="app-layout">
      {/* Хедер с навигацией */}
      <Header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <Title level={2} className="logo-text">СорilotX</Title>
          </div>
          <div className="auth-section">
            <Space size="middle">
              {currentUser ? (
                <>
                  <Text className="user-welcome">Привет, {currentUser.username}!</Text>
                  <Button type="text" icon={<LogoutOutlined />} onClick={logout}>
                    Выйти
                  </Button>
                </>
              ) : (
                <>
                  <Button type="text" onClick={() => setAuthModalVisible(true)}>
                    Зарегистрироваться
                  </Button>
                  <Button type="primary" onClick={() => setAuthModalVisible(true)}>
                    Войти
                  </Button>
                </>
              )}
            </Space>
          </div>
        </div>
      </Header>
      
      {/* Основной контент */}
      <Content className="app-content">
        <div className="main-container">
          {/* Левая панель с категориями */}
          <div className="sidebar">
            <div className="welcome-section">
              <Title level={3} className="welcome-title">
                {currentUser ? `Привет, ${currentUser.username}!` : 'Привет!'} Чем я могу помочь?
              </Title>
            </div>
            
            <div className="categories-section">
              <div className="categories-header">
                <Text strong className="categories-title">Темы для обсуждения:</Text>
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                  disabled={!currentUser}
                >
                  Новая тема
                </Button>
              </div>
              
              <div className="categories-list">
                {allCategories.map((category) => (
                  <Badge 
                    key={category.id}
                    dot={unreadCategories.has(category.id)}
                    offset={[-5, 5]}
                    color="red"
                  >
                    <Card 
                      className={`category-card ${activeCategory === category.id ? 'active' : ''}`}
                      hoverable
                      onClick={() => handleCategoryClick(category.id)}
                    >
                      <div className="category-content">
                        <div className="category-icon">{category.icon}</div>
                        <div className="category-text">
                          <Text strong className="category-name">
                            {category.name}
                            {category.isCustom && (
                              <Text type="secondary" style={{ fontSize: '10px', marginLeft: '4px' }}>
                                ●
                              </Text>
                            )}
                          </Text>
                          <Text type="secondary" className="category-description">
                            {category.description}
                          </Text>
                        </div>
                      </div>
                    </Card>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Правая панель с чатом */}
          <div className="chat-panel">
            <ChatInterface 
              activeCategory={activeCategory} 
              categories={allCategories}
              onUnreadUpdate={handleUnreadUpdate}
              currentUser={currentUser}
            />
          </div>
        </div>

        {/* Модальное окно создания чата */}
        <CreateChatModal
          visible={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          onCreate={handleCreateChat}
        />

        {/* Модальное окно авторизации */}
        <AuthModal
          visible={authModalVisible}
          onCancel={() => setAuthModalVisible(false)}
        />
      </Content>
      <DBCleaner />
    </Layout>
  );
}

export default App;