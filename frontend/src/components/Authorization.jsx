import React, { useState } from 'react';
import { Button, Input, Form, Typography, Tabs, Row, Col, Card, message } from 'antd';
import { ArrowLeftOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;
const { TabPane } = Tabs;

const Authorization = () => {
  const [activeTab, setActiveTab] = useState('register');
  const [form] = Form.useForm();
  const { register, login } = useAuth(); // ← register добавлен!
  const navigate = useNavigate();

  // Регистрация
  const handleRegister = (values) => {
    const success = register(values.login, values.password);
    if (success) {
        message.success('Регистрация успешна!');;
    }
  };

  // Вход
  const handleLogin = (values) => {
    const success = login(values.login, values.password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '40px 16px' }}>
      <Row justify="center">
        <Col xs={24} sm={18} md={12} lg={8} xl={6}>
          <Card
            style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            bodyStyle={{ padding: 24 }}
          >
            {/* Логотип */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="16" fill="#0078D4"/>
              <path d="M20 32L28 40L44 24" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M32 20V44" stroke="white" stroke-width="4" stroke-linecap="round"/>
            </svg>
              <Title level={2} style={{ margin: 0 }}>CopilotX</Title>
            </div>

            {/* Табы */}
            <Tabs activeKey={activeTab} onChange={setActiveTab} centered size="large">
              <TabPane tab="Регистрация" key="register" />
              <TabPane tab="Вход" key="login" />
            </Tabs>

            {/* Формы */}
            {activeTab === 'register' ? (
              <Form form={form} onFinish={handleRegister} layout="vertical" size="large">
                <Form.Item
                  name="login"
                  label="Логин"
                  rules={[{ required: true, message: 'Введите логин' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Логин" />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Пароль"
                  rules={[{ required: true, message: 'Введите пароль' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Пароль" />
                </Form.Item>

                
<Button type="primary" htmlType="submit" block style={{ borderRadius: 8 }}>
                  Зарегистрироваться
                </Button>
              </Form>
            ) : (
              <Form onFinish={handleLogin} layout="vertical" size="large">
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

                <Button type="primary" htmlType="submit" block style={{ borderRadius: 8 }}>
                  Войти
                </Button>
              </Form>
            )}

            {/* Назад */}
            <div style={{ marginTop: 24 }}>
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
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
