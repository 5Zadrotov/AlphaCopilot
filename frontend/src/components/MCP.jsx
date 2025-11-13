import React, { useState } from 'react';
import { Dropdown, Space, Switch, Typography, Divider } from 'antd';
import {
  GlobalOutlined,
  MailOutlined,
  GithubOutlined,
  GoogleOutlined,
  CalendarOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const AgentSelector = () => {
  const [selectedAgent, setSelectedAgent] = useState('agent');
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);

  const agents = [
    {
      key: 'web',
      label: 'Поиск в сети',
      icon: <GlobalOutlined />,
      enabled: webSearchEnabled,
      onToggle: () => setWebSearchEnabled(!webSearchEnabled),
    },
    {
      key: 'gmail',
      label: 'Gmail',
      icon: <MailOutlined />,
      connectText: 'Подключить',
    },
    {
      key: 'github',
      label: 'GitHub',
      icon: <GithubOutlined />,
      connectText: 'Подключить',
    },
    {
      key: 'drive',
      label: 'Google Диск',
      icon: <GoogleOutlined />,
      connectText: 'Подключить',
    },
    {
      key: 'calendar',
      label: 'Google Календарь',
      icon: <CalendarOutlined />,
      connectText: 'Подключить',
    },
  ];

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
            {selectedAgent === 'agent' ? 'По умолчанию' : 'Выбран'}
          </Text>
        </Space>
      ),
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
          {agent.enabled !== undefined ? (
            <Switch
              size="small"
              checked={agent.enabled}
              onChange={agent.onToggle}
            />
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {agent.connectText}
            </Text>
          )}
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
      placement="bottomLeft"
      overlayStyle={{ width: 300 }}
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
        }}
      >
        <GlobalOutlined style={{ color: '#000000', fontSize: 16 }} />
        <Text strong style={{ fontSize: 14 }}>
          Агент
        </Text>
        <Text type="secondary" style={{ fontSize: 14 }}>
          ▼
        </Text>
      </div>
    </Dropdown>
  );
};

export default AgentSelector;