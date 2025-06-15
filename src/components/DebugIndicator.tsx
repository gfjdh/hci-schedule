import React from 'react';
import './DebugIndicator.css';

export interface DebugIndicatorProps {
  isDevelopment?: boolean;
  onToggleDebugPanel?: () => void;
  onToggleApiDebugPanel?: () => void;
  onToggleScheduleDebugPanel?: () => void;
}

export const DebugIndicator: React.FC<DebugIndicatorProps> = ({
  isDevelopment = false,
  onToggleDebugPanel,
  onToggleApiDebugPanel,
  onToggleScheduleDebugPanel
}) => {
  if (!isDevelopment) {
    return null;
  }

  return (
    <div className="environment-indicator">
      <span className="env-badge">开发环境</span>
      {onToggleDebugPanel && (
        <button 
          className="debug-toggle-btn voice-debug-btn"
          onClick={onToggleDebugPanel}
          title="切换语音调试面板"
        >
          语音调试
        </button>
      )}
      {onToggleApiDebugPanel && (
        <button 
          className="debug-toggle-btn api-debug-btn"
          onClick={onToggleApiDebugPanel}
          title="切换API调试面板"
        >
          API调试
        </button>
      )}
      {onToggleScheduleDebugPanel && (
        <button 
          className="debug-toggle-btn schedule-debug-btn"
          onClick={onToggleScheduleDebugPanel}
          title="切换日程调试面板"
        >
          日程调试
        </button>
      )}
    </div>
  );
};