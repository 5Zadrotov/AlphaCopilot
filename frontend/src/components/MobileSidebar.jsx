import React from 'react';
import { Card, Typography, Button, Space, Badge } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const MobileSidebar = ({ 
  categories, 
  activeCategory, 
  onCategoryClick, 
  onCreateChat,
  currentUser 
}) => {
  return (
    <div className="mobile-sidebar">
      <div className="mobile-welcome-section">
        <Title level={4} className="mobile-welcome-title">
          {currentUser ? `Привет, ${currentUser.username}!` : 'Привет!'} Чем я могу помочь?
        </Title>
      </div>
      
      <div className="mobile-categories-section">
        <div className="mobile-categories-header">
          <Text strong className="mobile-categories-title">Темы для обсуждения:</Text>
          <Button 
            type="primary" 
            size="small" 
            icon={<PlusOutlined />}
            onClick={onCreateChat}
            disabled={!currentUser}
          >
            Новая тема
          </Button>
        </div>
        
        <div className="mobile-categories-list">
          {categories.map((category) => (
            <Badge 
              key={category.id}
              dot={false}
              offset={[-5, 5]}
              color="red"
            >
              <Card 
                className={`mobile-category-card ${activeCategory === category.id ? 'mobile-active' : ''}`}
                size="small"
                onClick={() => onCategoryClick(category.id)}
              >
                <div className="mobile-category-content">
                  <div className="mobile-category-icon">{category.icon}</div>
                  <div className="mobile-category-text">
                    <Text strong className="mobile-category-name">
                      {category.name}
                    </Text>
                    <Text type="secondary" className="mobile-category-description">
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
};

export default MobileSidebar;