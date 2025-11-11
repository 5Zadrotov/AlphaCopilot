import React, { useState } from 'react';
import { Modal, Input, Button, Form, Select, Typography, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const CreateChatModal = ({ visible, onCancel, onCreate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const newChat = {
        id: `custom-${Date.now()}`,
        name: values.name,
        description: values.description,
        icon: '💭',
        category: values.category,
        isCustom: true,
        createdAt: new Date()
      };
      
      onCreate(newChat);
      form.resetFields();
      onCancel();
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Создать новый чат"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Отмена
        </Button>,
        <Button 
          key="create" 
          type="primary" 
          loading={loading}
          onClick={handleSubmit}
          icon={<PlusOutlined />}
        >
          Создать чат
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Название чата"
          rules={[
            { required: true, message: 'Введите название чата' },
            { min: 2, message: 'Название должно быть не менее 2 символов' }
          ]}
        >
          <Input placeholder="Например: Планирование бюджета на 2024" />
        </Form.Item>

        <Form.Item
          name="category"
          label="Категория"
          rules={[{ required: true, message: 'Выберите категорию' }]}
        >
          <Select placeholder="Выберите категорию">
            <Option value="finance">💰 Финансы</Option>
            <Option value="marketing">📊 Маркетинг</Option>
            <Option value="legal">⚖️ Юридическое</Option>
            <Option value="hr">👥 HR</Option>
            <Option value="general">💬 Общее</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Описание"
          rules={[{ max: 200, message: 'Описание не должно превышать 200 символов' }]}
        >
          <TextArea 
            placeholder="Опишите тему чата (необязательно)"
            rows={3}
            showCount
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateChatModal;