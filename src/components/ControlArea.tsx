import React from 'react';
import { CustomButton } from '../Buttons';
import type { VoiceRecognitionState } from '../VoiceRecognition';
import { DebugIndicator } from './DebugIndicator';
import './ControlArea.css';

export interface ControlAreaProps {
  voiceState: VoiceRecognitionState;
  commandInput: string;
  onCommandInputChange: (value: string) => void;
  onToggleVoice: () => void;
  onExecuteCommand?: () => void;
  onAddEvent: () => void;
  isDevelopment?: boolean;
  onToggleDebugPanel?: () => void;
  onToggleApiDebugPanel?: () => void;
  onToggleScheduleDebugPanel?: () => void;
}

export const ControlArea: React.FC<ControlAreaProps> = ({
  voiceState,
  commandInput,
  onCommandInputChange,
  onToggleVoice,
  onExecuteCommand,
  onAddEvent,
  isDevelopment = false,
  onToggleDebugPanel,
  onToggleApiDebugPanel,
  onToggleScheduleDebugPanel
}) => {
  const { isListening } = voiceState;

  return (
    <>
      {/* 环境指示器 - 仅在开发环境显示 */}
      <DebugIndicator 
        isDevelopment={isDevelopment}
        onToggleDebugPanel={onToggleDebugPanel}
        onToggleApiDebugPanel={onToggleApiDebugPanel}
        onToggleScheduleDebugPanel={onToggleScheduleDebugPanel}
      />
      
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
          <CustomButton width="5vw" onClick={onExecuteCommand || (() => {})}>
            执行
          </CustomButton>
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