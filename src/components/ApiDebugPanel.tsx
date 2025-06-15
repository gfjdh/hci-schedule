// 当前仅用于调试deepseek的API调用

import React, { useState, useEffect } from 'react';
import { APIClient } from '../LLMapi/api';
import './ApiDebugPanel.css';

export interface ApiDebugPanelProps {
  visible: boolean;
  onClose: () => void;
  isDevelopment?: boolean;
}

interface ApiTestResult {
  timestamp: string;
  request: string;
  response: string;
  error: boolean;
  duration: number;
}

export const ApiDebugPanel: React.FC<ApiDebugPanelProps> = ({
  visible,
  onClose,
  isDevelopment = false
}) => {
  const [position, setPosition] = useState({ x: 10, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [testInput, setTestInput] = useState('你好，请介绍一下你自己');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const ApiClient = new APIClient()
  const [apiKeyStatus, setApiKeyStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');

  // 检查API密钥状态
  useEffect(() => {
    if (visible) {
      setApiKeyStatus(ApiClient.hasApiKey() ? 'valid' : 'invalid');
    }
  }, [visible, ApiClient]);

  // 拖动相关函数
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // 测试API调用
  const handleTestApi = async () => {
    if (!testInput.trim() || isLoading) return;

    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      const result = await ApiClient.chat([
        { role: 'user', content: testInput }
      ]);
      
      const duration = Date.now() - startTime;
      const newResult: ApiTestResult = {
        timestamp: new Date().toLocaleTimeString(),
        request: testInput,
        response: result.content,
        error: result.error,
        duration
      };
      
      setTestResults(prev => [newResult, ...prev.slice(0, 9)]); // 保留最近10条记录
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const newResult: ApiTestResult = {
        timestamp: new Date().toLocaleTimeString(),
        request: testInput,
        response: `网络错误: ${error.message}`,
        error: true,
        duration
      };
      
      setTestResults(prev => [newResult, ...prev.slice(0, 9)]);
    } finally {
      setIsLoading(false);
    }
  };

  // 清空测试结果
  const handleClearResults = () => {
    setTestResults([]);
  };

  if (!isDevelopment || !visible) {
    return null;
  }

  return (
    <div 
      className="api-debug-panel"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div 
        className="debug-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: 'grab' }}
      >
        🔧 API调试面板
        <button 
          className="debug-close-btn"
          onClick={onClose}
          title="关闭调试面板"
        >
          ✕
        </button>
      </div>
      
      <div className="debug-status">
        <div className="status-item">
          <span className="status-label">API密钥状态:</span>
          <span className={`status-value ${apiKeyStatus === 'valid' ? 'success' : 'error'}`}>
            {apiKeyStatus === 'valid' ? '✅ 已配置' : '❌ 未配置'}
          </span>
        </div>
        
        {apiKeyStatus === 'invalid' && (
          <div className="status-item">
            <span className="status-label">配置提示:</span>
            <span className="status-value warning">
              请在设置页中设置API_KEY
            </span>
          </div>
        )}
      </div>
      
      <div className="debug-test">
        <div className="test-header">API测试:</div>
        <div className="test-input-area">
          <textarea
            className="test-input"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="输入测试消息..."
            rows={3}
            disabled={isLoading || apiKeyStatus === 'invalid'}
          />
          <div className="test-buttons">
            <button 
              className="test-btn"
              onClick={handleTestApi}
              disabled={isLoading || !testInput.trim() || apiKeyStatus === 'invalid'}
            >
              {isLoading ? '测试中...' : '发送测试'}
            </button>
            <button 
              className="clear-btn"
              onClick={handleClearResults}
              disabled={testResults.length === 0}
            >
              清空记录
            </button>
          </div>
        </div>
      </div>
      
      <div className="debug-results">
        <div className="results-header">测试结果 ({testResults.length}/10):</div>
        <div className="results-content">
          {testResults.map((result, index) => (
            <div key={index} className={`result-item ${result.error ? 'error' : 'success'}`}>
              <div className="result-header">
                <span className="result-time">{result.timestamp}</span>
                <span className="result-duration">{result.duration}ms</span>
                <span className={`result-status ${result.error ? 'error' : 'success'}`}>
                  {result.error ? '❌' : '✅'}
                </span>
              </div>
              <div className="result-request">
                <strong>请求:</strong> {result.request}
              </div>
              <div className="result-response">
                <strong>响应:</strong> {result.response}
              </div>
            </div>
          ))}
          {testResults.length === 0 && (
            <div className="result-item empty">暂无测试记录</div>
          )}
        </div>
      </div>
    </div>
  );
};