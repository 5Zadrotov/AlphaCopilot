import React, { useState, useEffect } from 'react';
import { Alert, Button, Space } from 'antd';
import { API_ENDPOINTS } from '../config/api';

const HealthCheck = () => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setStatus('checking');
    setError(null);
    
    try {
      const response = await fetch(API_ENDPOINTS.HEALTH);
      if (response.ok) {
        setStatus('healthy');
      } else {
        setStatus('unhealthy');
        setError(`HTTP ${response.status}`);
      }
    } catch (err) {
      setStatus('unhealthy');
      setError(err.message);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getAlertProps = () => {
    switch (status) {
      case 'checking':
        return { type: 'info', message: 'Проверка соединения с сервером...' };
      case 'healthy':
        return { type: 'success', message: 'Соединение с сервером установлено' };
      case 'unhealthy':
        return { type: 'error', message: `Ошибка соединения: ${error}` };
      default:
        return { type: 'warning', message: 'Неизвестный статус' };
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Alert {...getAlertProps()} showIcon />
      {status === 'unhealthy' && (
        <Button onClick={checkHealth} size="small">
          Повторить проверку
        </Button>
      )}
    </Space>
  );
};

export default HealthCheck;