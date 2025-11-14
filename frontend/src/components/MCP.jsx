import React, { useState, useEffect } from 'react';
import { Dropdown, Space, Switch, Typography, Modal, Button, List, Avatar, Tag, Badge } from 'antd';
import {
  GlobalOutlined, MailOutlined, GithubOutlined, GoogleOutlined,
  CalendarOutlined, PlusOutlined, RobotOutlined,
  ContactsOutlined, TwitterOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const AgentSelector = () => {
  // === Состояния агентов ===
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

  const [contactsEnabled, setContactsEnabled] = useState(() => {
    const saved = localStorage.getItem('agent-contacts');
    return saved === 'true';
  });

  // === Сохранение в localStorage ===
  useEffect(() => {
    localStorage.setItem('agent-web', webSearchEnabled);
  }, [webSearchEnabled]);

  useEffect(() => {
    localStorage.setItem('agent-gmail', gmailEnabled);
  }, [gmailEnabled]);

  useEffect(() => {
    localStorage.setItem('agent-github', githubEnabled);
  }, [githubEnabled]);

  useEffect(() => {
    localStorage.setItem('agent-drive', driveEnabled);
  }, [driveEnabled]);

  useEffect(() => {
    localStorage.setItem('agent-calendar', calendarEnabled);
  }, [calendarEnabled]);

  useEffect(() => {
    localStorage.setItem('agent-contacts', contactsEnabled);
  }, [contactsEnabled]);

  // === Модальное окно ===
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => setIsModalOpen(true);
  const handleModalClose = () => setIsModalOpen(false);

  // === Все агенты ===
  const allAgents = [
    { key: 'web', label: 'Поиск в сети', icon: <GlobalOutlined />, enabled: webSearchEnabled, setEnabled: setWebSearchEnabled },
    { key: 'gmail', label: 'Gmail', icon: <MailOutlined />, enabled: gmailEnabled, setEnabled: setGmailEnabled },
    { key: 'github', label: 'GitHub', icon: <GithubOutlined />, enabled: githubEnabled, setEnabled: setGithubEnabled },
    { key: 'drive', label: 'Google Диск', icon: <GoogleOutlined />, enabled: driveEnabled, setEnabled: setDriveEnabled },
    { key: 'calendar', label: 'Google Календарь', icon: <CalendarOutlined />, enabled: calendarEnabled, setEnabled: setCalendarEnabled },
    { key: 'contacts', label: 'Google Контакты', icon: <ContactsOutlined />, enabled: contactsEnabled, setEnabled: setContactsEnabled },
  ];

  const activeAgents = allAgents.filter(a => a.enabled);

  // === Приложения в модалке ===
  const availableApps = [
    {
      title: 'Gmail',
      icon: <MailOutlined style={{ fontSize: 24, color: '#EA4335' }} />,
      description: 'Электронная почта',
      connected: gmailEnabled,
      onConnect: () => setGmailEnabled(true),
    },
    {
      title: 'GitHub',
      icon: <GithubOutlined style={{ fontSize: 24, color: '#333' }} />,
      description: 'Репозитории и код',
      connected: githubEnabled,
      onConnect: () => setGithubEnabled(true),
    },
    {
      title: 'Google Диск',
      icon: <GoogleOutlined style={{ fontSize: 24, color: '#4285F4' }} />,
      description: 'Файлы и документы',
      connected: driveEnabled,
      onConnect: () => setDriveEnabled(true),
},
    {
      title: 'Google Календарь',
      icon: <CalendarOutlined style={{ fontSize: 24, color: '#FBBC05' }} />,
      description: 'События и встречи',
      connected: calendarEnabled,
      onConnect: () => setCalendarEnabled(true),
    },
    {
      title: 'Google Контакты',
      icon: <ContactsOutlined style={{ fontSize: 24, color: '#34A853' }} />,
      description: 'Контакты и адреса',
      connected: contactsEnabled,
      onConnect: () => setContactsEnabled(true),
    },
  ];

  // === Подменю управления ===
  const manageMenuItems = [
    ...allAgents.map((agent) => ({
      key: `manage-${agent.key}`,
      label: (
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            {agent.icon}
            <Text>{agent.label}</Text>
          </Space>
          <Switch
            size="small"
            checked={agent.enabled}
            onChange={(checked, e) => {
              e.stopPropagation();
              agent.setEnabled(checked);
            }}
            onClick={(checked, e) => e.stopPropagation()}
          />
        </Space>
      ),
    })),
    { type: 'divider' },
    {
      key: 'more',
      label: (
        <Space style={{ color: '#1890ff' }}>
          <PlusOutlined />
          <Text>Подключить больше</Text>
        </Space>
      ),
      onClick: () => showModal(),
    },
  ];

  // === Основное меню дропдауна ===
  const menuItems = [
    {
      key: 'header',
      label: (
        <Space style={{ width: '100%', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <RobotOutlined />
          <Text>Активные агенты ({activeAgents.length})</Text>
        </Space>
      ),
      disabled: true,
    },
    { type: 'divider' },
    ...activeAgents.map((agent) => ({
      key: agent.key,
      label: (
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            {agent.icon}
            <Text>{agent.label}</Text>
          </Space>
          <Tag color="green">Подключено</Tag>
        </Space>
      ),
    })),
    ...(activeAgents.length === 0
      ? [{
          key: 'empty',
          label: <Text type="secondary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>Нет активных агентов</Text>,
          disabled: true,
        }]
      : []),
    { type: 'divider' },
    {
      key: 'manage',
      label: <Text strong style={{ color: '#1890ff' }}>Управление агентами</Text>,
      children: manageMenuItems,
    },
  ];

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="topLeft"
        overlayStyle={{ width: 320 }}
      >
        <Badge count={activeAgents.length} size="small" offset={[-5, 5]}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: 8,
              background: activeAgents.length > 0 ? '#e6f7ff' : '#f5f5f5',
              border: '1px solid #d9d9d9',
              fontSize: 14,
              transition: 'all 0.2s',
            }}
          >
            <RobotOutlined style={{ fontSize: 18, color: activeAgents.length > 0 ? '#1890ff' : '#000' }} />
          </div>
        </Badge>
      </Dropdown>
{/* === Модальное окно === */}
      <Modal
        title={<Space><RobotOutlined /> Подключить приложения</Space>}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={520}
      >
        <List
          itemLayout="horizontal"
          dataSource={availableApps}
          renderItem={(app) => (
            <List.Item
              actions={[
                app.connected ? (
                  <Tag color="green">Подключено</Tag>
                ) : (
                  <Button type="primary" size="small" onClick={app.onConnect}>
                    Подключить
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={app.icon} style={{ background: 'transparent' }} />}
                title={app.title}
                description={app.description}
              />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
};

export default AgentSelector;
