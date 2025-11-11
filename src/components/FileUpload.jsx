import React, { useState } from 'react';
import { Upload, Button, message, Card, Typography, Space, List, Progress } from 'antd';
import { UploadOutlined, FileTextOutlined, DeleteOutlined } from '@ant-design/icons';
import './FileUpload.css';

const { Text } = Typography;
const { Dragger } = Upload;

const FileUpload = ({ onFileAnalysis }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const beforeUpload = (file) => {
    const isAllowedType = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png'
    ].includes(file.type);

    if (!isAllowedType) {
      message.error('Можно загружать только PDF, Word, Excel, текстовые файлы и изображения!');
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('Файл должен быть меньше 10MB!');
      return false;
    }

    return true;
  };

  const handleUpload = (info) => {
    const { status } = info.file;

    if (status === 'uploading') {
      setUploading(true);
      return;
    }

    if (status === 'done') {
      setUploading(false);
      const newFile = {
        id: info.file.uid,
        name: info.file.name,
        type: info.file.type,
        size: info.file.size,
        uploadTime: new Date(),
      };
      
      setUploadedFiles(prev => [...prev, newFile]);
      message.success(`${info.file.name} успешно загружен`);
      
      // Имитация анализа файла
      setTimeout(() => {
        onFileAnalysis?.(newFile);
      }, 1000);
      
    } else if (status === 'error') {
      setUploading(false);
      message.error(`${info.file.name} ошибка загрузки.`);
    }
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    message.info('Файл удален');
  };

  const handleAnalyzeAll = () => {
    if (uploadedFiles.length === 0) {
      message.warning('Сначала загрузите файлы для анализа');
      return;
    }

    setUploading(true);
    message.info('Начинаем анализ загруженных документов...');

    // Имитация анализа всех файлов
    setTimeout(() => {
      setUploading(false);
      message.success(`Проанализировано ${uploadedFiles.length} файлов. Результаты готовы к обсуждению в чате!`);
      onFileAnalysis?.(uploadedFiles);
    }, 2000);
  };

  const customRequest = ({ file, onSuccess, onError }) => {
    // Имитация загрузки на сервер
    setTimeout(() => {
      onSuccess("ok");
    }, 1000);
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    beforeUpload,
    customRequest,
    onChange: handleUpload,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png',
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card 
      title={
        <Space>
          <FileTextOutlined />
          <Text strong>Анализ документов</Text>
        </Space>
      }
      className="file-upload-card"
    >
      <div className="upload-section">
        <Dragger {...uploadProps} className="file-dragger">
          <div className="upload-content">
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">
              Нажмите или перетащите файлы для загрузки
            </p>
            <p className="ant-upload-hint">
              Поддерживаются PDF, Word, Excel, текстовые файлы и изображения до 10MB
            </p>
          </div>
        </Dragger>

        {uploading && (
          <div className="upload-progress">
            <Progress percent={75} status="active" />
            <Text type="secondary">Обработка файла...</Text>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-section">
          <div className="files-header">
            <Text strong>Загруженные файлы ({uploadedFiles.length})</Text>
            <Button 
              type="primary" 
              size="small" 
              onClick={handleAnalyzeAll}
              loading={uploading}
            >
              Проанализировать все
            </Button>
          </div>
          
          <List
            size="small"
            dataSource={uploadedFiles}
            renderItem={(file) => (
              <List.Item className="file-item">
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <div>
                      <Text strong style={{ fontSize: '12px' }}>{file.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '10px' }}>
                        {formatFileSize(file.size)} • {file.uploadTime.toLocaleTimeString()}
                      </Text>
                    </div>
                  </Space>
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                    onClick={() => handleRemoveFile(file.id)}
                  />
                </Space>
              </List.Item>
            )}
          />
        </div>
      )}
    </Card>
  );
};

export default FileUpload;