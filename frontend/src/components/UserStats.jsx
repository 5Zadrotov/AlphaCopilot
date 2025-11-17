import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic } from 'antd';

const UserStats = ({ currentUser, messages }) => {
  const [stats, setStats] = useState({
    totalMessages: 0,
    userMessages: 0,
    botMessages: 0,
    favoriteCategory: 'N/A'
  });

  useEffect(() => {
    if (!messages) return;

    let total = 0;
    let user = 0;
    let bot = 0;
    const categories = {};

    Object.entries(messages).forEach(([category, msgs]) => {
      categories[category] = msgs.length;
      msgs.forEach(m => {
        total++;
        if (m.sender === 'user') user++;
        else bot++;
      });
    });

    const favorite = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    setStats({
      totalMessages: total,
      userMessages: user,
      botMessages: bot,
      favoriteCategory: favorite
    });
  }, [messages]);

  return (
    <Card title="👤 Статистика" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Statistic title="Всего сообщений" value={stats.totalMessages} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic title="Ваши сообщения" value={stats.userMessages} valueStyle={{ color: '#52c41a' }} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic title="Ответы AI" value={stats.botMessages} valueStyle={{ color: '#1890ff' }} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic title="Любимая категория" value={stats.favoriteCategory} />
        </Col>
      </Row>
    </Card>
  );
};

export default UserStats;
