import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceRecognitionManager, VoiceCommandProcessor } from '../VoiceRecognition';
import type { VoiceRecognitionState } from '../VoiceRecognition';

export interface UseVoiceRecognitionOptions {
  isDevelopment?: boolean;
  onAddEvent?: () => void;
  onDeleteEvent?: () => void;
  onEditEvent?: () => void;
  onSaveEdit?: () => void;
  onTextInput?: (text: string) => void;
  hasSelectedEvent?: boolean;
  isEditing?: boolean;
}

export interface UseVoiceRecognitionReturn {
  // 状态
  voiceState: VoiceRecognitionState;
  debugInfo: string[];
  
  // 操作
  toggleVoiceRecognition: () => void;
  startVoiceRecognition: () => void;
  stopVoiceRecognition: () => void;
  
  // 调试相关
  clearDebugInfo: () => void;
}

export const useVoiceRecognition = (options: UseVoiceRecognitionOptions = {}): UseVoiceRecognitionReturn => {
  const {
    isDevelopment = false,
    onAddEvent,
    onDeleteEvent,
    onEditEvent,
    onSaveEdit,
    onTextInput,
    hasSelectedEvent = false,
    isEditing = false
  } = options;

  const [voiceState, setVoiceState] = useState<VoiceRecognitionState>({
    isListening: false,
    speechSupported: false,
    speechError: '',
    lastRecognizedText: '',
    microphonePermission: 'unknown',
    audioLevel: 0
  });
  
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const voiceManagerRef = useRef<VoiceRecognitionManager | null>(null);
  const commandProcessorRef = useRef<VoiceCommandProcessor | null>(null);

  // 添加调试日志
  const addDebugLog = useCallback((message: string) => {
    if (isDevelopment) {
      setDebugInfo(prev => [...prev.slice(-14), message]); // 保留最近15条日志
    }
  }, [isDevelopment]);

  // 处理状态变化
  const handleStateChange = useCallback((newState: Partial<VoiceRecognitionState>) => {
    setVoiceState(prev => ({ ...prev, ...newState }));
  }, []);

  // 处理语音命令
  const handleCommand = useCallback((command: string) => {
    if (commandProcessorRef.current) {
      commandProcessorRef.current.processCommand(command);
    }
  }, [hasSelectedEvent, isEditing]);

  // 初始化语音识别管理器
  useEffect(() => {
    // 创建命令处理器
    commandProcessorRef.current = new VoiceCommandProcessor({
      onAddEvent,
      onDeleteEvent,
      onEditEvent,
      onSaveEdit,
      onTextInput
    });

    // 创建语音识别管理器
    voiceManagerRef.current = new VoiceRecognitionManager({
      onStateChange: handleStateChange,
      onCommand: handleCommand,
      onDebugLog: addDebugLog
    }, isDevelopment);

    // 清理函数
    return () => {
      if (voiceManagerRef.current) {
        voiceManagerRef.current.destroy();
        voiceManagerRef.current = null;
      }
      commandProcessorRef.current = null;
    };
  }, [isDevelopment, handleStateChange, handleCommand, addDebugLog]);

  // 更新命令处理器的回调函数
  useEffect(() => {
    if (commandProcessorRef.current) {
      commandProcessorRef.current = new VoiceCommandProcessor({
        onAddEvent,
        onDeleteEvent,
        onEditEvent,
        onSaveEdit,
        onTextInput
      });
    }
  }, [onAddEvent, onDeleteEvent, onEditEvent, onSaveEdit, onTextInput]);

  // 切换语音识别
  const toggleVoiceRecognition = useCallback(() => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.toggle();
    }
  }, []);

  // 开始语音识别
  const startVoiceRecognition = useCallback(() => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.start();
    }
  }, []);

  // 停止语音识别
  const stopVoiceRecognition = useCallback(() => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.stop();
    }
  }, []);

  // 清理调试信息
  const clearDebugInfo = useCallback(() => {
    setDebugInfo([]);
  }, []);

  return {
    voiceState,
    debugInfo,
    toggleVoiceRecognition,
    startVoiceRecognition,
    stopVoiceRecognition,
    clearDebugInfo
  };
};