import React, { useState } from 'react';
import { Upload, Button, message, Space, Typography } from 'antd';
import { UploadOutlined, PaperClipOutlined } from '@ant-design/icons';
import './FileUpload.css';

const { Text } = Typography;
const { Dragger } = Upload;

const FileUpload = ({ onFilesUpload }) => {
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
      message.success(`${info.file.name} успешно загружен`);
      onFilesUpload?.([info.file]);
    } else if (status === 'error') {
      setUploading(false);
      message.error(`${info.file.name} ошибка загрузки.`);
    }
  };

  const customRequest = ({ file, onSuccess }) => {
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

  return (
    <div className="file-upload">
      <Dragger {...uploadProps} className="file-dragger">
        <div className="upload-content">
          <p className="ant-upload-drag-icon">
            <PaperClipOutlined />
          </p>
          <p className="ant-upload-text">
            Нажмите или перетащите файлы для загрузки
          </p>
          <p className="ant-upload-hint">
            Поддерживаются PDF, Word, Excel, текстовые файлы и изображения до 10MB
          </p>
        </div>
      </Dragger>
    </div>
  );
};

export default FileUpload;