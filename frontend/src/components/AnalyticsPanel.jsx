import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { analytics } from '../utils/analytics';

const AnalyticsPanel = () => {
  const metrics = analytics.getMetrics();
  const events = analytics.getEvents(10);

  const columns = [
    {
      title: 'Событие',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Время',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => new Date(text).toLocaleTimeString(),
    },
  ];

  return (
    <Card title="📊 Аналитика" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="API Запросов"
            value={metrics.apiRequests}
            suffix="шт"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Успешных"
            value={metrics.apiSuccesses}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Ошибок"
            value={metrics.apiErrors}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="Ошибок"
            value={metrics.errorRate}
            suffix="%"
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12}>
          <Statistic
            title="Среднее время ответа"
            value={metrics.averageResponseTime.toFixed(0)}
            suffix="ms"
          />
        </Col>
      </Row>
      <Table
        title={() => 'Последние события'}
        columns={columns}
        dataSource={events.map((e, i) => ({ ...e, key: i }))}
        pagination={false}
        size="small"
        style={{ marginTop: 16 }}
      />
    </Card>
  );
};

export default AnalyticsPanel;
