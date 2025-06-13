import React from 'react';

const HelpPage: React.FC = () => {
  return (
    <div className="help-container">
      <h2>日程管理应用使用指南</h2>
      
      <div className="help-section">
        <h3>📅 四象限时间管理法</h3>
        <p>
          本应用采用四象限时间管理法，帮助您根据事件的重要性和紧迫性进行分类：
        </p>
        <ul>
          <li><strong>第一象限（重要且紧急）</strong>：必须立即处理的任务</li>
          <li><strong>第二象限（重要但不紧急）</strong>：需要计划的任务</li>
          <li><strong>第三象限（紧急但不重要）</strong>：尽快处理的任务</li>
          <li><strong>第四象限（不紧急也不重要）</strong>：可搁置的任务</li>
        </ul>
      </div>
      
      <div className="help-section">
        <h3>✨ 核心功能</h3>
        <ol>
          <li>
            <strong>添加新事件</strong>：点击"新建日程"按钮创建新事件
          </li>
          <li>
            <strong>事件编辑</strong>：点击磁贴选择事件，在右侧面板编辑详细信息
          </li>
          <li>
            <strong>事件管理</strong>：编辑、删除或调整事件的重要性和紧迫性
          </li>
          <li>
            <strong>语音输入</strong>：使用语音指令快速添加事件（开发中）
          </li>
        </ol>
      </div>
      
      <div className="help-section">
        <h3>🎯 使用技巧</h3>
        <ul>
          <li>事件大小表示所需工作量（越大表示工作量越大）</li>
        </ul>
      </div>
      
      <div className="help-section">
        <h3>❓ 常见问题</h3>
        <p><strong>Q: 如何保存我的日程？</strong></p>
        <p>A: 所有日程自动保存到浏览器本地存储，无需手动保存。</p>
      </div>
      
      <div className="help-footer">
        <p>需要更多帮助？请</p>
      </div>
    </div>
  );
};

export default HelpPage;