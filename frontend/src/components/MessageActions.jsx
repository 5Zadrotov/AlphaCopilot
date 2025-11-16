import React, { useState } from 'react';
import { Button, Dropdown, message, Input, Space } from 'antd';
import { MoreOutlined, CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const MessageActions = ({
  message,
  onDelete,
  onEdit, 
  isAI = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      message.success('Текст скопирован');
    } catch {
      message.error('Не удалось скопировать текст');
    }
  };

  const handleDelete = () => {
    onDelete(message.id);
  };

  const startEdit = () => {
    setEditText(message.content);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditText(message.content);
    setEditing(false);
  };

  const saveEdit = () => {
    if (editText.trim() === '') {
      message.warning('Сообщение не может быть пустым');
      return;
    }
    if (editText.trim() !== message.content) {
      onEdit(message.id, editText.trim());
      message.success('Сообщение обновлено');
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const menuItems = [
    {
      key: 'copy',
      label: 'Копировать текст',
      icon: <CopyOutlined />,
      onClick: handleCopy,
    },
  ];

  // Только для пользовательских сообщений
  if (!isAI) {
    menuItems.push(
      {
        key: 'edit',
        label: 'Редактировать',
        icon: <EditOutlined />,
        onClick: startEdit,
      },
      {
        key: 'delete',
        label: 'Удалить и очистить диалог ниже',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: handleDelete,
      }
    );
  }

  return (
    <div className="message-actions-wrapper">
      {editing ? (
        <Space.Compact style={{ width: '100%', marginTop: 8 }}>
          <TextArea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            autoSize={{ minRows: 1, maxRows: 4 }}
            placeholder="Редактировать сообщение..."
            autoFocus
            style={{ resize: 'none' }}
          />
          <Button type="primary" size="small" onClick={saveEdit}>
            Сохранить
          </Button>
          <Button size="small" onClick={cancelEdit}>
            Отмена
          </Button>
        </Space.Compact>
      ) : (
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
          disabled={editing}
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
            className="message-actions-btn"
          />
        </Dropdown>
      )}
    </div>
  );
};

export default MessageActions;