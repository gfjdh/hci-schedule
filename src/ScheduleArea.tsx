import React, { useState, useEffect } from 'react';
import './ScheduleArea.css';
import EventTile from './EventTile';
import { CustomButton } from './Buttons';
import type { Event } from './data/dataManager';
import { dataManager } from './data/dataManager';

const ScheduleArea: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const environmentInfo = dataManager.getEnvironmentInfo();

  // 组件挂载时加载数据并设置监听器
  useEffect(() => {
    // 初始加载数据
    setEvents(dataManager.getEvents());

    // 添加数据变化监听器
    const handleDataChange = (newEvents: Event[]) => {
      setEvents(newEvents);
    };

    dataManager.addListener(handleDataChange);

    // 清理函数：移除监听器
    return () => {
      dataManager.removeListener(handleDataChange);
    };
  }, []);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="schedule-container">
      <div className="voice-area">
        <CustomButton width="8vw">🎤 语音输入</CustomButton>
        <span className="command">
          <label className="command-label">指令</label>
          <input type="text" className="command-input" placeholder="请输入指令" />
          <CustomButton width="5vw">执行</CustomButton>
        </span>
        {/* 环境信息显示 */}
        <div style={{
          marginLeft: 'auto',
          fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
          color: '#666',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          环境: {environmentInfo.isProduction ? '生产' : '开发'} |
          数据持久化: {environmentInfo.dataPersistence ? '开启' : '关闭'}
        </div>
      </div>
      <div className="content-area">
        <div className="quadrant-view">
          <div className="axis-y"></div>
          <div className="axis-x"></div>
          <div className="axis-label axis-label-y">重要程度</div>
          <div className="axis-label axis-label-x">紧急程度</div>
          {/* 四个象限 */}
          <div className="quadrants">
            {events
              .map(event => (
                <EventTile
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                />
              ))}
          </div>
        </div>
        {/* 侧边栏 - 事件详情 */}
        <div className="sidebar">
          {selectedEvent ? (
            <div className="event-details">
              <h3>{selectedEvent.name}</h3>

              <div className="detail-item">
                <span className="detail-label">时间</span>
                <div className="detail-value">
                  {new Date(selectedEvent.startTime).toLocaleString()} -
                  {new Date(selectedEvent.endTime).toLocaleTimeString()}
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-label">紧迫性</span>
                <div className="detail-value">
                  <span className="color-indicator" style={{ backgroundColor: selectedEvent.color }}></span>
                  {selectedEvent.urgency > 0.7 ? '高' : selectedEvent.urgency > 0.4 ? '中' : '低'}
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-label">重要性</span>
                <div className="detail-value">
                  {selectedEvent.importance > 0.7 ? '高' : selectedEvent.importance > 0.4 ? '中' : '低'}
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-label">剩余工作量</span>
                <div className="detail-value">
                  {selectedEvent.size}%
                </div>
              </div>

              {selectedEvent.details?.location && (
                <div className="detail-item">
                  <span className="detail-label">地点</span>
                  <div className="detail-value">
                    {selectedEvent.details.location}
                  </div>
                </div>
              )}

              {selectedEvent.details?.estimatedHours && (
                <div className="detail-item">
                  <span className="detail-label">预计耗时</span>
                  <div className="detail-value">
                    {selectedEvent.details.estimatedHours} 小时
                  </div>
                </div>
              )}

              {selectedEvent.details?.notes && (
                <div className="detail-item">
                  <span className="detail-label">备注</span>
                  <div className="detail-value">
                    {selectedEvent.details.notes}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="event-details">
              <h3>事件详情</h3>
              <p>请点击日程磁贴查看详细信息</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleArea;