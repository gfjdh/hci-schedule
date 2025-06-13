import React from 'react';
import { CustomButton } from '../Buttons';
import type { VoiceRecognitionState } from '../VoiceRecognition';
import './VoiceControlArea.css';

export interface VoiceControlAreaProps {
  voiceState: VoiceRecognitionState;
  commandInput: string;
  onCommandInputChange: (value: string) => void;
  onToggleVoice: () => void;
  onExecuteCommand?: () => void;
  onAddEvent: () => void;
  isDevelopment?: boolean;
  onToggleDebugPanel?: () => void;
}

export const VoiceControlArea: React.FC<VoiceControlAreaProps> = ({
  voiceState,
  commandInput,
  onCommandInputChange,
  onToggleVoice,
  onExecuteCommand,
  onAddEvent,
  isDevelopment = false,
  onToggleDebugPanel
}) => {
  const { isListening } = voiceState;

  return (
    <>
      {/* 环境指示器 - 仅在开发环境显示 */}
      {isDevelopment && (
        <div className="environment-indicator">
          <span className="env-badge">开发环境</span>
          {onToggleDebugPanel && (
            <button 
              className="debug-toggle-btn"
              onClick={onToggleDebugPanel}
              title="切换调试面板"
            >
              🔧
            </button>
          )}
        </div>
      )}
      
      <div className="voice-area">
        <CustomButton 
          width="8vw" 
          onClick={onToggleVoice}
          style={{
            backgroundColor: isListening ? '#ff6b6b' : '#4CAF50',
            animation: isListening ? 'pulse 1s infinite' : undefined
          }}
        >
          🎤 {isListening ? '停止监听' : '开始监听'}
        </CustomButton>
        
        <span className="command">
          <label className="command-label">指令</label>
          <input 
            type="text" 
            className="command-input" 
            placeholder="请输入指令或使用语音输入" 
            value={commandInput}
            onChange={(e) => onCommandInputChange(e.target.value)}
          />
          {onExecuteCommand && (
            <CustomButton width="5vw" onClick={onExecuteCommand}>
              执行
            </CustomButton>
          )}
        </span>
        
        {/* 新建日程按钮 */}
        <CustomButton
          width="10vw"
          onClick={onAddEvent}
        >
          ➕ 新建日程
        </CustomButton>
      </div>
    </>
  );
};