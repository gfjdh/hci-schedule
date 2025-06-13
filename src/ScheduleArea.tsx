import React, { useEffect, useState } from 'react';
import EventTile from './EventTile';
import { CustomButton } from './Buttons';
import { type Event, EventManager, initialEvents } from './EventManager';
import './ScheduleArea.css';

const ScheduleArea: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempEvent, setTempEvent] = useState<Partial<Event> | null>(null);
  const [eventManager] = useState<EventManager>(() => new EventManager(initialEvents));
  const [events, setEvents] = useState<Event[]>([]);
  
  // 语音识别相关状态
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);
  const [commandInput, setCommandInput] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string>('');
  const [lastRecognizedText, setLastRecognizedText] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);
  const [debugPanelPosition, setDebugPanelPosition] = useState({ x: 10, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [microphonePermission, setMicrophonePermission] = useState<string>('unknown');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  // 环境检测
  const isDevelopment = import.meta.env.VITE_APP_ENV === 'development' || import.meta.env.DEV;
  
  // 添加调试日志函数
  const addDebugLog = (message: string) => {
    if (isDevelopment) {
      const timestamp = new Date().toLocaleTimeString();
      const logMessage = `[${timestamp}] ${message}`;
      setDebugInfo(prev => [...prev.slice(-4), logMessage]); // 保留最近5条日志
      console.log('🎤 语音调试:', logMessage);
    }
  };

  // 当事件管理器中的数据变化时更新状态
  useEffect(() => {
    setEvents(eventManager.getAllEvents());
  }, [eventManager]);

  // 清理媒体流
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        addDebugLog('媒体流已清理');
      }
    };
  }, [mediaStream]);

  // 检测麦克风权限和音频输入
  const checkMicrophoneAccess = async () => {
    try {
      addDebugLog('检测麦克风权限...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission('granted');
      setMediaStream(stream);
      addDebugLog('麦克风权限已获取，开始监控音频级别');
      
      // 创建音频分析器来监控音频级别
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      const updateAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(Math.round(average));
        
        if (mediaStream && mediaStream.active) {
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      setMicrophonePermission('denied');
      addDebugLog(`麦克风权限检测失败: ${error}`);
    }
  };

  // 初始化语音识别
  useEffect(() => {
    addDebugLog('开始初始化语音识别模块');
    
    // 检测麦克风权限
    checkMicrophoneAccess();
    
    // 检测浏览器支持
    const hasWebkitSpeech = 'webkitSpeechRecognition' in window;
    const hasSpeech = 'SpeechRecognition' in window;
    
    addDebugLog(`浏览器支持检测: webkitSpeechRecognition=${hasWebkitSpeech}, SpeechRecognition=${hasSpeech}`);
    
    if (hasWebkitSpeech || hasSpeech) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN';
        
        addDebugLog('语音识别对象创建成功，配置: continuous=false, lang=zh-CN');
        
        recognition.onstart = () => {
          setIsListening(true);
          setSpeechError('');
          addDebugLog('语音识别开始监听');
        };
        
        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          // 更新显示的文本（包括中间结果）
          const displayText = finalTranscript + interimTranscript;
          setLastRecognizedText(displayText);
          setCommandInput(displayText);
          
          // 只有最终结果才处理命令
          if (finalTranscript) {
            const confidence = event.results[event.resultIndex][0].confidence;
            addDebugLog(`最终识别结果: "${finalTranscript}" (置信度: ${confidence.toFixed(2)})`);
            processVoiceCommand(finalTranscript);
          } else if (interimTranscript) {
            addDebugLog(`中间识别结果: "${interimTranscript}"`);
          }
        };
        
        recognition.onend = () => {
          // 在持续监听模式下，只有手动停止才设置为false
          if (!isListening) {
            addDebugLog('语音识别已结束');
          } else {
            addDebugLog('语音识别意外结束，尝试重新启动');
            // 如果是意外结束且仍在监听状态，尝试重新启动
            setTimeout(() => {
              if (isListening && speechRecognition) {
                try {
                  speechRecognition.start();
                  addDebugLog('语音识别已重新启动');
                } catch (error) {
                  addDebugLog(`重新启动失败: ${error}`);
                  setIsListening(false);
                }
              }
            }, 100);
          }
        };
        
        recognition.onerror = (event) => {
          let errorMsg = `语音识别错误: ${event.error}`;
          let suggestion = '';
          
          // 针对不同错误类型提供具体建议
          switch (event.error) {
            case 'no-speech':
              suggestion = '未检测到语音输入。请确保：1) 麦克风权限已授权 2) 麦克风工作正常 3) 说话声音足够大 4) 环境噪音不要太大';
              break;
            case 'audio-capture':
              suggestion = '无法访问麦克风。请检查麦克风权限和设备连接';
              break;
            case 'not-allowed':
              suggestion = '麦克风权限被拒绝。请在浏览器设置中允许麦克风访问';
              break;
            case 'network':
              suggestion = '网络错误。请检查网络连接';
              break;
            case 'service-not-allowed':
              suggestion = '语音识别服务不可用。请稍后重试';
              break;
            default:
              suggestion = '未知错误，请重试';
          }
          
          errorMsg += ` | 建议: ${suggestion}`;
          setSpeechError(errorMsg);
          
          // 某些错误不需要停止监听状态（如no-speech），让用户手动控制
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
            setIsListening(false);
          }
          
          addDebugLog(errorMsg);
          console.error('🎤 语音识别错误详情:', event);
        };
        
        setSpeechRecognition(recognition);
        setSpeechSupported(true);
        addDebugLog('语音识别模块初始化完成');
      } catch (error) {
        const errorMsg = `语音识别初始化失败: ${error}`;
        setSpeechError(errorMsg);
        addDebugLog(errorMsg);
        console.error('🎤 语音识别初始化错误:', error);
      }
    } else {
      const errorMsg = '浏览器不支持语音识别功能';
      setSpeechError(errorMsg);
      addDebugLog(errorMsg);
    }
  }, []);

  // 处理语音命令
  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    addDebugLog(`处理语音命令: "${command}"`);
    
    if (lowerCommand.includes('新建') || lowerCommand.includes('添加') || lowerCommand.includes('创建')) {
      addDebugLog('执行命令: 新建事件');
      handleAddEvent();
    } else if (lowerCommand.includes('删除') && selectedEvent) {
      addDebugLog('执行命令: 删除事件');
      handleDeleteEvent();
    } else if (lowerCommand.includes('编辑') && selectedEvent) {
      addDebugLog('执行命令: 编辑事件');
      handleEditToggle();
    } else if (lowerCommand.includes('保存') && isEditing) {
      addDebugLog('执行命令: 保存编辑');
      handleSaveEdit();
    } else {
      addDebugLog('未匹配到命令，文本已填入输入框');
      // 如果没有匹配的命令，将语音文本填入命令输入框
      setCommandInput(command);
    }
  };

  // 拖动相关函数
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - debugPanelPosition.x,
      y: e.clientY - debugPanelPosition.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setDebugPanelPosition({
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

  // 切换语音识别状态
  const toggleVoiceRecognition = () => {
    if (!speechSupported) {
      addDebugLog('语音识别不支持，无法启动');
      return;
    }
    
    if (!speechRecognition) {
      addDebugLog('语音识别对象未初始化');
      return;
    }
    
    if (isListening) {
      // 停止语音识别
      try {
        addDebugLog('停止语音识别');
        setIsListening(false);
        speechRecognition.stop();
        setSpeechError('');
      } catch (error) {
        const errorMsg = `停止语音识别失败: ${error}`;
        setSpeechError(errorMsg);
        addDebugLog(errorMsg);
      }
    } else {
      // 开始语音识别
      try {
        addDebugLog('启动语音识别');
        setLastRecognizedText('');
        setCommandInput('');
        setSpeechError('');
        speechRecognition.start();
      } catch (error) {
        const errorMsg = `启动语音识别失败: ${error}`;
        setSpeechError(errorMsg);
        addDebugLog(errorMsg);
      }
    }
  };

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
      {/* 环境指示器 - 仅在开发环境显示 */}
      {isDevelopment && (
        <div className="environment-indicator">
          <span className="env-badge">开发环境</span>
          <button 
            className="debug-toggle-btn"
            onClick={() => setDebugPanelVisible(!debugPanelVisible)}
            title={debugPanelVisible ? '关闭调试面板' : '打开调试面板'}
          >
            🔧
          </button>
        </div>
      )}
      
      {/* 语音调试面板 - 仅在开发环境显示 */}
      {isDevelopment && debugPanelVisible && (
        <div 
          className="speech-debug-panel"
          style={{
            left: `${debugPanelPosition.x}px`,
            top: `${debugPanelPosition.y}px`,
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
              onClick={() => setDebugPanelVisible(false)}
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
              <span className={`status-value ${microphonePermission === 'granted' ? 'success' : microphonePermission === 'denied' ? 'error' : 'warning'}`}>
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
      )}
      
      <div className="voice-area">
        <CustomButton 
          width="8vw" 
          onClick={toggleVoiceRecognition}
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
            onChange={(e) => setCommandInput(e.target.value)}
          />
          <CustomButton width="5vw">执行</CustomButton>
        </span>
        {/* 新建日程按钮 */}
        <CustomButton
          width="10vw"
          onClick={handleAddEvent}
        >
          ➕ 新建日程
        </CustomButton>
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