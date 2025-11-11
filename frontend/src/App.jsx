import React, { useState } from 'react';
import { Layout, Typography, Button, Space, Card, Row, Col, Divider, Badge } from 'antd';
import { UserOutlined, LoginOutlined } from '@ant-design/icons';
import ChatInterface from './components/ChatInterface';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function App() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [unreadCategories, setUnreadCategories] = useState(new Set());

  const categories = [
    { id: 'general', name: 'Общий', icon: '💬', description: 'Задайте любой вопрос' },
    { id: 'finance', name: 'Финансы', icon: '💰', description: 'Налоги, отчетность, планирование' },
    { id: 'marketing', name: 'Маркетинг', icon: '📊', description: 'Продвижение, клиенты, реклама' },
    { id: 'legal', name: 'Юридическое', icon: '⚖️', description: 'Договоры, права, compliance' },
    { id: 'hr', name: 'HR', icon: '👥', description: 'Персонал, найм, управление' }
  ];

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    // Убираем категорию из непрочитанных при клике
    if (unreadCategories.has(categoryId)) {
      const newUnread = new Set(unreadCategories);
      newUnread.delete(categoryId);
      setUnreadCategories(newUnread);
    }
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
              <Button type="text" className="auth-btn register-btn">
                Зарегистрироваться
              </Button>
              <Button type="primary" className="auth-btn login-btn">
                Войти
              </Button>
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
                Привет! Чем я могу помочь?
              </Title>
            </div>
            
            <div className="categories-section">
              <Text strong className="categories-title">Выберите тему:</Text>
              <div className="categories-list">
                {categories.map((category) => (
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
                          <Text strong className="category-name">{category.name}</Text>
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
              categories={categories}
              onUnreadUpdate={setUnreadCategories}
            />
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default App;