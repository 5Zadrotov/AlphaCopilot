import React, { useState, useEffect } from 'react';
import { Dropdown, Space, Switch, Typography } from 'antd';
import {
  GlobalOutlined, MailOutlined, GithubOutlined, GoogleOutlined,
  CalendarOutlined, PlusOutlined, RobotOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const AgentSelector = () => {
  const [open, setOpen] = useState(false);

  // === Состояния переключателей ===
  const [webSearchEnabled, setWebSearchEnabled] = useState(() => {
    const saved = localStorage.getItem('agent-web');
    return saved === null ? true : saved === 'true';
  });

  const [gmailEnabled, setGmailEnabled] = useState(() => {
    const saved = localStorage.getItem('agent-gmail');
    return saved === 'true';
  });

  const [githubEnabled, setGithubEnabled] = useState(() => {
    const saved = localStorage.getItem('agent-github');
    return saved === 'true';
  });

  const [driveEnabled, setDriveEnabled] = useState(() => {
    const saved = localStorage.getItem('agent-drive');
    return saved === 'true';
  });

  const [calendarEnabled, setCalendarEnabled] = useState(() => {
    const saved = localStorage.getItem('agent-calendar');
    return saved === 'true';
  });

  // === Сохранение в localStorage ===
  useEffect(() => localStorage.setItem('agent-web', webSearchEnabled), [webSearchEnabled]);
  useEffect(() => localStorage.setItem('agent-gmail', gmailEnabled), [gmailEnabled]);
  useEffect(() => localStorage.setItem('agent-github', githubEnabled), [githubEnabled]);
  useEffect(() => localStorage.setItem('agent-drive', driveEnabled), [driveEnabled]);
  useEffect(() => localStorage.setItem('agent-calendar', calendarEnabled), [calendarEnabled]);

  // === Агенты ===
  const agents = [
    { key: 'web', label: 'Поиск в сети', icon: <GlobalOutlined />, enabled: webSearchEnabled, onToggle: () => setWebSearchEnabled(p => !p) },
    { key: 'gmail', label: 'Gmail', icon: <MailOutlined />, enabled: gmailEnabled, onToggle: () => setGmailEnabled(p => !p) },
    { key: 'github', label: 'GitHub', icon: <GithubOutlined />, enabled: githubEnabled, onToggle: () => setGithubEnabled(p => !p) },
    { key: 'drive', label: 'Google Диск', icon: <GoogleOutlined />, enabled: driveEnabled, onToggle: () => setDriveEnabled(p => !p) },
    { key: 'calendar', label: 'Google Календарь', icon: <CalendarOutlined />, enabled: calendarEnabled, onToggle: () => setCalendarEnabled(p => !p) },
  ];

  // === Меню ===
  const menuItems = [
    {
      key: 'header',
      label: (
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <Text strong>Агент</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {agents.some(a => a.enabled) ? 'Активен' : 'Выключен'}
          </Text>
        </Space>
      ),
      disabled: true,
    },
    { type: 'divider' },
    ...agents.map(agent => ({
      key: agent.key,
      label: (
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            {agent.icon}
            <Text>{agent.label}</Text>
          </Space>
          <Switch
            size="small"
            checked={agent.enabled}
            onChange={agent.onToggle}
            onClick={(e) => e.stopPropagation()} // ← КЛЮЧ: не даём закрыться!
          />
        </Space>
      ),
    })),
    { type: 'divider' },
    {
      key: 'more',
      label: (
        <Space>
          <PlusOutlined />
          <Text>Подключить больше</Text>
        </Space>
      ),
    },
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['contextMenu']} // ← Открываем только правым кликом (или программно)
      open={open}
onOpenChange={(nextOpen) => {
        // Разрешаем только программное управление
        if (!nextOpen) setOpen(false);
      }}
      overlayStyle={{ width: 280 }}
      // Отключаем стандартное поведение
      getPopupContainer={trigger => trigger.parentElement}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpen(prev => !prev); // ← Переключаем вручную
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: 6,
          background: '#f5f5f5',
          border: '1px solid #d9d9d9',
          fontSize: 14,
        }}
      >
        <GlobalOutlined style={{ color: '#000000' }} />
      </div>
    </Dropdown>
  );
};

export default AgentSelector;
