import React, { useState, useEffect } from 'react';
import { Dropdown, Space, Switch, Typography } from 'antd';
import {
  GlobalOutlined, MailOutlined, GithubOutlined, GoogleOutlined,
  CalendarOutlined, PlusOutlined, RobotOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const AgentSelector = () => {
  // Загружаем состояние из localStorage (по умолчанию: web — включён, остальные — выключены)
  const getStoredState = (key, defaultValue = false) => {
    try {
      const saved = localStorage.getItem(key);
      return saved === null ? defaultValue : saved === 'true';
    } catch {
      return defaultValue;
    }
  };

  const [webSearchEnabled, setWebSearchEnabled] = useState(() => getStoredState('agent-web', true));
  const [gmailEnabled, setGmailEnabled] = useState(() => getStoredState('agent-gmail'));
  const [githubEnabled, setGithubEnabled] = useState(() => getStoredState('agent-github'));
  const [driveEnabled, setDriveEnabled] = useState(() => getStoredState('agent-drive'));
  const [calendarEnabled, setCalendarEnabled] = useState(() => getStoredState('agent-calendar'));

  const saveToStorage = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  };

  useEffect(() => saveToStorage('agent-web', webSearchEnabled), [webSearchEnabled]);
  useEffect(() => saveToStorage('agent-gmail', gmailEnabled), [gmailEnabled]);
  useEffect(() => saveToStorage('agent-github', githubEnabled), [githubEnabled]);
  useEffect(() => saveToStorage('agent-drive', driveEnabled), [driveEnabled]);
  useEffect(() => saveToStorage('agent-calendar', calendarEnabled), [calendarEnabled]);

  const agents = [
    {
      key: 'web',
      label: 'Поиск в сети',
      icon: <GlobalOutlined />,
      enabled: webSearchEnabled,
      onToggle: () => setWebSearchEnabled(prev => !prev),
    },
    {
      key: 'gmail',
      label: 'Gmail',
      icon: <MailOutlined />,
      enabled: gmailEnabled,
      onToggle: () => setGmailEnabled(prev => !prev),
    },
    {
      key: 'github',
      label: 'GitHub',
      icon: <GithubOutlined />,
      enabled: githubEnabled,
      onToggle: () => setGithubEnabled(prev => !prev),
    },
    {
      key: 'drive',
      label: 'Google Диск',
      icon: <GoogleOutlined />,
      enabled: driveEnabled,
      onToggle: () => setDriveEnabled(prev => !prev),
    },
    {
      key: 'calendar',
      label: 'Google Календарь',
      icon: <CalendarOutlined />,
      enabled: calendarEnabled,
      onToggle: () => setCalendarEnabled(prev => !prev),
    },
  ];

  const menuItems = [
    {
      key: 'header',

      disabled: true,
    },
    { type: 'divider' },
    ...agents.map((agent) => ({
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
      trigger={['click']}
      placement="topLeft"
      overlayStyle={{ width: 280 }}
    >
      <div
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
