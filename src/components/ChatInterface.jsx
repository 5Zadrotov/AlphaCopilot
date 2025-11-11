import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Avatar, List, Typography, Space, Card } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import './ChatInterface.css';

const { TextArea } = Input;
const { Text } = Typography;

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Здравствуйте! Я ваш ИИ-помощник от Альфа-Банка. Чем могу помочь вашему бизнесу сегодня?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        text: 'Это пробник чата. В реальном приложении здесь будет ответ от ИИ-шки',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="chat-container">
      <div className="chat-header">
        <Space>
          <Avatar 
            size="large" 
            icon={<RobotOutlined />} 
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <Text strong>Альфа-Помощник</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Готов помочь с вашим бизнесом
            </Text>
          </div>
        </Space>
      </div>

      <div className="messages-container">
        <List
          dataSource={messages}
          renderItem={(message) => (
            <List.Item className={`message-item ${message.sender}-message`}>
              <Space align="start" size="middle">
                <Avatar 
                  size="small"
                  icon={message.sender === 'bot' ? <RobotOutlined /> : <UserOutlined />}
                  style={{ 
                    backgroundColor: message.sender === 'bot' ? '#1890ff' : '#52c41a',
                    flexShrink: 0
                  }}
                />
                <div className="message-content">
                  <Text>{message.text}</Text>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </Space>
            </List.Item>
          )}
        />
        {loading && (
          <div className="message-item bot-message">
            <Space align="start" size="middle">
              <Avatar size="small" icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <div className="message-content">
                <Text type="secondary">Помощник печатает...</Text>
              </div>
            </Space>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Задайте вопрос о вашем бизнесе..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ resize: 'none' }}
          />
          <Button 
            type="primary" 
            icon={<SendOutlined />} 
            onClick={handleSend}
            loading={loading}
            style={{ height: 'auto' }}
          >
            Отправить
          </Button>
        </Space.Compact>
      </div>
    </Card>
  );
};

export default ChatInterface;