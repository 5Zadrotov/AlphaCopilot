import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import ChatInterface from './components/ChatInterface';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function App() {
  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <Space align="center" style={{ width: '100%', justifyContent: 'center' }}>
          <RocketOutlined style={{ fontSize: '24px', color: 'white' }} />
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            Альфа-Будущее
          </Title>
        </Space>
      </Header>
      
      <Content className="app-content">
        <div className="hero-section">
          <Title level={2}>ИИ-помощник для вашего бизнеса</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Получайте "умные" ответы на вопросы о финансах и управлении бизнесом
          </Text>
        </div>
        
        <ChatInterface />
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"></div>
            <Text strong>Бизнес-консультации</Text>
            <Text type="secondary">Помощь в принятии управленческих решений</Text>
          </div>
          <div className="feature-card">
            <div className="feature-icon"></div>
            <Text strong>Юридические вопросы</Text>
            <Text type="secondary">Ответы на правовые вопросы бизнеса</Text>
          </div>
          <div className="feature-card">
            <div className="feature-icon"></div>
            <Text strong>Финансовый анализ</Text>
            <Text type="secondary">Анализ финансовых показателей</Text>
          </div>
          <div className="feature-card">
            <div className="feature-icon"></div>
            <Text strong>Маркетинг</Text>
            <Text type="secondary">Советы по продвижению бизнеса</Text>
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default App;