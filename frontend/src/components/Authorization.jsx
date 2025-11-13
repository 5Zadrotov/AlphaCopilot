import React, { useState } from 'react';
import { Button, Input, Form, Typography, Space, Tabs, Row, Col, Card } from 'antd';
import { ArrowLeftOutlined, UserOutlined,  LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Authorization = () => {
  const [activeTab, setActiveTab] = useState('register');
  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log('Регистрация:', values);
    // Здесь будет запрос на сервер
  };

  const onLogin = (values) => {
    console.log('Вход:', values);
   
  };

  return (
    <div style={{ marginTop: '100px', minHeight: '100vh',width:'100%', background: '#f0f2f5', padding: '40px 16px' }}>
      <Row justify="center">
        <Col xs={24} sm={18} md={12} lg={8} xl={6}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '24px',
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div>
                <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="app-logo">
                <rect width="64" height="64" rx="16" fill="#0078D4"/>
                <path d="M20 32L28 40L44 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M32 20V44" stroke="white" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              </div>
              <Title level={2} style={{ marginTop: 12, color: '#1a1a1a' }}>
                CopilotX
              </Title>
            </div>

            {}
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              centered
              size="large"
              tabBarStyle={{ marginBottom: 30 }}
            >
              <TabPane tab="Регистрация" key="register" />
              <TabPane tab="Вход" key="login" />
            </Tabs>

            {activeTab === 'register' ? (
              <Form form={form} onFinish={onFinish} layout="horizontal" size="large">
                <Form.Item
                  name="login"
                  label="Логин"
                  rules={[{ required: true, message: 'Введите логин' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Введите логин" />
                </Form.Item>

                
                <Form.Item
                  name="password"
                  label="Пароль"
                  rules={[{ required: true, message: 'Введите пароль' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
                </Form.Item>

                

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" block size="large" style={{ borderRadius: 8 }}>
                    Зарегистрироваться
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              <Form onFinish={onLogin} layout="horizontal" size="large">
                <Form.Item
                  name="login"
                  rules={[{ required: true, message: 'Введите логин' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Логин" />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Введите пароль' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Пароль" />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" block size="large" style={{ borderRadius: 8 }}>
                    Войти
                  </Button>
                </Form.Item>
              </Form>
            )}

            {/* === Назад === */}
            <div style={{ marginTop: 24, textAlign: 'left' }}>
              <Button type="text" icon={<ArrowLeftOutlined />} href="/">
                Назад
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Authorization;
