import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Avatar, List, Typography, Space, Card, Row, Col } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';
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

  const handleSend = async (text = inputValue) => {
    const messageText = text || inputValue;
    if (!messageText.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    // Имитация ответа от ИИ с разными сценариями (все это вырежется на этапе совмещения с беком)
    setTimeout(() => {
      const responses = {
        'налог': 'Для оптимизации налогов ИП рекомендую рассмотреть упрощенную систему налогообложения (УСН). Также можно использовать налоговые вычеты и правильно классифицировать расходы. Хотите более детальный разбор для вашего конкретного случая?',
        'маркетинг': 'Для эффективного маркетинга малого бизнеса: 1) Используйте соцсети с контентом для вашей ЦА, 2) Запустите программу лояльности, 3) Сотрудничайте с локными блогерами. Какой у вас тип бизнеса?',
        'договор': 'При составлении договора с поставщиком обязательно укажите: предмет договора, сроки поставки, условия оплаты, ответственность сторон и порядок разрешения споров. Нужен шаблон договора?',
        'чек': 'Чтобы увеличить средний чек: 1) Предлагайте сопутствующие товары, 2) Внедрите программу лояльности, 3) Создайте премиальные пакеты, 4) Обучите сотрудников технике допродаж.'
      };

      let responseText = 'Это демо-версия чата. В реальном приложении здесь будет персонализированный ответ от ИИ-модели, учитывающий специфику вашего бизнеса.';

      const lowerText = messageText.toLowerCase();
      if (lowerText.includes('налог')) responseText = responses.налог;
      else if (lowerText.includes('маркетинг') || lowerText.includes('продвиж')) responseText = responses.маркетинг;
      else if (lowerText.includes('договор')) responseText = responses.договор;
      else if (lowerText.includes('чек')) responseText = responses.чек;

      const botMessage = {
        id: messages.length + 2,
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
    }, 1500);
  };

  const handleExampleSelect = (example) => {
    setInputValue(example);
    setTimeout(() => {
      handleSend(example);
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Row gutter={[16, 16]} className="chat-layout">
      <Col xs={24} md={8}>
        <Sidebar onExampleSelect={handleExampleSelect} />
      </Col>
      <Col xs={24} md={16}>
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
                onClick={() => handleSend()}
                loading={loading}
                style={{ height: 'auto' }}
              >
                Отправить
              </Button>
            </Space.Compact>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default ChatInterface;