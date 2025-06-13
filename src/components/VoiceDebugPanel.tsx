import React, { useState, useEffect } from 'react';
import type { VoiceRecognitionState } from '../VoiceRecognition';
import './VoiceDebugPanel.css';

export interface VoiceDebugPanelProps {
  voiceState: VoiceRecognitionState;
  debugInfo: string[];
  visible: boolean;
  onClose: () => void;
  isDevelopment?: boolean;
}

export const VoiceDebugPanel: React.FC<VoiceDebugPanelProps> = ({
  voiceState,
  debugInfo,
  visible,
  onClose,
  isDevelopment = false
}) => {
  const [position, setPosition] = useState({ x: 10, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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

  if (!isDevelopment || !visible) {
    return null;
  }

  const {
    speechSupported,
    isListening,
    microphonePermission,
    audioLevel,
    speechError,
    lastRecognizedText
  } = voiceState;

  return (
    <div 
      className="speech-debug-panel"
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
        🎤 语音调试信息
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
          <span className="status-label">支持状态:</span>
          <span className={`status-value ${speechSupported ? 'success' : 'error'}`}>
            {speechSupported ? '✅ 支持' : '❌ 不支持'}
          </span>
        </div>
        
        <div className="status-item">
          <span className="status-label">监听状态:</span>
          <span className={`status-value ${isListening ? 'listening' : 'idle'}`}>
            {isListening ? '🔴 监听中' : '⚪ 空闲'}
          </span>
        </div>
        
        <div className="status-item">
          <span className="status-label">麦克风权限:</span>
          <span className={`status-value ${
            microphonePermission === 'granted' ? 'success' : 
            microphonePermission === 'denied' ? 'error' : 'warning'
          }`}>
            {microphonePermission === 'granted' ? '✅ 已授权' : 
             microphonePermission === 'denied' ? '❌ 被拒绝' : '⚠️ 未知'}
          </span>
        </div>
        
        <div className="status-item">
          <span className="status-label">音频级别:</span>
          <span className="status-value">
            <span className="audio-level-bar">
              <span 
                className="audio-level-fill" 
                style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
              ></span>
            </span>
            <span className="audio-level-text">{audioLevel}</span>
          </span>
        </div>
        
        {speechError && (
          <div className="status-item">
            <span className="status-label">错误信息:</span>
            <span className="status-value error">{speechError}</span>
          </div>
        )}
        
        {lastRecognizedText && (
          <div className="status-item">
            <span className="status-label">最后识别:</span>
            <span className="status-value">"{lastRecognizedText}"</span>
          </div>
        )}
      </div>
      
      <div className="debug-logs">
        <div className="logs-header">调试日志:</div>
        <div className="logs-content">
          {debugInfo.map((log, index) => (
            <div key={index} className="log-item">{log}</div>
          ))}
          {debugInfo.length === 0 && (
            <div className="log-item empty">暂无日志</div>
          )}
        </div>
      </div>
    </div>
  );
};