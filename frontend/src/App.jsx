import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Space, Card, Badge, Drawer } from 'antd';
import { PlusOutlined, LogoutOutlined, MenuOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from './contexts/AuthContext';
import ChatInterface from './components/ChatInterface';
import CreateChatModal from './components/CreateChatModal';
import AuthModal from './components/AuthModal';
import DBCleaner from './utils/DBCleaner';
import MobileSidebar from './components/MobileSidebar';
import './App.css';

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
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { currentUser, logout } = useAuth();

  const defaultCategories = [
    { id: 'general', name: 'Общий', icon: '💬', description: 'Задайте любой вопрос', isDefault: true },
    { id: 'finance', name: 'Финансы', icon: '💰', description: 'Налоги, отчетность, планирование', isDefault: true },
    { id: 'marketing', name: 'Маркетинг', icon: '📊', description: 'Продвижение, клиенты, реклама', isDefault: true },
    { id: 'legal', name: 'Юридическое', icon: '⚖️', description: 'Договоры, права, compliance', isDefault: true },
    { id: 'hr', name: 'HR', icon: '👥', description: 'Персонал, найм, управление', isDefault: true }
  ];

  // Определение мобильного устройства
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Загрузка кастомных чатов из localStorage
  useEffect(() => {
    if (!currentUser) return;

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
    if (isMobile) {
      setMobileMenuVisible(false);
    }
    if (unreadCategories.has(categoryId)) {
      const newUnread = new Set(unreadCategories);
      newUnread.delete(categoryId);
      setUnreadCategories(newUnread);
    }
  };

  const handleCreateChat = (newChat) => {
    setCustomChats(prev => [...prev, newChat]);
    setActiveCategory(newChat.id);
    if (isMobile) {
      setMobileMenuVisible(false);
    }
  };

  const handleUnreadUpdate = (unreadSet) => {
    setUnreadCategories(unreadSet);
  };

  // Компонент сайдбара для десктопа
  const DesktopSidebar = () => (
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
  );

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-and-menu">
              {isMobile && (
                <Button 
                  type="text" 
                  icon={mobileMenuVisible ? <CloseOutlined /> : <MenuOutlined />}
                  onClick={() => setMobileMenuVisible(!mobileMenuVisible)}
                  className="mobile-menu-button"
                />
              )}
              <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="app-logo">
                <rect width="64" height="64" rx="16" fill="#0078D4"/>
                <path d="M20 32L28 40L44 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M32 20V44" stroke="white" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <Title level={2} className="logo-text">СорilotX</Title>
            </div>
          </div>
          <div className="auth-section">
            <Space size="middle">
              {currentUser ? (
                <>
                  <Text className="user-welcome mobile-hidden">Привет, {currentUser.username}!</Text>
                  <Button type="text" icon={<LogoutOutlined />} onClick={logout} className="logout-button">
                    <span className="mobile-hidden">Выйти</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button type="text" onClick={() => setAuthModalVisible(true)} className="mobile-hidden">
                    Зарегистрироваться
                  </Button>
                  <Button type="primary" onClick={() => setAuthModalVisible(true)} className="login-button">
                    <span className="mobile-hidden">Войти</span>
                    <UserOutlined className="mobile-only" />
                  </Button>
                </>
              )}
            </Space>
          </div>
        </div>
      </Header>
      
      <Content className="app-content">
        <div className="main-container">
          {!isMobile && <DesktopSidebar />}

          <div className="chat-panel">
            <ChatInterface 
              activeCategory={activeCategory} 
              categories={allCategories}
              onUnreadUpdate={handleUnreadUpdate}
              currentUser={currentUser}
            />
          </div>
        </div>

        {/* Мобильное меню с новым компонентом */}
        {isMobile && (
          <Drawer
            title="Меню"
            placement="left"
            onClose={() => setMobileMenuVisible(false)}
            open={mobileMenuVisible}
            width={280}
            styles={{
              body: { padding: '16px' }
            }}
          >
            <MobileSidebar
              categories={allCategories}
              activeCategory={activeCategory}
              onCategoryClick={handleCategoryClick}
              onCreateChat={() => {
                setCreateModalVisible(true);
                setMobileMenuVisible(false);
              }}
              currentUser={currentUser}
            />
          </Drawer>
        )}

        <CreateChatModal
          visible={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          onCreate={handleCreateChat}
        />

        <AuthModal
          visible={authModalVisible}
          onCancel={() => setAuthModalVisible(false)}
        />

        <DBCleaner />
      </Content>
    </Layout>
  );
}

export default App;