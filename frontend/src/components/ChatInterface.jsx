import React, { useState, useRef, useEffect } from 'react';
import {
  Input, Button, Avatar, List, Typography, Space, Tag, Divider, Dropdown, message,
} from 'antd';
import {
  SendOutlined, UserOutlined, RobotOutlined, PaperClipOutlined,
  MoreOutlined, CopyOutlined, DeleteOutlined, EditOutlined,
} from '@ant-design/icons';
import FileUpload from './FileUpload';
import './ChatInterface.css';

const { TextArea } = Input;
const { Text } = Typography;

const getUserChatsKey = (userId) => `sorilotx-chat-history-${userId}`;

const ChatInterface = ({ activeCategory, categories, onUnreadUpdate, currentUser }) => {
  const [messages, setMessages] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCategories, setUnreadCategories] = useState(new Set());
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const messagesEndRef = useRef(null);

  // === Загрузка / Сохранение ===
  useEffect(() => {
    if (!currentUser) return;
    const key = getUserChatsKey(currentUser.id);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.keys(parsed).forEach(k => {
        parsed[k] = parsed[k].map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
      });
      setMessages(parsed);
    }

    // Загрузка непрочитанных
    const unread = localStorage.getItem('sorilotx-unread-categories');
    if (unread) setUnreadCategories(new Set(JSON.parse(unread)));
  }, [currentUser]);

  useEffect(() => {
    if (Object.keys(messages).length > 0 && currentUser) {
      localStorage.setItem(getUserChatsKey(currentUser.id), JSON.stringify(messages));
    }
  }, [messages, currentUser]);

  // === Прочитано ===
  useEffect(() => {
    if (activeCategory && unreadCategories.has(activeCategory)) {
      const newUnread = new Set(unreadCategories);
      newUnread.delete(activeCategory);
      setUnreadCategories(newUnread);
      localStorage.setItem('sorilotx-unread-categories', JSON.stringify([...newUnread]));
      onUnreadUpdate?.(newUnread.size);
    }
  }, [activeCategory, unreadCategories, onUnreadUpdate]);

  // === Скролл ===
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages[activeCategory]]);

  // === Приветствие ===
  useEffect(() => {
    if (!currentUser || messages[activeCategory]) return;
    const cat = categories.find(c => c.id === activeCategory);
    const welcome = {
      id: Date.now(),
      text: getWelcomeMessage(activeCategory, cat?.name),
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages(prev => ({ ...prev, [activeCategory]: [welcome] }));
  }, [activeCategory, categories, messages, currentUser]);

  const getWelcomeMessage = (id, name) => {
    const map = {
      general: 'Здравствуйте! Я СорilotX - ваш ИИ-помощник для бизнеса. Задайте любой вопрос, и я постараюсь помочь!',
      finance: `Добро пожаловать в раздел "${name}"! Здесь я могу помочь с вопросами налогов, финансового планирования, отчетности и оптимизации расходов. Что вас интересует?`,
      marketing: `Добро пожаловать в раздел ${name}! Готов помочь с маркетинговыми стратегиями, продвижением в соцсетях, привлечением клиентов и аналитикой. Что вас волнует?`,
      legal: `Добро пожаловать в раздел "${name}"! Могу помочь с юридическими вопросами: договоры, права предпринимателей, compliance и регулирование. Чем могу помочь?`,
      hr: `Добро пожаловать в раздел ${name}! Здесь я могу помочь с вопросами найма, управления персоналом, мотивации сотрудников и HR-процессами. Что вас интересует?`
    };
    return map[id] || map.general;
  };
// === УДАЛЕНИЕ (удаляет сообщение и всё ниже) ===
  const handleDeleteMessage = (id) => {
    setMessages(prev => {
      const msgs = prev[activeCategory] || [];
      const idx = msgs.findIndex(m => m.id === id);
      if (idx === -1) return prev;
      return { ...prev, [activeCategory]: msgs.slice(0, idx) };
    });
    message.success('Сообщение и диалог ниже удалены');
  };

  // === КОПИРОВАНИЕ ===
  const handleCopyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('Текст скопирован');
    } catch {
      message.error('Не удалось скопировать');
    }
  };

  // === РЕДАКТИРОВАНИЕ ===
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

  // === Действия над сообщением ===
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
        <Button type="text" icon={<MoreOutlined />} size="small" className="message-actions-btn" />
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
    setMessages(prev => ({ ...prev, [activeCategory]: [...(prev[activeCategory] || []), msg] }));
    setShowFileUpload(false);

    setTimeout(() => {
      const bot = { id: Date.now() + 1, text: 'Файлы получены и анализируются.', sender: 'bot', timestamp: new Date() };
      setMessages(prev => ({ ...prev, [activeCategory]: [...(prev[activeCategory] || []), bot] }));
    }, 2000);
  };

  // === Отправка сообщения ===
  const handleSend = () => {
    if (!inputValue.trim()) return;
    const msg = { id: Date.now(), text: inputValue.trim(), sender: 'user', timestamp: new Date() };
    setMessages(prev => ({ ...prev, [activeCategory]: [...(prev[activeCategory] || []), msg] }));
    setInputValue('');
    setLoading(true);

    // Помечаем другие категории как непрочитанные
    categories.forEach(cat => {
      if (cat.id !== activeCategory && !unreadCategories.has(cat.id)) {
        const newUnread = new Set(unreadCategories);
        newUnread.add(cat.id);
        setUnreadCategories(newUnread);
        localStorage.setItem('sorilotx-unread-categories', JSON.stringify([...newUnread]));
        onUnreadUpdate?.(newUnread.size);
      }
    });

    setTimeout(() => {
const bot = { id: Date.now() + 1, text: getCategoryResponse(activeCategory, inputValue), sender: 'bot', timestamp: new Date() };
      setMessages(prev => ({ ...prev, [activeCategory]: [...(prev[activeCategory] || []), bot] }));
      setLoading(false);
    }, 1000 + Math.random() * 1000);
  };

  const getCategoryResponse = (id, msg) => {
    const lower = msg.toLowerCase();
    const res = {
      finance: {
        default: 'Я помогу с финансовыми вопросами. Уточните, пожалуйста.',
        tax: 'Налоговые вопросы — моя специализация. Опишите ситуацию.',
        report: 'Готов помочь с составлением отчётности.',
        planning: 'Финансовое планирование — ключ к успеху. Расскажите о целях.',
      },
      marketing: {
        default: 'Маркетинг — это искусство. Что именно вас интересует?',
        social: 'SMM — мощный инструмент. Нужна стратегия?',
        promotion: 'Продвижение: от контента до рекламы. Готов помочь.',
        clients: 'Привлечение клиентов — приоритет. Есть ли воронка?',
      },
      legal: {
        default: 'Юридическая поддержка для бизнеса. Задайте вопрос.',
        contract: 'Договоры должны быть железными. Пришлите шаблон?',
        rights: 'Права предпринимателя — основа. В чём проблема?',
        compliance: 'Compliance — это не формальность. Нужен аудит?',
      },
      hr: {
        default: 'HR — сердце компании. Чем помочь?',
        hiring: 'Найм — это инвестиция. Ищем таланты?',
        management: 'Управление персоналом — это система. Нужны KPI?',
        motivation: 'Мотивация = производительность. Есть ли программа?',
      },
      general: { default: 'Спасибо за вопрос! Чем могу помочь?' },
    };

    const cat = res[id] || res.general;
    if (lower.includes('налог') || lower.includes('налоги')) return cat.tax || cat.default;
    if (lower.includes('отчет') || lower.includes('отчёт')) return cat.report  ||cat.default;
    if (lower.includes('план') || lower.includes('бюджет')) return cat.planning || cat.default;
    if (lower.includes('соцсеть') || lower.includes('реклама')) return cat.social || cat.default;
    if (lower.includes('клиент')) return cat.clients || cat.default;
    if (lower.includes('договор')) return cat.contract || cat.default;
    if (lower.includes('право')) return cat.rights || cat.default;
    if (lower.includes('найм') || lower.includes('сотрудник')) return cat.hiring || cat.default;
    if (lower.includes('мотивация')) return cat.motivation || cat.default;

    return cat.default;
  };

  const currentMessages = messages[activeCategory] || [];
  const currentCategory = categories.find(c => c.id === activeCategory);

  return (
    <div className="chat-interface">
      {/* === Заголовок === */}
      <div className="chat-header">
        <Space>
          <Avatar size="large" icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <Text strong style={{ fontSize: 18 }}>{currentCategory?.name || 'Общий чат'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{currentCategory?.description || 'Задавайте вопросы'}</Text>
          </div>
        </Space>
        <Tag color="blue">{currentMessages.length} сообщений</Tag>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* === Сообщения === */}
      <div className="messages-container">
        <List
          dataSource={currentMessages}
          renderItem={(message) => (
            <List.Item className={`message-item ${message.sender}-message`}>
              <Space align="start" size="middle" style={{ width: '100%' }}>
                <Avatar
                  icon={message.sender === 'bot' ? <RobotOutlined /> : <UserOutlined />}
                  style={{ backgroundColor: message.sender === 'bot' ? '#1890ff' : '#52c41a', flexShrink: 0 }}
/>
                <div className="message-content" style={{ flex: 1 }}>
                  {editingId === message.id ? (
                    <div className="editing-wrapper">
                      <Space.Compact style={{ width: '100%' }}>
                        <TextArea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          autoSize={{ minRows: 1, maxRows: 6 }}
                          autoFocus
                          style={{ resize: 'none' }}
                        />
                        <Button type="primary" size="small" onClick={saveEdit}>Сохранить</Button>
                        <Button size="small" onClick={cancelEdit}>Отмена</Button>
                      </Space.Compact>
                    </div>
                  ) : (
                    <>
                      <div className="message-header">
                        <Text strong>{message.sender === 'bot' ? 'SoriPilotX' : 'Вы'}</Text>
                        <MessageActions message={message} />
                      </div>
                      <Text className="message-text">
                        {message.text}
                        {message.edited && <Text type="secondary" style={{ fontSize: 10, marginLeft: 4 }}>(ред.)</Text>}
                      </Text>
                      {message.files && (
                        <div className="file-attachments">
                          <PaperClipOutlined style={{ marginRight: 4 }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Прикреплено {message.files.length} файл(ов)
                          </Text>
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
            <Space align="start" size="middle" style={{ width: '100%' }}>
              <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <Text type="secondary">СорilotX печатает...</Text>
            </Space>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* === Файлы / Голос === */}
      {showFileUpload && <FileUpload onFilesUpload={handleFilesUpload} />}
      {showVoiceMode && (
        <div className="voice-wrapper">
          {/* VoiceMode компонент */}
          <Button type="text" size="small" onClick={() => setShowVoiceMode(false)}>Закрыть</Button>
        </div>
      )}

      {/* === Поле ввода === */}
      <div className="input-container">
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Сообщение в ${currentCategory?.name || 'чат'}...`}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ resize: 'none', borderRadius: '8px 0 0 8px' }}
          />
          <Button
            icon={<PaperClipOutlined />}
            onClick={() => setShowFileUpload(!showFileUpload)}
            style={{ borderRadius: 0 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
            disabled={!inputValue.trim()}
            style={{ borderRadius: '0 8px 8px 0' }}
          >
            Отправить
          </Button>
        </Space.Compact>
      </div>
    </div>
  );
};

export default ChatInterface;
