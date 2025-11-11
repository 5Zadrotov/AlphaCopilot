import React from 'react';
import { Card, List, Typography, Space, Tag, Button, Divider } from 'antd';
import { BulbOutlined, RocketOutlined, FileTextOutlined } from '@ant-design/icons';
import FileUpload from './FileUpload';
import './Sidebar.css';

const { Title, Text } = Typography;

const Sidebar = ({ onExampleSelect, onFileAnalysis }) => {
  const businessExamples = [
    // ... существующие примеры остаются без изменений ...
    {
      category: 'Финансы',
      examples: [
        'Как оптимизировать налоги для ИП?',
        'Составь финансовый план на квартал',
        'Какие отчеты нужно сдавать в налоговую?'
      ]
    },
    {
      category: 'Маркетинг',
      examples: [
        'Придумай идеи для акции в кофейне',
        'Как продвигать бизнес в соцсетях?',
        'Составь коммерческое предложение'
      ]
    },
    {
      category: 'Юридические вопросы',
      examples: [
        'Как правильно составить договор с поставщиком?',
        'Какие права у ИП при проверках?',
        'Нужно ли заключать трудовой договор с сотрудником?'
      ]
    },
    {
      category: 'Операционное управление',
      examples: [
        'Как увеличить средний чек в магазине?',
        'Составь чек-лист открытия кафе',
        'Какие показатели отслеживать в бизнесе?'
      ]
    }
  ];

  const handleFileAnalysis = (file) => {
    onFileAnalysis?.(file);
  };

  return (
    <div className="sidebar-container">
      <FileUpload onFileAnalysis={handleFileAnalysis} />
      
      <Card className="examples-card" size="small">
        <div className="sidebar-content">
          <Space style={{ marginBottom: '12px' }}>
            <BulbOutlined />
            <Text strong>Примеры запросов</Text>
          </Space>
          
          <Text type="secondary" style={{ fontSize: '12px', marginBottom: '16px', display: 'block' }}>
            Нажмите на пример, чтобы начать диалог
          </Text>
          
          {businessExamples.map((section, index) => (
            <div key={index} className="example-section">
              <Title level={5} style={{ marginBottom: '8px', color: '#1890ff' }}>
                {section.category}
              </Title>
              <List
                size="small"
                dataSource={section.examples}
                renderItem={(example, exampleIndex) => (
                  <List.Item className="example-item">
                    <Button 
                      type="text" 
                      size="small" 
                      onClick={() => onExampleSelect(example)}
                      className="example-button"
                    >
                      <Space align="start">
                        <RocketOutlined style={{ color: '#52c41a', fontSize: '12px', marginTop: '2px' }} />
                        <Text style={{ textAlign: 'left', fontSize: '12px' }}>
                          {example}
                        </Text>
                      </Space>
                    </Button>
                  </List.Item>
                )}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Sidebar;