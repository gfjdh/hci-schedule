import React, { useState, useEffect } from 'react';
import EventTile from './EventTile';
import { type Event, EventManager, initialEvents } from './EventManager';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { VoiceDebugPanel } from './components/VoiceDebugPanel';
import { VoiceControlArea } from './components/VoiceControlArea';
import { ApiDebugPanel } from './components/ApiDebugPanel';
import './ScheduleArea.css';

const ScheduleArea: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempEvent, setTempEvent] = useState<Partial<Event> | null>(null);
  const [eventManager] = useState<EventManager>(() => new EventManager(initialEvents));
  const [events, setEvents] = useState<Event[]>([]);
  const [commandInput, setCommandInput] = useState('');
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);
  const [apiDebugPanelVisible, setApiDebugPanelVisible] = useState(false);
  
  // 环境检测
  const isDevelopment = import.meta.env.VITE_APP_ENV === 'development' || import.meta.env.DEV;

  // 当事件管理器中的数据变化时更新状态
  useEffect(() => {
    setEvents(eventManager.getAllEvents());
  }, [eventManager]);

  // 语音识别功能
  const { voiceState, debugInfo, toggleVoiceRecognition } = useVoiceRecognition({
    isDevelopment,
    onAddEvent: () => handleAddEvent(),
    onDeleteEvent: () => handleDeleteEvent(),
    onEditEvent: () => handleEditToggle(),
    onSaveEdit: () => handleSaveEdit(),
    onTextInput: (text: string) => setCommandInput(prev => prev + text),
    hasSelectedEvent: !!selectedEvent,
    isEditing
  });

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEditing(false);
  };

  function calcEventColor(importance: number, urgency: number) {
    // importance, urgency ∈ [0,1]
    // 计算权重，越大越红，越小越蓝
    const weight = (importance + urgency) / 2;
    // hue: 220(蓝) → 0(红)
    const hue = 220 - 220 * weight;
    // 饱和度和亮度可微调
    const saturation = 80;
    const lightness = 55 - 20 * weight; // 越重要越暗
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  const handleAddEvent = () => {
    const importance = 0.5;
    const urgency = 0.5;
    const color = calcEventColor(importance, urgency);
    const newEvent: Event = {
      id: `evt_${Date.now()}`,
      name: '新事件',
      size: 50,
      color,
      importance,
      urgency,
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
      const updated = { ...tempEvent, [field]: value };
      // 如果改的是重要性或紧迫性，自动更新颜色
      if (field === 'importance' || field === 'urgency') {
        const importance = field === 'importance' ? value : updated.importance ?? 0.5;
        const urgency = field === 'urgency' ? value : updated.urgency ?? 0.5;
        updated.color = calcEventColor(importance, urgency);
      }
      setTempEvent(updated);
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
      {/* 语音控制区域 */}
      <VoiceControlArea
        voiceState={voiceState}
        commandInput={commandInput}
        onCommandInputChange={setCommandInput}
        onToggleVoice={toggleVoiceRecognition}
        onAddEvent={handleAddEvent}
        isDevelopment={isDevelopment}
        onToggleDebugPanel={() => setDebugPanelVisible(!debugPanelVisible)}
        onToggleApiDebugPanel={() => setApiDebugPanelVisible(!apiDebugPanelVisible)}
      />
      
      {/* 语音调试面板 */}
      <VoiceDebugPanel
        voiceState={voiceState}
        debugInfo={debugInfo}
        visible={debugPanelVisible}
        onClose={() => setDebugPanelVisible(false)}
        isDevelopment={isDevelopment}
      />
      
      {/* API调试面板 */}
      <ApiDebugPanel
        visible={apiDebugPanelVisible}
        onClose={() => setApiDebugPanelVisible(false)}
        isDevelopment={isDevelopment}
      />

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
                <div>
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
                </div>

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
                  <div className="edit-fields-time">
                    <input
                      type="datetime-local"
                      value={tempEvent?.startTime?.substring(0, 16) || ''}
                      onChange={(e) => handleFieldChange('startTime', e.target.value)}
                      className="edit-input"
                    />
                    <div>至</div>
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
                  {
                    isEditing ? (
                      <div className="edit-fields">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={tempEvent?.urgency || 0}
                          onChange={(e) => handleFieldChange('urgency', parseFloat(e.target.value))}
                          className="edit-slider"
                        />
                        <span>{tempEvent?.urgency?.toFixed(2)}</span>
                      </div>
                    ) : (
                      selectedEvent.urgency > 0.7 ? '高' : selectedEvent.urgency > 0.4 ? '中' : '低'
                    )}
                  </div>
              </div>

              {/* 重要性字段 */}
              <div className="detail-item">
                <span className="detail-label">重要性</span>
                <div className="detail-value">
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