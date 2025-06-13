import React, { useEffect, useState } from 'react';
import './ScheduleArea.css';
import EventTile from './EventTile';
import { CustomButton } from './Buttons';
import { type Event, EventManager, initialEvents } from './EventManager';
import { dataManager } from './data/dataManager';

const ScheduleArea: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempEvent, setTempEvent] = useState<Partial<Event> | null>(null);
  const [eventManager] = useState<EventManager>(() => new EventManager(initialEvents));
  const [events, setEvents] = useState<Event[]>([]);
  const environmentInfo = dataManager.getEnvironmentInfo();

  // 当事件管理器中的数据变化时更新状态
  // useEffect(() => {
  //   setEvents(eventManager.getAllEvents());
  // }, [eventManager]);

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
    setIsEditing(false);
  };

  const handleAddEvent = () => {
    const newEvent: Event = {
      id: `evt_${Date.now()}`,
      name: '新事件',
      size: 50,
      color: '#a5d8ff',
      importance: 0.5,
      urgency: 0.5,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      details: {}
    };

    eventManager.addEvent(newEvent);
    setEvents(eventManager.getAllEvents());
    setSelectedEvent(newEvent);
    setIsEditing(true);
    setTempEvent({ ...newEvent });
  };

  const handleEditToggle = () => {
    if (selectedEvent) {
      setIsEditing(!isEditing);
      setTempEvent({ ...selectedEvent });
    }
  };

  const handleSaveEdit = () => {
    if (selectedEvent && tempEvent) {
      eventManager.updateEvent(selectedEvent.id, tempEvent);
      const updatedEvents = eventManager.getAllEvents();
      setEvents(updatedEvents);
      
      const updatedEvent = eventManager.getEvent(selectedEvent.id);
      if (updatedEvent) {
        setSelectedEvent(updatedEvent);
      }
      setIsEditing(false);
    }
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      eventManager.deleteEvent(selectedEvent.id);
      const updatedEvents = eventManager.getAllEvents();
      setEvents(updatedEvents);
      setSelectedEvent(null);
      setIsEditing(false);
    }
  };

  const handleFieldChange = (field: keyof Event, value: any) => {
    if (tempEvent) {
      setTempEvent({
        ...tempEvent,
        [field]: value
      });
    }
  };

  const handleDetailChange = (field: keyof Event['details'], value: any) => {
    if (tempEvent) {
      setTempEvent({
        ...tempEvent,
        details: {
          ...(tempEvent.details ?? {}),
          [field]: value
        }
      });
    }
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

        {/* 新建日程按钮 */}
        <CustomButton
          width="10vw"
          onClick={handleAddEvent}
        >
          ➕ 新建日程
        </CustomButton>

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
              {/* 事件标题和操作按钮 */}
              <div className="detail-header">
                <h3>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempEvent?.name || ''}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="edit-input"
                    />
                  ) : (
                    selectedEvent.name
                  )}
                </h3>

                <div className="action-buttons">
                  {isEditing ? (
                    <>
                      <button className="save-btn" onClick={handleSaveEdit}>保存</button>
                      <button className="cancel-btn" onClick={() => setIsEditing(false)}>取消</button>
                    </>
                  ) : (
                    <button className="edit-btn" onClick={handleEditToggle}>编辑</button>
                  )}
                  <button className="delete-btn" onClick={handleDeleteEvent}>删除</button>
                </div>
              </div>
              {/* 时间字段 */}
              <div className="detail-item">
                <span className="detail-label">时间</span>
                {isEditing ? (
                  <div className="edit-fields">
                    <input
                      type="datetime-local"
                      value={tempEvent?.startTime?.substring(0, 16) || ''}
                      onChange={(e) => handleFieldChange('startTime', e.target.value)}
                      className="edit-input"
                    />
                    <span>至</span>
                    <input
                      type="datetime-local"
                      value={tempEvent?.endTime?.substring(0, 16) || ''}
                      onChange={(e) => handleFieldChange('endTime', e.target.value)}
                      className="edit-input"
                    />
                  </div>
                ) : (
                  <div className="detail-value">
                    {new Date(selectedEvent.startTime).toLocaleString()} -
                    {new Date(selectedEvent.endTime).toLocaleTimeString()}
                  </div>
                )}
              </div>

              {/* 紧迫性字段 */}
              <div className="detail-item">
                <span className="detail-label">紧迫性</span>
                <div className="detail-value">
                  <span className="color-indicator" style={{ backgroundColor: selectedEvent.color }}></span>
                  {selectedEvent.urgency > 0.7 ? '高' : selectedEvent.urgency > 0.4 ? '中' : '低'}
                </div>
              </div>

              {/* 重要性字段 */}
              <div className="detail-item">
                <span className="detail-label">重要性</span>
                {isEditing ? (
                  <div className="edit-fields">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={tempEvent?.importance || 0}
                      onChange={(e) => handleFieldChange('importance', parseFloat(e.target.value))}
                      className="edit-slider"
                    />
                    <span>{tempEvent?.importance?.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="detail-value">
                    {selectedEvent.importance > 0.7 ? '高' : selectedEvent.importance > 0.4 ? '中' : '低'}
                  </div>
                )}
              </div>

              {/* 剩余工作量字段 */}
              <div className="detail-item">
                <span className="detail-label">剩余工作量</span>
                {isEditing ? (
                  <div className="edit-fields">
                    <input
                      type="number"
                      value={tempEvent?.size || 0}
                      onChange={(e) => handleFieldChange('size', parseInt(e.target.value))}
                      className="edit-input"
                    />
                    <span>%</span>
                  </div>
                ) : (
                  <div className="detail-value">
                    {selectedEvent.size}%
                  </div>
                )}
              </div>

              {/* 地点字段 */}
              {selectedEvent.details?.location && (
                <div className="detail-item">
                  <span className="detail-label">地点</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempEvent?.details?.location || ''}
                      onChange={(e) => handleDetailChange('location', e.target.value)}
                      className="edit-input"
                    />
                  ) : (
                    <div className="detail-value">
                      {selectedEvent.details.location}
                    </div>
                  )}
                </div>
              )}

              {/* 预计耗时字段 */}
              {selectedEvent.details?.estimatedHours && (
                <div className="detail-item">
                  <span className="detail-label">预计耗时</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={tempEvent?.details?.estimatedHours || ''}
                      onChange={(e) => handleDetailChange('estimatedHours', parseInt(e.target.value))}
                      className="edit-input"
                    />
                  ) : (
                    <div className="detail-value">
                      {selectedEvent.details.estimatedHours} 小时
                    </div>
                  )}
                </div>
              )}

              {/* 备注字段 */}
              {selectedEvent.details?.notes && (
                <div className="detail-item">
                  <span className="detail-label">备注</span>
                  {isEditing ? (
                    <textarea
                      value={tempEvent?.details?.notes || ''}
                      onChange={(e) => handleDetailChange('notes', e.target.value)}
                      className="edit-textarea"
                    />
                  ) : (
                    <div className="detail-value">
                      {selectedEvent.details.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="event-details">
              <h3>事件详情</h3>
              <p>请点击日程磁贴查看或修改详细信息</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleArea;