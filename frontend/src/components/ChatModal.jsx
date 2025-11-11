import React, { useState, useRef, useEffect } from 'react';
import { Modal, Input, Button, Avatar, List, Typography, Space } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, CloseOutlined } from '@ant-design/icons';
import './ChatModal.css';

const { TextArea } = Input;
const { Text } = Typography;

const ChatModal = ({ visible, onClose, category }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: category ? `Чем могу помочь с вопросами по ${category.toLowerCase()}?` : 'Здравствуйте! Чем могу помочь вашему бизнесу сегодня?',
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
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    // Имитация ответа ИИ
    setTimeout(() => {
      const responses = {
        'Финансы': 'Для финансовых вопросов рекомендую: вести регулярный учет доходов/расходов, использовать УСН для оптимизации налогов, создавать финансовую подушку безопасности.',
        'Маркетинг': 'Для маркетинга малого бизнеса: используйте соцсети для вовлечения аудитории, запустите реферальную программу, работайте с отзывами клиентов.',
        'Юридическое': 'По юридическим вопросам: всегда заключайте письменные договоры, ведите документацию properly, консультируйтесь со специалистом при сложных вопросах.',
        'HR': 'Для HR вопросов: разработайте четкие должностные инструкции, внедрите систему onboarding, регулярно проводите оценку сотрудников.'
      };

      const responseText = responses[category] || 'Благодарю за вопрос! Как ИИ-помощник, я могу помочь с различными аспектами ведения бизнеса. Расскажите подробнее о вашей ситуации.';

      const botMessage = {
        id: Date.now() + 1,
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Modal
      title={
        <Space>
          <Avatar 
            size="small" 
            icon={<RobotOutlined />} 
            style={{ backgroundColor: '#1890ff' }}
          />
          <Text strong>СорilotX Помощник</Text>
          {category && <Text type="secondary">- {category}</Text>}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      className="chat-modal"
      closeIcon={<CloseOutlined style={{ color: '#fff' }} />}
    >
      <div className="modal-chat-container">
        <div className="modal-messages">
          <List
            dataSource={messages}
            renderItem={(message) => (
              <List.Item className={`modal-message-item ${message.sender}-message`}>
                <Space align="start" size="middle">
                  <Avatar 
                    size="small"
                    icon={message.sender === 'bot' ? <RobotOutlined /> : <UserOutlined />}
                    style={{ 
                      backgroundColor: message.sender === 'bot' ? '#1890ff' : '#52c41a',
                      flexShrink: 0
                    }}
                  />
                  <div className="modal-message-content">
                    <Text>{message.text}</Text>
                    <div className="modal-message-time">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </Space>
              </List.Item>
            )}
          />
          {loading && (
            <div className="modal-message-item bot-message">
              <Space align="start" size="middle">
                <Avatar size="small" icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
                <div className="modal-message-content">
                  <Text type="secondary">Помощник печатает...</Text>
                </div>
              </Space>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="modal-input-container">
          <Space.Compact style={{ width: '100%' }}>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Задайте ваш вопрос..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ resize: 'none' }}
            />
            <Button 
              type="primary" 
              icon={<SendOutlined />} 
              onClick={handleSend}
              loading={loading}
              style={{ height: 'auto' }}
              disabled={!inputValue.trim()}
            >
              Отправить
            </Button>
          </Space.Compact>
        </div>
      </div>
    </Modal>
  );
};

export default ChatModal;