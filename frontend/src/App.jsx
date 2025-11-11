import React, { useState } from 'react';
import { Layout, Typography, Button, Space, Input, Card, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import ChatModal from './components/ChatModal';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

function App() {
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setChatModalVisible(true);
  };

  const handleSearch = (value) => {
    if (value.trim()) {
      setSelectedCategory('');
      setChatModalVisible(true);
    }
  };

  const categories = [
    { name: 'Финансы', icon: '💰' },
    { name: 'Маркетинг', icon: '📊' },
    { name: 'Юридическое', icon: '⚖️' },
    { name: 'HR', icon: '👥' }
  ];

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
              <Button type="text" className="auth-btn">
                Зарегистрироваться
              </Button>
              <Button type="primary" className="auth-btn">
                Войти
              </Button>
            </Space>
          </div>
        </div>
      </Header>
      
      {/* Основной контент */}
      <Content className="app-content">
        <div className="hero-section">
          <Title level={1} className="hero-title">
            Привет! Чем я могу помочь?
          </Title>
          
          {/* Поле поиска/ввода */}
          <div className="search-section">
            <Search
              placeholder="Ask something..."
              enterButton={<SearchOutlined />}
              size="large"
              className="main-search"
              onSearch={handleSearch}
            />
          </div>

          {/* Категории */}
          <div className="categories-section">
            <Row gutter={[16, 16]} justify="center">
              {categories.map((category, index) => (
                <Col xs={12} sm={6} key={category.name}>
                  <Card 
                    className="category-card" 
                    hoverable
                    onClick={() => handleCategoryClick(category.name)}
                  >
                    <div className="category-content">
                      <div className="category-icon">{category.icon}</div>
                      <Text strong>{category.name}</Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>

        {/* Модальное окно чата */}
        <ChatModal
          visible={chatModalVisible}
          onClose={() => setChatModalVisible(false)}
          category={selectedCategory}
        />
      </Content>
    </Layout>
  );
}

export default App;