// src/components/MessageActions.jsx
import React from 'react';
import { Button, Dropdown, message } from 'antd';
import { MoreOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';

const MessageActions = ({ 
  message, 
  onDelete, 
  isAI = false 
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      message.success('Текст скопирован');
    } catch (err) {
      message.error('Не удалось скопировать текст');
    }
  };

  const handleDelete = () => {
    onDelete(message.id);
  };

  const menuItems = [
    {
      key: 'copy',
      label: 'Копировать текст',
      icon: <CopyOutlined />,
      onClick: handleCopy
    }
  ];

  // Только для пользовательских сообщений добавляем удаление
  if (!isAI) {
    menuItems.push({
      key: 'delete',
      label: 'Удалить и очистить диалог ниже',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDelete
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

export default MessageActions;