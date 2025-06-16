import React, { useState, useEffect } from 'react';
import { CustomButton } from './Buttons';
import { LocalStorageService } from './hooks/useLocalStorageService';

const SettingsPage: React.FC = () => {
  // 设置项类型
  type Setting = {
    baseURL: string
    key: string
    appointModel: string
    temperature: number
  };

  // 默认设置
  const defaultSettings: Setting = {
    baseURL: 'https://api.deepseek.com/v1/chat/completions',
    key: '',
    appointModel: 'deepseek-chat',
    temperature: 0.3,
  };

  const [settings, setSettings] = useState<Setting>(defaultSettings);
  const [isSaved, setIsSaved] = useState(false);

  // 从本地存储加载设置
  useEffect(() => {
    const savedSettings = getSettings();
    setSettings(savedSettings);
  }, []);

  // 保存设置到本地存储
  const saveSettings = () => {
    LocalStorageService.saveData('app_settings', settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // 重置为默认设置
  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  // 处理表单变化
  const handleChange = (field: keyof Setting, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // 获取设置
  const getSettings = () => {
    return LocalStorageService.loadData<Setting>('app_settings', defaultSettings);
  };

  return (
    <div className="settings-container">
      <h2>应用设置</h2>
      
      <div className="setting-item">
        <label>模型请求地址：</label>
        <input 
          type="text" 
          value={settings.baseURL || ''} 
          onChange={(e) => handleChange('baseURL', e.target.value)} 
        />
      </div>
      
      <div className="setting-item">
        <label>API 密钥：</label>
        <input 
          type="password" 
          value={settings.key || ''} 
          onChange={(e) => handleChange('key', e.target.value)} 
        />
      </div>

      <div className="setting-item">
        <label>模型名称：</label>
        <input 
          type="text" 
          value={settings.appointModel || ''} 
          onChange={(e) => handleChange('appointModel', e.target.value)} 
        />
      </div>

      <div className="setting-item">
        <label>温度：</label>
        <input 
          type="number" 
          step="0.1" 
          value={settings.temperature} 
          onChange={(e) => handleChange('temperature', parseFloat(e.target.value))} 
        />
        <span>（0.0 - 1.0）</span>
      </div>
      
      <div className="setting-actions">
        <CustomButton width="100px" onClick={saveSettings}>
          保存设置
        </CustomButton>
        <CustomButton width="100px" onClick={resetSettings}>
          恢复默认
        </CustomButton>
        {isSaved && <span className="save-message">✓ 设置已保存</span>}
      </div>
    </div>
  );
};

export default SettingsPage;