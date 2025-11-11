import React, { useState } from 'react';
import { Modal, Input, Form, Button, Tabs } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { TabPane } = Tabs;

const AuthModal = ({ visible, onCancel }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const { login, register } = useAuth();

  const handleLogin = async (values) => {
    const success = login(values.username, values.password);
    if (success) {
      onCancel();
      loginForm.resetFields();
    }
  };

  const handleRegister = async (values) => {
    const success = register(values.username, values.password);
    if (success) {
      onCancel();
      registerForm.resetFields();
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleCancel = () => {
    loginForm.resetFields();
    registerForm.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Авторизация"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={400}
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange} centered>
        <TabPane tab="Вход" key="login">
          <Form
            form={loginForm}
            layout="vertical"
            onFinish={handleLogin}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Введите логин' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Логин" 
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Введите пароль' }]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Пароль" 
                size="large"
              />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                Войти
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
        
        <TabPane tab="Регистрация" key="register">
          <Form
            form={registerForm}
            layout="vertical"
            onFinish={handleRegister}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Введите логин' },
                { min: 3, message: 'Логин должен быть не менее 3 символов' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Логин" 
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Введите пароль' },
                { min: 4, message: 'Пароль должен быть не менее 4 символов' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Пароль" 
                size="large"
              />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                Зарегистрироваться
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default AuthModal;