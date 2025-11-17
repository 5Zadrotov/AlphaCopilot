import React from 'react';
import { Skeleton, Space } from 'antd';
import './SkeletonLoader.css';

export const MessageSkeleton = () => (
  <div className="skeleton-message">
    <Space align="start" size="middle" style={{ width: '100%' }}>
      <Skeleton.Avatar active size="large" />
      <div style={{ flex: 1 }}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    </Space>
  </div>
);

export const ChatSkeleton = () => (
  <div className="skeleton-chat">
    <MessageSkeleton />
    <MessageSkeleton />
    <MessageSkeleton />
  </div>
);

export default MessageSkeleton;
