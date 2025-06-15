import React, { useState } from 'react';
import { useScheduleDescription } from '../hooks/useScheduleDescription';
import type { Event } from '../EventManager';
import './ScheduleDebugPanel.css';

export interface ScheduleDebugPanelProps {
  events: Event[];
  visible: boolean;
  onClose: () => void;
  isDevelopment?: boolean;
}

export const ScheduleDebugPanel: React.FC<ScheduleDebugPanelProps> = ({
  events,
  visible,
  onClose,
  isDevelopment = false
}) => {
  const [position, setPosition] = useState({ x: 10, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [description, setDescription] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    getScheduleDescription,
    generateEventDescription,
    formatTime,
    getImportanceText,
    getUrgencyText
  } = useScheduleDescription();

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

  // 添加和移除事件监听器
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 生成完整描述
  const handleGenerateDescription = () => {
    setIsGenerating(true);
    try {
      const desc = getScheduleDescription(events);
      setDescription(desc);
    } catch (error) {
      setDescription(`生成描述时出错: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 清空描述
  const handleClearDescription = () => {
    setDescription('');
  };

  // 复制到剪贴板
  const handleCopyDescription = async () => {
    if (description) {
      try {
        await navigator.clipboard.writeText(description);
        alert('描述已复制到剪贴板');
      } catch (error) {
        console.error('复制失败:', error);
        alert('复制失败');
      }
    }
  };

  // 测试单个事件描述
  const handleTestSingleEvent = (event: Event, index: number) => {
    const singleDesc = generateEventDescription(event, index);
    setDescription(prev => prev ? `${prev}\n\n--- 单个事件测试 ---\n${singleDesc}` : singleDesc);
  };

  if (!isDevelopment || !visible) {
    return null;
  }

  return (
    <div 
      className={`schedule-debug-panel ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div 
        className="schedule-debug-header"
        onMouseDown={handleMouseDown}
      >
        <span>日程信息调试</span>
        <button className="schedule-debug-close" onClick={onClose}>×</button>
      </div>
      
      <div className="schedule-debug-content">
        {/* 统计信息 */}
        <div className="schedule-debug-section">
          <h4>事件统计</h4>
          <div className="schedule-debug-stats">
            <div className="schedule-debug-stat">
              <span className="schedule-debug-stat-label">事件总数</span>
              <span className="schedule-debug-stat-value">{events.length}</span>
            </div>
            <div className="schedule-debug-stat">
              <span className="schedule-debug-stat-label">高优先级</span>
              <span className="schedule-debug-stat-value">{events.filter(e => e.importance >= 0.7 && e.urgency >= 0.7).length}</span>
            </div>
            <div className="schedule-debug-stat">
              <span className="schedule-debug-stat-label">中优先级</span>
              <span className="schedule-debug-stat-value">{events.filter(e => (e.importance >= 0.4 || e.urgency >= 0.4) && !(e.importance >= 0.7 && e.urgency >= 0.7)).length}</span>
            </div>
            <div className="schedule-debug-stat">
              <span className="schedule-debug-stat-label">低优先级</span>
              <span className="schedule-debug-stat-value">{events.filter(e => e.importance < 0.4 && e.urgency < 0.4).length}</span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="schedule-debug-section">
          <h4>操作控制</h4>
          <div className="schedule-debug-buttons">
            <button 
              className="schedule-debug-btn"
              onClick={handleGenerateDescription}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  生成中...
                  <span className="schedule-debug-loading"></span>
                </>
              ) : '生成完整描述'}
            </button>
            
            <button 
              className="schedule-debug-btn"
              onClick={handleClearDescription}
            >
              清空
            </button>
            
            <button 
               className="schedule-debug-btn"
               onClick={handleCopyDescription}
               disabled={!description}
             >
               复制
             </button>
           </div>
        </div>

        {/* 事件列表 */}
        <div className="schedule-debug-section">
          <h4>事件列表</h4>
          <div className="schedule-debug-output" style={{ maxHeight: '150px' }}>
            {events.length === 0 ? (
              <div>暂无事件</div>
            ) : (
              events.map((event, index) => (
                <div key={event.id} style={{ marginBottom: '8px', padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{event.name}</strong>
                      <div style={{ fontSize: '10px', opacity: 0.8 }}>
                        重要性: {getImportanceText(event.importance)} | 
                        紧急性: {getUrgencyText(event.urgency)}
                      </div>
                    </div>
                    <button
                      className="schedule-debug-btn"
                      onClick={() => handleTestSingleEvent(event, index)}
                      style={{ fontSize: '10px', padding: '2px 6px' }}
                    >
                      测试
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 描述输出区域 */}
        <div className="schedule-debug-section">
          <h4>生成的描述</h4>
          <div className="schedule-debug-output" style={{ minHeight: '200px', whiteSpace: 'pre-wrap' }}>
            {description || '点击"生成完整描述"按钮来生成日程描述...'}
          </div>
        </div>

        {/* 钩子函数测试 */}
        <div className="schedule-debug-section">
          <h4>钩子函数测试</h4>
          <div className="schedule-debug-test-area">
            <div>formatTime: {formatTime(new Date().toISOString())}</div>
            <div>getImportanceText(0.8): {getImportanceText(0.8)}</div>
            <div>getUrgencyText(0.6): {getUrgencyText(0.6)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};