// src/utils/DBCleaner.jsx
import React from 'react';
import { Button, Modal, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const DBCleaner = () => {
  const cleanDatabase = () => {
    Modal.confirm({
      title: 'Очистить всю базу данных?',
      content: 'Это удалит всех пользователей, историю чатов и настройки. Действие нельзя отменить!',
      okText: 'Очистить',
      cancelText: 'Отмена',
      okType: 'danger',
      onOk() {
        const keysToClear = [
          'sorilotx-users',
          'sorilotx-current-user', 
          'sorilotx-unread-categories',
          'sorilotx-custom-chats',
          ...Object.keys(localStorage).filter(key => key.startsWith('sorilotx-chat-history-')),
          ...Object.keys(localStorage).filter(key => key.startsWith('sorilotx-custom-chats-'))
        ];

        keysToClear.forEach(key => {
          localStorage.removeItem(key);
        });

        message.success('✅ База данных полностью очищена!');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });
  };

  return (
    <Button 
      type="primary" 
      danger 
      icon={<DeleteOutlined />}
      onClick={cleanDatabase}
      style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}
    >
      Очистить БД
    </Button>
  );
};

export default DBCleaner;