import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Avatar, List, Typography, Space, Tag, Divider, Dropdown, message } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, PaperClipOutlined, MoreOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import FileUpload from './FileUpload';
import './ChatInterface.css';

const { TextArea } = Input;
const { Text } = Typography;

// Хелперы для работы с user-specific данными
const getUserChatsKey = (userId) => `sorilotx-chat-history-${userId}`;

const ChatInterface = ({ activeCategory, categories, onUnreadUpdate, currentUser }) => {
  const [messages, setMessages] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCategories, setUnreadCategories] = useState(new Set());
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef(null);

  // Загрузка истории из localStorage
  useEffect(() => {
    if (!currentUser) {
      setMessages({});
      return;
    }

    const userChatsKey = getUserChatsKey(currentUser.id);
    const savedMessages = localStorage.getItem(userChatsKey);
    const savedUnread = localStorage.getItem('sorilotx-unread-categories');
    
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      Object.keys(parsedMessages).forEach(key => {
        parsedMessages[key] = parsedMessages[key].map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      });
      setMessages(parsedMessages);
    }

    if (savedUnread) {
      setUnreadCategories(new Set(JSON.parse(savedUnread)));
    }
  }, [currentUser]);

  // Сохранение истории в localStorage
  useEffect(() => {
    if (Object.keys(messages).length > 0 && currentUser) {
      const userChatsKey = getUserChatsKey(currentUser.id);
      localStorage.setItem(userChatsKey, JSON.stringify(messages));
    }
  }, [messages, currentUser]);

  // Помечаем категорию как прочитанную при активации
  useEffect(() => {
    if (activeCategory && unreadCategories.has(activeCategory)) {
      const newUnread = new Set(unreadCategories);
      newUnread.delete(activeCategory);
      setUnreadCategories(newUnread);
      localStorage.setItem('sorilotx-unread-categories', JSON.stringify([...newUnread]));
    }
  }, [activeCategory, unreadCategories]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages[activeCategory]]);

  // Инициализация категории если её нет
  useEffect(() => {
    if (!currentUser) return;
    
    if (!messages[activeCategory]) {
      const category = categories.find(cat => cat.id === activeCategory);
      const welcomeMessage = {
        id: Date.now(),
        text: getWelcomeMessage(activeCategory, category?.name),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => ({
        ...prev,
        [activeCategory]: [welcomeMessage]
      }));
    }
  }, [activeCategory, categories, messages, currentUser]);

  const getWelcomeMessage = (categoryId, categoryName) => {
    const welcomeMessages = {
      general: 'Здравствуйте! Я СорilotX - ваш ИИ-помощник для бизнеса. Задайте любой вопрос, и я постараюсь помочь!',
      finance: `Добро пожаловать в раздел "${categoryName}"! Здесь я могу помочь с вопросами налогов, финансового планирования, отчетности и оптимизации расходов. Что вас интересует?`,
      marketing: `Добро пожаловать в раздел "${categoryName}"! Готов помочь с маркетинговыми стратегиями, продвижением в соцсетях, привлечением клиентов и аналитикой. Что вас волнует?`,
      legal: `Добро пожаловать в раздел "${categoryName}"! Могу помочь с юридическими вопросами: договоры, права предпринимателей, compliance и регулирование. Чем могу помочь?`,
      hr: `Добро пожаловать в раздел "${categoryName}"! Здесь я могу помочь с вопросами найма, управления персоналом, мотивации сотрудников и HR-процессами. Что вас интересует?`
    };
    return welcomeMessages[categoryId] || welcomeMessages.general;
  };

  // Функция для удаления сообщения и всего что ниже
  const handleDeleteMessage = (messageId) => {
    setMessages(prev => {
      const categoryMessages = prev[activeCategory] || [];
      const index = categoryMessages.findIndex(msg => msg.id === messageId);
      
      if (index !== -1) {
        const newMessages = {
          ...prev,
          [activeCategory]: categoryMessages.slice(0, index)
        };
        return newMessages;
      }
      return prev;
    });
    message.success('Сообщение и последующий диалог удалены');
  };

  // Функция для копирования текста
  const handleCopyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('Текст скопирован');
    } catch (err) {
      message.error('Не удалось скопировать текст');
    }
  };

  // Компонент действий для сообщения
  const MessageActions = ({ message }) => {
    const menuItems = [
      {
        key: 'copy',
        label: 'Копировать текст',
        icon: <CopyOutlined />,
        onClick: () => handleCopyMessage(message.text)
      }
    ];

    // Только для пользовательских сообщений добавляем удаление
    if (message.sender === 'user') {
      menuItems.push({
        key: 'delete',
        label: 'Удалить и очистить диалог ниже',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteMessage(message.id)
      });
    }

    return (
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Button 
          type="text" 
          icon={<MoreOutlined />} 
          size="small"
          className="message-actions-btn"
        />
      </Dropdown>
    );
  };

  const handleFilesUpload = (files) => {
    const fileMessage = {
      id: Date.now(),
      text: `Загружено файлов: ${files.length}. ${files.map(f => f.name).join(', ')}`,
      sender: 'user',
      timestamp: new Date(),
      files: files
    };

    setMessages(prev => ({
      ...prev,
      [activeCategory]: [...(prev[activeCategory] || []), fileMessage]
    }));

    setShowFileUpload(false);

    // Имитация анализа файлов
    setTimeout(() => {
      const analysisMessage = {
        id: Date.now() + 1,
        text: `Файлы получены и анализируются. Я готов ответить на вопросы по их содержимому.`,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => ({
        ...prev,
        [activeCategory]: [...(prev[activeCategory] || []), analysisMessage]
      }));
    }, 2000);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => ({
      ...prev,
      [activeCategory]: [...(prev[activeCategory] || []), userMessage]
    }));
    setInputValue('');
    setLoading(true);

    // Добавляем в непрочитанные для других категорий
    categories.forEach(cat => {
      if (cat.id !== activeCategory && !unreadCategories.has(cat.id)) {
        const newUnread = new Set(unreadCategories);
        newUnread.add(cat.id);
        setUnreadCategories(newUnread);
        localStorage.setItem('sorilotx-unread-categories', JSON.stringify([...newUnread]));
      }
    });

    // Имитация ответа ИИ
    setTimeout(() => {
      const responseText = getCategoryResponse(activeCategory, inputValue);
      
      const botMessage = {
        id: Date.now() + 1,
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => ({
        ...prev,
        [activeCategory]: [...(prev[activeCategory] || []), botMessage]
      }));
      setLoading(false);
    }, 1000 + Math.random() * 1000);
  };

  const getCategoryResponse = (categoryId, userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    const responses = {
      finance: {
        default: 'Для финансовых вопросов рекомендую: вести регулярный учет доходов/расходов, использовать УСН для оптимизации налогов, создавать финансовую подушку безопасности.',
        tax: 'Для ИП на УСН основные налоги: 6% с доходов или 15% с доходов за вычетом расходов. Также нужно платить страховые взносы.',
        report: 'Основные отчеты для ИП: декларация по УСН (до 30 апреля), отчетность за сотрудников в ПФР, ФСС и ФНС.',
        planning: 'Для финансового планирования: определите ежемесячные расходы, создайте резервный фонд (3-6 месяцев расходов), планируйте налоги заранее.'
      },
      marketing: {
        default: 'Для маркетинга малого бизнеса: используйте соцсети для вовлечения аудитории, запустите реферальную программу, работайте с отзывами клиентов.',
        social: 'Для продвижения в соцсетях: публикуйте полезный контент, используйте сторис и reels, взаимодействуйте с аудиторией в комментариях.',
        promotion: 'Эффективные методы продвижения: локальный SEO, контекстная реклама, сотрудничество с блогерами, email-рассылки.',
        clients: 'Для привлечения клиентов: предложите бесплатную консультацию, запустите акцию для новых клиентов, используйте отзывы в рекламе.'
      },
      legal: {
        default: 'По юридическим вопросам: всегда заключайте письменные договоры, ведите документацию properly, консультируйтесь со специалистом при сложных вопросах.',
        contract: 'В договоре обязательно укажите: предмет, сроки, стоимость, ответственность сторон, порядок разрешения споров.',
        rights: 'Основные права ИП: свободная предпринимательская деятельность, выбор системы налогообложения, защита прав в суде.',
        compliance: 'Для соблюдения требований: ведите кассовую дисциплину, храните документы 4-5 лет, своевременно сдавайте отчетность.'
      },
      hr: {
        default: 'Для HR вопросов: разработайте четкие должностные инструкции, внедрите систему onboarding, регулярно проводите оценку сотрудников.',
        hiring: 'При найме сотрудников: составьте понятное описание вакансии, проводите структурированные собеседования, проверяйте рекомендации.',
        management: 'Для управления персоналом: установите четкие KPI, проводите регулярные встречи 1-на-1, создавайте карьерные треки.',
        motivation: 'Методы мотивации: конкурентная зарплата, бонусы за результаты, обучение за счет компании, гибкий график.'
      },
      general: {
        default: 'Благодарю за вопрос! Как ИИ-помощник для бизнеса, я могу помочь с финансами, маркетингом, юридическими вопросами и управлением персоналом. Выберите конкретную тему или задайте свой вопрос.'
      }
    };

    const categoryResponses = responses[categoryId] || responses.general;
    
    if (lowerMessage.includes('налог') || lowerMessage.includes('налоги')) return categoryResponses.tax || categoryResponses.default;
    if (lowerMessage.includes('отчет') || lowerMessage.includes('отчетность')) return categoryResponses.report || categoryResponses.default;
    if (lowerMessage.includes('план') || lowerMessage.includes('бюджет')) return categoryResponses.planning || categoryResponses.default;
    if (lowerMessage.includes('соцсет') || lowerMessage.includes('instagram')) return categoryResponses.social || categoryResponses.default;
    if (lowerMessage.includes('продвижен') || lowerMessage.includes('реклам')) return categoryResponses.promotion || categoryResponses.default;
    if (lowerMessage.includes('клиент') || lowerMessage.includes('покупател')) return categoryResponses.clients || categoryResponses.default;
    if (lowerMessage.includes('договор') || lowerMessage.includes('контракт')) return categoryResponses.contract || categoryResponses.default;
    if (lowerMessage.includes('права') || lowerMessage.includes('обязанност')) return categoryResponses.rights || categoryResponses.default;
    if (lowerMessage.includes('требован') || lowerMessage.includes('закон')) return categoryResponses.compliance || categoryResponses.default;
    if (lowerMessage.includes('найм') || lowerMessage.includes('сотрудник')) return categoryResponses.hiring || categoryResponses.default;
    if (lowerMessage.includes('управлен') || lowerMessage.includes('руководств')) return categoryResponses.management || categoryResponses.default;
    if (lowerMessage.includes('мотивац') || lowerMessage.includes('стимул')) return categoryResponses.motivation || categoryResponses.default;
    
    return categoryResponses.default;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentMessages = messages[activeCategory] || [];
  const currentCategory = categories.find(cat => cat.id === activeCategory);

  return (
    <div className="chat-interface">
      {/* Заголовок чата */}
      <div className="chat-header">
        <Space>
          <Avatar 
            size="large" 
            icon={<RobotOutlined />} 
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <Text strong style={{ fontSize: '18px' }}>
              {currentCategory?.name || 'Общий чат'}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {currentCategory?.description || 'Задавайте любые вопросы'}
            </Text>
          </div>
        </Space>
        <Tag color="blue" className="message-count">
          {currentMessages.length} сообщений
        </Tag>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Область сообщений */}
      <div className="messages-container">
        <List
          dataSource={currentMessages}
          renderItem={(message) => (
            <List.Item className={`message-item ${message.sender}-message`}>
              <Space align="start" size="middle" style={{ width: '100%' }}>
                <Avatar 
                  size="default"
                  icon={message.sender === 'bot' ? <RobotOutlined /> : <UserOutlined />}
                  style={{ 
                    backgroundColor: message.sender === 'bot' ? '#1890ff' : '#52c41a',
                    flexShrink: 0
                  }}
                />
                <div className="message-content" style={{ flex: 1 }}>
                  <div className="message-header">
                    <Text strong className="message-sender">
                      {message.sender === 'bot' ? 'SoriPilotX' : 'Вы'}
                    </Text>
                    <MessageActions message={message} />
                  </div>
                  <Text className="message-text">{message.text}</Text>
                  {message.files && (
                    <div className="file-attachments">
                      <PaperClipOutlined style={{ marginRight: 4 }} />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Прикреплено {message.files.length} файлов
                      </Text>
                    </div>
                  )}
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
            <Space align="start" size="middle" style={{ width: '100%' }}>
              <Avatar size="default" icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <div className="message-content">
                <Text type="secondary" className="typing-indicator">
                  СорilotX печатает...
                </Text>
              </div>
            </Space>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Загрузка файлов */}
      {showFileUpload && (
        <div className="file-upload-section">
          <FileUpload onFilesUpload={handleFilesUpload} />
        </div>
      )}

      {/* Поле ввода */}
      <div className="input-container">
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Задайте вопрос о ${currentCategory?.name.toLowerCase() || 'бизнесе'}...`}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ resize: 'none', borderRadius: '8px 0 0 8px' }}
          />
          <Button 
            type="default" 
            icon={<PaperClipOutlined />}
            onClick={() => setShowFileUpload(!showFileUpload)}
            style={{ height: 'auto', borderRadius: 0 }}
          />
          <Button 
            type="primary" 
            icon={<SendOutlined />} 
            onClick={handleSend}
            loading={loading}
            style={{ 
              height: 'auto', 
              borderRadius: '0 8px 8px 0',
              padding: '0 20px'
            }}
            disabled={!inputValue.trim()}
          >
            Отправить
          </Button>
        </Space.Compact>
      </div>
    </div>
  );
};

export default ChatInterface;