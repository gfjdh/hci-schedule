import React, { useState, useEffect, useRef } from 'react';
import EventTile from './EventTile';
import { type Event, EventManager, initialEvents } from './EventManager';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { VoiceDebugPanel } from './components/VoiceDebugPanel';
import { ControlArea } from './components/ControlArea';
import { ApiDebugPanel } from './components/ApiDebugPanel';
import { ScheduleDebugPanel } from './components/ScheduleDebugPanel';
import { MessageBuilder } from './LLMapi/msgBuilder';
import { CommandExecutor } from './LLMapi/commandExecutor';
import { useScheduleDescription } from './hooks/useScheduleDescription';
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
  const [scheduleDebugPanelVisible, setScheduleDebugPanelVisible] = useState(false);
  const [commandStatus, setCommandStatus] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error' | 'need_more_info';
    message: string;
    data?: any;
    missingInfo?: string;
  }>({ status: 'idle', message: '' });

  const [supplementInput, setSupplementInput] = useState('');
  const [isWaitingForSupplement, setIsWaitingForSupplement] = useState(false);
  const prevCommandRef = useRef('');
  const { getScheduleDescription } = useScheduleDescription();

  // 处理执行命令
  const handleExecuteCommand = async () => {
    if (commandInput.trim() === '') return;
    setCommandStatus({ status: 'processing', message: '处理中...' });
    prevCommandRef.current = commandInput;

    try {
      const msgBuilder = new MessageBuilder();
      const scheduleDescription = getScheduleDescription(eventManager.getAllEvents());
      const result = await msgBuilder.processCommand(commandInput, scheduleDescription);
      if (result.status === 'need_more_info') {
        setCommandStatus({
          status: 'need_more_info',
          message: result.message,
          missingInfo: result.missingInfo
        });
        setIsWaitingForSupplement(true);
        return;
      }

      if (result.status === 'success') {
        // 如果是操作指令
        if (result.data) {
          const executor = new CommandExecutor(eventManager);
          const execResult = executor.execute(result.data);

          if (execResult.success) {
            // 更新事件列表
            setEvents(eventManager.getAllEvents());
            setCommandStatus({
              status: 'success',
              message: '操作成功：' + execResult.message
            });
          } else {
            setCommandStatus({
              status: 'error',
              message: execResult.message
            });
          }
        } else {
          // 如果是帮助信息或建议
          setCommandStatus({
            status: 'success',
            message: result.message
          });
        }
      } else {
        setCommandStatus(result);
      }
    } catch (error: any) {
      setCommandStatus({
        status: 'error',
        message: error.message
      });
    } finally {
      if (!isWaitingForSupplement) {
        setCommandInput('');
      }
    }
  };

  // 处理补充信息提交
  const handleSupplementSubmit = () => {
    if (supplementInput.trim() === '') return;

    // 合并原始指令和补充信息
    const combinedInput = `${prevCommandRef.current} ${supplementInput}`;
    setCommandInput(combinedInput);
    setIsWaitingForSupplement(false);
    setSupplementInput('');

    // 重新执行命令
    setCommandStatus({ status: 'processing', message: '处理补充信息...' });
    setTimeout(() => {
      handleExecuteCommand();
    }, 100);
  };

  // 环境检测
  const isDevelopment = import.meta.env.VITE_APP_ENV === 'development' || import.meta.env.DEV;

  // 当事件管理器中的数据变化时更新状态
  useEffect(() => {
    eventManager.loadFromStorage();
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

  function calcUrgency(
    importance: number,   // 0~1
    size: number,         // 实际工作量
    remainHours: number,  // 剩余小时数
    maxSize = 100,
    maxRemain = 72
  ) {
    // 边界条件
    if (size <= 0) return 0;
    if (remainHours <= 0) return 1;

    // 归一化
    const sizeNorm = Math.max(0, Math.min(size / maxSize, 1));
    const remainNorm = 1 - Math.max(0, Math.min(remainHours / maxRemain, 1)); // 越少越大

    // 增强极端值影响（幂函数）
    const impAdj = Math.pow(importance, 1.7);
    const sizeAdj = Math.pow(sizeNorm, 1.7);
    const remainAdj = Math.pow(remainNorm, 1.7);

    // 平滑加权平均
    const urgency = 0.4 * impAdj + 0.3 * sizeAdj + 0.3 * remainAdj;

    // 保证在0~1之间
    return Math.max(0, Math.min(urgency, 1));
  }

  function calcEventColor(urgency: number) {
    // urgency ∈ [0,1]
    // 越紧急越红，越不紧急越蓝
    const hue = 220 - 220 * urgency; // 0=红，220=蓝
    const saturation = 80;
    const lightness = 55 - 20 * urgency; // 越紧急越暗
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  const handleAddEvent = () => {
    const urgency = 0.5;
    const color = calcEventColor(urgency);
    const newEvent: Event = {
      id: `evt_${Date.now()}`,
      name: '新事件',
      size: 50,
      color,
      importance: 0.5,
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

      // 计算剩余小时数
      const now = new Date();
      const endTime = new Date(field === 'endTime' ? value : updated.endTime ?? now);
      const remainMs = endTime.getTime() - now.getTime();
      const remainHours = Math.max(0, remainMs / (1000 * 60 * 60));

      // 获取最新的 importance 和 size
      const importance = field === 'importance' ? value : updated.importance ?? 0.5;
      const size = field === 'size' ? value : updated.size ?? 50;

      // 自动计算紧迫性
      updated.urgency = calcUrgency(importance, size, remainHours);
      updated.color = calcEventColor(updated.urgency);

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
      <ControlArea
        voiceState={voiceState}
        commandInput={commandInput}
        onCommandInputChange={setCommandInput}
        onToggleVoice={toggleVoiceRecognition}
        onAddEvent={handleAddEvent}
        isDevelopment={isDevelopment}
        onToggleDebugPanel={() => setDebugPanelVisible(!debugPanelVisible)}
        onToggleApiDebugPanel={() => setApiDebugPanelVisible(!apiDebugPanelVisible)}
        onToggleScheduleDebugPanel={() => setScheduleDebugPanelVisible(!scheduleDebugPanelVisible)}
        onExecuteCommand={handleExecuteCommand}
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

      {/* 日程调试面板 */}
      <ScheduleDebugPanel
        events={events}
        visible={scheduleDebugPanelVisible}
        onClose={() => setScheduleDebugPanelVisible(false)}
        isDevelopment={isDevelopment}
      />

      {/* 命令状态显示 */}
      {commandStatus.status !== 'idle' && (
        <div className={`command-status ${commandStatus.status}`}>
          {commandStatus.message}
        </div>
      )}

      {/* 补充信息输入区域 */}
      {isWaitingForSupplement && (
        <div className="supplement-area">
          <div className="supplement-prompt">{commandStatus.missingInfo}</div>
          <input
            type="text"
            value={supplementInput}
            onChange={(e) => setSupplementInput(e.target.value)}
            placeholder="请输入补充信息..."
          />
          <div className="supplement-buttons">
            <button onClick={handleSupplementSubmit}>提交</button>
            <button onClick={() => setIsWaitingForSupplement(false)}>取消</button>
          </div>
        </div>
      )}

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

              {/* 紧迫性字段, 不可修改 */}
              <div className="detail-item">
                <span className="detail-label">紧迫性</span>
                <div className="detail-value">
                  {
                    selectedEvent.urgency > 0.7 ? '高' : selectedEvent.urgency > 0.4 ? '中' : '低'
                  }
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