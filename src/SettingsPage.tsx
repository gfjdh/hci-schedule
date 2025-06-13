import React, { useState, useEffect } from 'react';
import { CustomButton } from './Buttons';
import { LocalStorageService } from './LocalStorageService';

const SettingsPage: React.FC = () => {
  // 设置项类型
  type Setting = {
    username: string;
    notifications: boolean;
    language: 'zh' | 'en';
    timeFormat: '12h' | '24h';
  };

  // 默认设置
  const defaultSettings: Setting = {
    username: '用户',
    notifications: true,
    language: 'zh',
    timeFormat: '24h'
  };

  const [settings, setSettings] = useState<Setting>(defaultSettings);
  const [isSaved, setIsSaved] = useState(false);

  // 从本地存储加载设置
  useEffect(() => {
    const savedSettings = LocalStorageService.loadData<Setting>('app_settings', defaultSettings);
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

  return (
    <div className="settings-container">
      <h2>应用设置</h2>
      
      <div className="setting-item">
        <label>用户名：</label>
        <input 
          type="text" 
          value={settings.username} 
          onChange={(e) => handleChange('username', e.target.value)} 
        />
      </div>
      
      <div className="setting-item">
        <label>通知：</label>
        <input 
          type="checkbox" 
          checked={settings.notifications} 
          onChange={(e) => handleChange('notifications', e.target.checked)} 
        />
        <span>启用通知</span>
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