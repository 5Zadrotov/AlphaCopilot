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
  Popover,
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
  DownloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import FileUpload from './FileUpload';
import AgentSelector from './MCP';
import { chatAPI } from '../utils/api';
import { MessageSkeleton } from './SkeletonLoader';
import { playNotificationSound } from '../utils/notifications';
import './ChatInterface.css';

const TextArea = Input.TextArea;
const { Text } = Typography;

const EMOJI_REACTIONS = ['👍', '👎', '❤️', '😂', '🔥', '🎉'];

const getUserChatsKey = (userId) => `chat-history-${userId}`;

const ChatInterface = ({ activeCategory, categories, currentUser, darkMode }) => {
  const [messages, setMessages] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [reactions, setReactions] = useState({});
  const messagesEndRef = useRef(null);

  // Автосохранение черновика
  useEffect(() => {
    const draftKey = `draft-${currentUser?.id}-${activeCategory}`;
    if (inputValue) {
      localStorage.setItem(draftKey, inputValue);
    }
  }, [inputValue, currentUser, activeCategory]);

  // Загрузка черновика
  useEffect(() => {
    if (!currentUser) return;
    const draftKey = `draft-${currentUser.id}-${activeCategory}`;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      setInputValue(saved);
    }
  }, [activeCategory, currentUser]);

  // === Загрузка истории ===
  useEffect(() => {
    if (!currentUser) {
      setMessages({});
      setIsInitialized(false);
      return;
    }

    try {
      const key = getUserChatsKey(currentUser.id);
      const saved = localStorage.getItem(key);

      if (saved) {
        const parsed = JSON.parse(saved);
        const restoredMessages = {};
        Object.keys(parsed).forEach(categoryId => {
          if (Array.isArray(parsed[categoryId])) {
            restoredMessages[categoryId] = parsed[categoryId].map(msg => ({
              ...msg,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
            }));
          }
        });
        setMessages(restoredMessages);
        setIsInitialized(true);
      } else {
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

    if (Object.keys(messages).length > 0) {
      try {
        const key = getUserChatsKey(currentUser.id);
        localStorage.setItem(key, JSON.stringify(messages));
      } catch (error) {
        console.error('ОШИБКА сохранения:', error);
      }
    }
  }, [messages, currentUser, isInitialized]);

  // === Приветственное сообщение ===
  useEffect(() => {
    if (!currentUser || !isInitialized) return;
    
    if (!messages[activeCategory]) {
      const cat = categories.find(c => c.id === activeCategory);
      const welcome = {
        id: Date.now(),
        text: getWelcomeMessage(activeCategory, cat?.name),
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => ({
        ...prev,
        [activeCategory]: [welcome]
      }));
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages[activeCategory]]);

  const handleCopyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('Скопировано!');
    } catch {
      message.error('Не удалось скопировать');
    }
  };

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

  const handleDeleteMessage = (id) => {
    setMessages(prev => {
      const msgs = prev[activeCategory] || [];
      const idx = msgs.findIndex(m => m.id === id);
      if (idx === -1) return prev;
      return { ...prev, [activeCategory]: msgs.slice(0, idx) };
    });
    message.success('Сообщение удалено');
  };

  const handleAddReaction = (messageId, emoji) => {
    setReactions(prev => ({
      ...prev,
      [messageId]: emoji
    }));
  };

  const exportToPDF = () => {
    const currentMsgs = messages[activeCategory] || [];
    const text = currentMsgs.map(m => `${m.sender === 'bot' ? 'AI' : 'You'}: ${m.text}`).join('\n\n');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `chat-${activeCategory}-${new Date().toISOString()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    message.success('Чат экспортирован!');
  };

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
      <Space>
        <Popover
          content={
            <Space>
              {EMOJI_REACTIONS.map(emoji => (
                <Button
                  key={emoji}
                  type="text"
                  onClick={() => handleAddReaction(message.id, emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </Space>
          }
          title="Реакция"
          trigger="click"
        >
          <Button type="text" size="small">😊</Button>
        </Popover>
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      </Space>
    );
  };

  const handleFilesUpload = (files) => {
    const msg = {
      id: Date.now(),
      text: `Загружено файлов: ${files.length}. ${files.map(f => f.name).join(', ')}`,
      sender: 'user',
      timestamp: new Date(),
      files,
    };
    
    setMessages(prev => ({
      ...prev, 
      [activeCategory]: [...(prev[activeCategory] || []), msg] 
    }));
    
    setShowFileUpload(false);
  };

  const handleSend = async () => {
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

    setMessages(prev => ({
      ...prev,
      [activeCategory]: [...(prev[activeCategory] || []), userMessage]
    }));
    
    const messageText = inputValue.trim();
    setInputValue('');
    localStorage.removeItem(`draft-${currentUser.id}-${activeCategory}`);
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage({
        text: messageText,
        category: activeCategory,
        sessionId: currentUser.id
      });

      if (!response || !response.message) {
        throw new Error('Пустой ответ от сервера');
      }

      const botMessage = {
        id: Date.now() + 1,
        text: response.message,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => ({
        ...prev,
        [activeCategory]: [...(prev[activeCategory] || []), botMessage]
      }));

      playNotificationSound();
    } catch (error) {
      console.error('API Error:', error);
      
      let errorText = 'Извините, произошла ошибка. Попробуйте позже.';
      
      if (error.status === 401) {
        errorText = 'Ваша сессия истекла. Пожалуйста, войдите заново.';
      } else if (error.status === 400) {
        errorText = error.message || 'Неверные данные. Проверьте ввод.';
      } else if (error.status === 500) {
        errorText = 'Ошибка сервера. Попробуйте позже.';
      } else if (error.message) {
        errorText = error.message;
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => ({
        ...prev,
        [activeCategory]: [...(prev[activeCategory] || []), errorMessage]
      }));
      
      message.error(errorText);
    } finally {
      setLoading(false);
    }
  };

  const currentMessages = messages[activeCategory] || [];
  const currentCategory = categories.find(c => c.id === activeCategory);
  
  const filteredMessages = searchText 
    ? currentMessages.filter(m => m.text.toLowerCase().includes(searchText.toLowerCase()))
    : currentMessages;

  return (
    <div className="chat-interface" style={{ backgroundColor: darkMode ? '#1f1f1f' : '#fff' }}>
      <div className="chat-header">
        <Space>
          <Avatar size="large" icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <Text strong style={{ fontSize: 18 }}>{currentCategory?.name || 'Чат'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{currentCategory?.description || 'Задавайте вопросы'}</Text>
          </div>
        </Space>
        <Space>
          <Input
            placeholder="Поиск..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 150 }}
          />
          <Button icon={<DownloadOutlined />} onClick={exportToPDF} title="Экспортировать чат" />
          <Tag color="blue">{currentMessages.length} сообщ.</Tag>
        </Space>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      <div className="messages-container">
        <List
          dataSource={filteredMessages}
          renderItem={(message) => (
            <List.Item className={`message-item ${message.sender}-message ${message.isError ? 'error-message' : ''}`}>
              <Space align="start" size="middle" style={{ width: '100%' }}>
                <Avatar
                  icon={message.sender === 'bot' ? <RobotOutlined /> : <UserOutlined />}
                  style={{ backgroundColor: message.isError ? '#ff4d4f' : (message.sender === 'bot' ? '#1890ff' : '#52c41a') }}
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
                      {reactions[message.id] && (
                        <div style={{ marginTop: 8 }}>
                          <Text>{reactions[message.id]}</Text>
                        </div>
                      )}
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
        {loading && <MessageSkeleton />}
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
