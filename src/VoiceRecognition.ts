// 语音识别模块
export interface VoiceRecognitionState {
  isListening: boolean;
  speechSupported: boolean;
  speechError: string;
  lastRecognizedText: string;
  microphonePermission: 'unknown' | 'granted' | 'denied';
  audioLevel: number;
}

export interface VoiceRecognitionCallbacks {
  onStateChange: (state: Partial<VoiceRecognitionState>) => void;
  onCommand: (command: string) => void;
  onDebugLog?: (message: string) => void;
}

export class VoiceRecognitionManager {
  private speechRecognition: SpeechRecognition | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrame: number | null = null;
  private callbacks: VoiceRecognitionCallbacks;
  private isDevelopment: boolean;
  
  private state: VoiceRecognitionState = {
    isListening: false,
    speechSupported: false,
    speechError: '',
    lastRecognizedText: '',
    microphonePermission: 'unknown',
    audioLevel: 0
  };

  constructor(callbacks: VoiceRecognitionCallbacks, isDevelopment = false) {
    this.callbacks = callbacks;
    this.isDevelopment = isDevelopment;
    this.initialize();
  }

  private addDebugLog(message: string) {
    if (this.isDevelopment && this.callbacks.onDebugLog) {
      const timestamp = new Date().toLocaleTimeString();
      const logMessage = `[${timestamp}] ${message}`;
      this.callbacks.onDebugLog(logMessage);
      console.log('🎤 语音调试:', logMessage);
    }
  }

  private updateState(newState: Partial<VoiceRecognitionState>) {
    this.state = { ...this.state, ...newState };
    this.callbacks.onStateChange(newState);
  }

  private async checkMicrophoneAccess(): Promise<void> {
    try {
      this.addDebugLog('检测麦克风权限...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.updateState({ microphonePermission: 'granted' });
      this.mediaStream = stream;
      this.addDebugLog('麦克风权限已获取，开始监控音频级别');
      
      // 创建音频分析器来监控音频级别
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      const microphone = this.audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      microphone.connect(this.analyser);
      this.analyser.fftSize = 256;
      
      const updateAudioLevel = () => {
        if (!this.analyser || !this.mediaStream?.active) return;
        
        this.analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        this.updateState({ audioLevel: Math.round(average) });
        
        this.animationFrame = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    } catch (error) {
      this.updateState({ microphonePermission: 'denied' });
      this.addDebugLog(`麦克风权限检测失败: ${error}`);
    }
  }

  private async initialize(): Promise<void> {
    this.addDebugLog('开始初始化语音识别模块');
    
    // 检测麦克风权限
    await this.checkMicrophoneAccess();
    
    // 检测浏览器支持
    const hasWebkitSpeech = 'webkitSpeechRecognition' in window;
    const hasSpeech = 'SpeechRecognition' in window;
    
    this.addDebugLog(`浏览器支持检测: webkitSpeechRecognition=${hasWebkitSpeech}, SpeechRecognition=${hasSpeech}`);
    
    if (hasWebkitSpeech || hasSpeech) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN';
        
        this.addDebugLog('语音识别对象创建成功，配置: continuous=true, lang=zh-CN');
        
        recognition.onstart = () => {
          this.updateState({ isListening: true, speechError: '' });
          this.addDebugLog('语音识别开始监听');
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
          this.updateState({ lastRecognizedText: displayText });
          
          // 只有最终结果才处理命令
          if (finalTranscript) {
            const confidence = event.results[event.resultIndex][0].confidence;
            this.addDebugLog(`最终识别结果: "${finalTranscript}" (置信度: ${confidence.toFixed(2)})`);
            this.callbacks.onCommand(finalTranscript);
          } else if (interimTranscript) {
            this.addDebugLog(`中间识别结果: "${interimTranscript}"`);
          }
        };
        
        recognition.onend = () => {
          // 在持续监听模式下，只有手动停止才设置为false
          if (!this.state.isListening) {
            this.addDebugLog('语音识别已结束');
          } else {
            this.addDebugLog('语音识别意外结束，尝试重新启动');
            // 如果是意外结束且仍在监听状态，尝试重新启动
            setTimeout(() => {
              if (this.state.isListening && this.speechRecognition) {
                try {
                  this.speechRecognition.start();
                  this.addDebugLog('语音识别已重新启动');
                } catch (error) {
                  this.addDebugLog(`重新启动失败: ${error}`);
                  this.updateState({ isListening: false });
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
          this.updateState({ speechError: errorMsg });
          
          // 某些错误不需要停止监听状态（如no-speech），让用户手动控制
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
            this.updateState({ isListening: false });
          }
          
          this.addDebugLog(errorMsg);
          console.error('🎤 语音识别错误详情:', event);
        };
        
        this.speechRecognition = recognition;
        this.updateState({ speechSupported: true });
        this.addDebugLog('语音识别模块初始化完成');
      } catch (error) {
        const errorMsg = `语音识别初始化失败: ${error}`;
        this.updateState({ speechError: errorMsg });
        this.addDebugLog(errorMsg);
        console.error('🎤 语音识别初始化错误:', error);
      }
    } else {
      const errorMsg = '浏览器不支持语音识别功能';
      this.updateState({ speechError: errorMsg });
      this.addDebugLog(errorMsg);
    }
  }

  public toggle(): void {
    if (!this.state.speechSupported) {
      this.addDebugLog('语音识别不支持，无法启动');
      return;
    }
    
    if (!this.speechRecognition) {
      this.addDebugLog('语音识别对象未初始化');
      return;
    }
    
    if (this.state.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  public start(): void {
    if (!this.speechRecognition) return;
    
    try {
      this.addDebugLog('启动语音识别');
      this.updateState({ 
        lastRecognizedText: '', 
        speechError: '' 
      });
      this.speechRecognition.start();
    } catch (error) {
      const errorMsg = `启动语音识别失败: ${error}`;
      this.updateState({ speechError: errorMsg });
      this.addDebugLog(errorMsg);
    }
  }

  public stop(): void {
    if (!this.speechRecognition) return;
    
    try {
      this.addDebugLog('停止语音识别');
      this.updateState({ isListening: false });
      this.speechRecognition.stop();
      this.updateState({ speechError: '' });
    } catch (error) {
      const errorMsg = `停止语音识别失败: ${error}`;
      this.updateState({ speechError: errorMsg });
      this.addDebugLog(errorMsg);
    }
  }

  public getState(): VoiceRecognitionState {
    return { ...this.state };
  }

  public destroy(): void {
    this.stop();
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.addDebugLog('媒体流已清理');
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// 语音命令处理器
export class VoiceCommandProcessor {
  private callbacks: {
    onAddEvent?: () => void;
    onDeleteEvent?: () => void;
    onEditEvent?: () => void;
    onSaveEdit?: () => void;
    onTextInput?: (text: string) => void;
  };

  constructor(callbacks: {
    onAddEvent?: () => void;
    onDeleteEvent?: () => void;
    onEditEvent?: () => void;
    onSaveEdit?: () => void;
    onTextInput?: (text: string) => void;
  }) {
    this.callbacks = callbacks;
  }

  public processCommand(command: string): void {
    // 将语音文本追加到输入框
    this.callbacks.onTextInput?.(command);
  }
}