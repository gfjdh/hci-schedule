import React, { useState } from 'react';
import EventTile from './EventTile';
import './ScheduleArea.css';

interface Event {
  id: string;
  name: string;
  size: number;
  color: string;
  importance: number;
  urgency: number;
  startTime: string;
  endTime: string;
  details?: {
    location?: string;
    notes?: string;
    estimatedHours?: number;
  };
}

const ScheduleArea: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // 示例事件数据
  const events: Event[] = [
    {
      id: 'evt_001',
      name: '项目汇报',
      size: 80,
      color: '#ff6b6b',
      importance: 0.85,
      urgency: 0.9,
      startTime: '2025-06-20 14:00',
      endTime: '2025-06-20 16:00',
      details: {
        location: '会议室A',
        notes: '准备PPT和演示材料',
        estimatedHours: 2
      }
    },
    {
      id: 'evt_002',
      name: '团队周会',
      size: 60,
      color: '#4ecdc4',
      importance: 0.7,
      urgency: 0.6,
      startTime: '2025-06-18 10:00',
      endTime: '2025-06-18 11:30',
      details: {
        location: '线上会议',
        notes: '审查项目进度'
      }
    },
    {
      id: 'evt_003',
      name: '文档整理',
      size: 40,
      color: '#ffe66d',
      importance: 0.4,
      urgency: 0.3,
      startTime: '2025-06-19 09:00',
      endTime: '2025-06-19 12:00',
    },
    {
      id: 'evt_004',
      name: 'max',
      size: 40,
      color: '#ffe66d',
      importance: 1,
      urgency: 1,
      startTime: '2025-06-19 09:00',
      endTime: '2025-06-19 12:00',
    },
    {
      id: 'evt_005',
      name: 'min',
      size: 40,
      color: '#ffe66d',
      importance: 0,
      urgency: 0,
      startTime: '2025-06-19 09:00',
      endTime: '2025-06-19 12:00',
    },
  ];

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="schedule-container">
      <div className="quadrant-view">
        {/* 坐标轴标签 */}
        {/* <div className="axis-label important-label">重要程度</div>
        <div className="axis-label urgent-label">紧急程度</div> */}
        
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
                <span className="color-indicator" style={{backgroundColor: selectedEvent.color}}></span>
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
  );
};

export default ScheduleArea;