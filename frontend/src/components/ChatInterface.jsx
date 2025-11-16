import React, { useState, useRef, useEffect } from 'react';
import {
  Input,
  Button,
  Avatar,
  List,
  Typography,
  Space,
  Tag,
  Divider,
  Dropdown,
  message,
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  PaperClipOutlined,
  MoreOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import FileUpload from './FileUpload';
import AgentSelector from './MCP';
import './ChatInterface.css';

const TextArea = Input.TextArea;
const { Text } = Typography;

const getUserChatsKey = (userId) => `chat-history-${userId}`;

const ChatInterface = ({ activeCategory, categories, currentUser }) => {
  const [messages, setMessages] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false); // Флаг инициализации
  const messagesEndRef = useRef(null);

  // === Загрузка истории ===
  useEffect(() => {
    console.log('=== ЗАГРУЗКА ИСТОРИИ ===');
    console.log('currentUser:', currentUser);
    
    if (!currentUser) {
      console.log('Нет пользователя - очищаем сообщения');
      setMessages({});
      setIsInitialized(false);
      return;
    }

    try {
      const key = getUserChatsKey(currentUser.id);
      const saved = localStorage.getItem(key);
      console.log('Ключ в localStorage:', key);
      console.log('Найденные данные:', saved);

      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Парсинг успешен:', parsed);

        // Восстанавливаем структуру сообщений
        const restoredMessages = {};
        Object.keys(parsed).forEach(categoryId => {
          if (Array.isArray(parsed[categoryId])) {
            restoredMessages[categoryId] = parsed[categoryId].map(msg => ({
              ...msg,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
            }));
          }
        });

        console.log('Восстановленные сообщения:', restoredMessages);
        setMessages(restoredMessages);
        setIsInitialized(true); // Помечаем что инициализация завершена
      } else {
        console.log('Нет сохраненных данных - инициализируем пустой объект');
        setMessages({});
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('ОШИБКА загрузки:', error);
      setMessages({});
      setIsInitialized(true);
    }
  }, [currentUser]);

  // === Сохранение истории ===
  useEffect(() => {
    if (!currentUser || !isInitialized) return;

    console.log('=== СОХРАНЕНИЕ ИСТОРИИ ===');
    console.log('Текущие сообщения:', messages);

    if (Object.keys(messages).length > 0) {
      try {
        const key = getUserChatsKey(currentUser.id);
        const dataToSave = JSON.stringify(messages);
        localStorage.setItem(key, dataToSave);
        console.log('✅ УСПЕШНО сохранено в localStorage');
      } catch (error) {
        console.error('❌ ОШИБКА сохранения:', error);
      }
    }
  }, [messages, currentUser, isInitialized]);

  // === Приветственное сообщение ТОЛЬКО для новых категорий ===
  useEffect(() => {
    if (!currentUser || !isInitialized) return;
    
    // Создаем приветственное сообщение только если категория полностью новая
    if (!messages[activeCategory]) {
      console.log('Создаем приветственное сообщение для новой категории:', activeCategory);
      
      const cat = categories.find(c => c.id === activeCategory);
      const welcome = {
        id: Date.now(),
        text: getWelcomeMessage(activeCategory, cat?.name),
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => {
        const newMessages = {
          ...prev,
          [activeCategory]: [welcome]
        };
        console.log('Новые сообщения после приветствия:', newMessages);
        return newMessages;
      });
    }
  }, [activeCategory, categories, currentUser, messages, isInitialized]);

  const getWelcomeMessage = (id, name) => {
    const map = {
      general: 'Здравствуйте! Я AlphaCopilot — ваш ИИ-помощник для бизнеса. Задайте любой вопрос!',
      finance: `Добро пожаловать в раздел "${name}"! Помогу с налогами, отчётностью и финансами.`,
      marketing: `Добро пожаловать в раздел "${name}"! Готов помочь с продвижением и клиентами.`,
      legal: `Добро пожаловать в раздел "${name}"! Юридические вопросы — моя специализация.`,
      hr: `Добро пожаловать в раздел "${name}"! Помогу с персоналом и мотивацией.`,
    };
    return map[id] || map.general;
  };

  // === Скролл вниз ===
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages[activeCategory]]);

  // === Копирование ===
  const handleCopyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('Скопировано!');
    } catch {
      message.error('Не удалось скопировать');
    }
  };

  // === Редактирование ===
  const startEdit = (id, text) => {
    setEditingId(id);
    setEditValue(text);
  };

  const saveEdit = () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      message.warning('Сообщение не может быть пустым');
      return;
    }
    setMessages(prev => {
      const msgs = prev[activeCategory] || [];
      const idx = msgs.findIndex(m => m.id === editingId);
      if (idx === -1) return prev;
      const updated = [...msgs];
      updated[idx] = { ...updated[idx], text: trimmed, edited: true };
      return { ...prev, [activeCategory]: updated };
    });
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // === Удаление ===
  const handleDeleteMessage = (id) => {
    setMessages(prev => {
      const msgs = prev[activeCategory] || [];
      const idx = msgs.findIndex(m => m.id === id);
      if (idx === -1) return prev;
      return { ...prev, [activeCategory]: msgs.slice(0, idx) };
    });
    message.success('Сообщение и ответы удалены');
  };

  // === Меню действий ===
  const MessageActions = ({ message }) => {
    const items = [
      { key: 'copy', label: 'Копировать', icon: <CopyOutlined />, onClick: () => handleCopyMessage(message.text) },
    ];

    if (message.sender === 'user') {
      items.push(
        { key: 'edit', label: 'Редактировать', icon: <EditOutlined />, onClick: () => startEdit(message.id, message.text) },
        { key: 'delete', label: 'Удалить', icon: <DeleteOutlined />, danger: true, onClick: () => handleDeleteMessage(message.id) }
      );
    }

    return (
      <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
        <Button type="text" icon={<MoreOutlined />} size="small" />
      </Dropdown>
    );
  };

  // === Загрузка файлов ===
  const handleFilesUpload = (files) => {
    const msg = {
      id: Date.now(),
      text: `Загружено файлов: ${files.length}. ${files.map(f => f.name).join(', ')}`,
      sender: 'user',
      timestamp: new Date(),
      files,
    };
    
    setMessages(prev => {
      const newMessages = {
        ...prev, 
        [activeCategory]: [...(prev[activeCategory] || []), msg] 
      };
      return newMessages;
    });
    
    setShowFileUpload(false);

    setTimeout(() => {
      const bot = {
        id: Date.now() + 1,
        text: 'Файлы получены и анализируются.',
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => {
        const newMessages = {
          ...prev, 
          [activeCategory]: [...(prev[activeCategory] || []), bot] 
        };
        return newMessages;
      });
    }, 2000);
  };

  // === Отправка сообщения ===
  const handleSend = () => {
    if (!currentUser) {
      message.error('Войдите в систему');
      return;
    }
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => {
      const currentCategoryMessages = prev[activeCategory] || [];
      const newMessages = {
        ...prev,
        [activeCategory]: [...currentCategoryMessages, userMessage]
      };
      return newMessages;
    });
    
    setInputValue('');
    setLoading(true);

    // Ответ бота
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        text: getCategoryResponse(activeCategory, inputValue),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => {
        const currentCategoryMessages = prev[activeCategory] || [];
        const newMessages = {
          ...prev,
          [activeCategory]: [...currentCategoryMessages, botMessage]
        };
        return newMessages;
      });
      
      setLoading(false);
    }, 1000 + Math.random() * 1000);
  };

  const getCategoryResponse = (id, msg) => {
    const lower = msg.toLowerCase();
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

    const categoryResponses = responses[id] || responses.general;
    
    if (lower.includes('налог') || lower.includes('налоги')) return categoryResponses.tax || categoryResponses.default;
    if (lower.includes('отчет') || lower.includes('отчетность')) return categoryResponses.report || categoryResponses.default;
    if (lower.includes('план') || lower.includes('бюджет')) return categoryResponses.planning || categoryResponses.default;
    if (lower.includes('соцсет') || lower.includes('instagram')) return categoryResponses.social || categoryResponses.default;
    if (lower.includes('продвижен') || lower.includes('реклам')) return categoryResponses.promotion || categoryResponses.default;
    if (lower.includes('клиент') || lower.includes('покупател')) return categoryResponses.clients || categoryResponses.default;
    if (lower.includes('договор') || lower.includes('контракт')) return categoryResponses.contract || categoryResponses.default;
    if (lower.includes('права') || lower.includes('обязанност')) return categoryResponses.rights || categoryResponses.default;
    if (lower.includes('требован') || lower.includes('закон')) return categoryResponses.compliance || categoryResponses.default;
    if (lower.includes('найм') || lower.includes('сотрудник')) return categoryResponses.hiring || categoryResponses.default;
    if (lower.includes('управлен') || lower.includes('руководств')) return categoryResponses.management || categoryResponses.default;
    if (lower.includes('мотивац') || lower.includes('стимул')) return categoryResponses.motivation || categoryResponses.default;
    
    return categoryResponses.default;
  };

  const currentMessages = messages[activeCategory] || [];
  const currentCategory = categories.find(c => c.id === activeCategory);

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <Space>
          <Avatar size="large" icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <Text strong style={{ fontSize: 18 }}>{currentCategory?.name || 'Чат'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{currentCategory?.description || 'Задавайте вопросы'}</Text>
          </div>
        </Space>
        <Tag color="blue">{currentMessages.length} сообщ.</Tag>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      <div className="messages-container">
        <List
          dataSource={currentMessages}
          renderItem={(message) => (
            <List.Item className={`message-item ${message.sender}-message`}>
              <Space align="start" size="middle" style={{ width: '100%' }}>
                <Avatar
                  icon={message.sender === 'bot' ? <RobotOutlined /> : <UserOutlined />}
                  style={{ backgroundColor: message.sender === 'bot' ? '#1890ff' : '#52c41a' }}
                />
                <div className="message-content" style={{ flex: 1 }}>
                  {editingId === message.id ? (
                    <Space.Compact style={{ width: '100%' }}>
                      <TextArea
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        autoSize={{ minRows: 1, maxRows: 6 }}
                        autoFocus
                      />
                      <Button type="primary" size="small" onClick={saveEdit}>Сохранить</Button>
                      <Button size="small" onClick={cancelEdit}>Отмена</Button>
                    </Space.Compact>
                  ) : (
                    <>
                      <div className="message-header">
                        <Text strong>{message.sender === 'bot' ? 'AlphaCopilot' : currentUser?.username || 'Вы'}</Text>
                        <MessageActions message={message} />
                      </div>
                      <Text className="message-text">
                        {message.text}
                        {message.edited && <Text type="secondary" style={{ fontSize: 10, marginLeft: 4 }}>(ред.)</Text>}
                      </Text>
                      {message.files && (
                        <div className="file-attachments">
                          <PaperClipOutlined /> {message.files.length} файл(ов)
                        </div>
                      )}
                      <div className="message-time">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </>
                  )}
                </div>
              </Space>
            </List.Item>
          )}
        />
        {loading && (
          <div className="message-item bot-message">
            <Space>
              <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <Text type="secondary">Печатает...</Text>
            </Space>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showFileUpload && <FileUpload onFilesUpload={handleFilesUpload} />}

      <div className="input-container">
        <Space.Compact style={{ width: '100%' }}>
          <AgentSelector />
          <TextArea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Сообщение в "${currentCategory?.name || 'чат'}"...`}
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={!currentUser}
          />
          <Button
            icon={<PaperClipOutlined />}
            onClick={() => setShowFileUpload(!showFileUpload)}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
            disabled={!currentUser || !inputValue.trim()}
          >
            Отправить
          </Button>
        </Space.Compact>
      </div>
    </div>
  );
};

export default ChatInterface;