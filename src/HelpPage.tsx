import React from 'react';
import './HelpPage.css';

const HelpPage: React.FC = () => {
  return (
    <div className="help-container">
      <div className="help-section">
        <h2>📅 核心功能概览</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🗓️</div>
            <h3>四象限时间管理</h3>
            <p>根据事件的重要性和紧迫性将任务分为四个象限，直观展示优先级</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎤</div>
            <h3>语音控制</h3>
            <p>通过语音指令添加、编辑、删除事件，提高操作效率</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI智能指令</h3>
            <p>使用自然语言指令管理日程，AI自动解析并执行。还可以询问ai日程表的使用方法或者智能安排今日日程</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h3>个性化设置</h3>
            <p>自定义API、模型参数等设置</p>
          </div>
        </div>
      </div>

      <div className="help-section">
        <h2>📊 四象限时间管理法</h2>
        <div className="quadrant-explain">
          <div className="quadrant-diagram">
            <div className="quadrant q1">
              <div className="quadrant-label">重要但不紧急</div>
              <p>需要计划的任务</p>
            </div>
            <div className="quadrant q2">
              <div className="quadrant-label">重要且紧急</div>
              <p>立即处理的任务</p>
            </div>
            <div className="quadrant q3">
              <div className="quadrant-label">不紧急也不重要</div>
              <p>可搁置的任务</p>
            </div>
            <div className="quadrant q4">
              <div className="quadrant-label">紧急但不重要</div>
              <p>尽快处理的任务</p>
            </div>
          </div>
          <div className="quadrant-tips">
            <h3>使用技巧：</h3>
            <ul>
              <li>事件大小表示所需工作量（越大表示工作量越大）</li>
              <li>事件颜色表示紧急程度（红色=紧急，蓝色=不紧急）</li>
              <li>优先处理右上角象限（重要且紧急）的事件</li>
              <li>定期规划左上角象限（重要但不紧急）的事件</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="help-section">
        <h2>✨ 功能详解</h2>
        <div className="feature-details">
          <div className="feature-detail">
            <h3>1. 事件管理</h3>
            <ul>
              <li><strong>添加新事件</strong>：点击"新建日程"按钮或使用语音指令"添加事件"创建新事件</li>
              <li><strong>编辑事件</strong>：点击磁贴选择事件，在右侧面板编辑详细信息，或使用语音指令"编辑事件"</li>
              <li><strong>删除事件</strong>：在事件详情面板点击删除按钮，或使用语音指令"删除事件"</li>
              <li><strong>调整事件属性</strong>：拖拽重要性/紧急性滑块，或直接修改时间、工作量等参数</li>
            </ul>
          </div>

          <div className="feature-detail">
            <h3>2. 语音控制</h3>
            <ul>
              <li><strong>启动/停止语音识别</strong>：点击"🎤开始监听"按钮或使用快捷键</li>
              <li><strong>语音识别状态</strong>：红色表示正在监听，绿色表示待机状态</li>
              <li><strong>麦克风权限</strong>：首次使用需授权麦克风访问权限</li>
            </ul>
          </div>

          <div className="feature-detail">
            <h3>3. 智能指令系统</h3>
            <ul>
              <li><strong>自然语言处理</strong>：在指令框中输入自然语言指令</li>
              <li><strong>支持操作</strong>：
                <ul>
                  <li>"如何使用本日程表？" - 询问使用方法</li>
                  <li>"我今天有4小时空闲，有什么建议？" - 获取日程建议</li>
                  <li>"今天下午3点团队会议" - 添加新事件</li>
                  <li>"把设计评审改为明天上午" - 修改现有事件</li>
                  <li>"删除周报会议" - 删除事件</li>
                </ul>
              </li>
              <li><strong>指令状态反馈</strong>：系统会显示指令处理状态和结果</li>
            </ul>
          </div>

          <div className="feature-detail">
            <h3>4. 高级设置</h3>
            <ul>
              <li><strong>API设置</strong>：配置AI模型的API密钥和请求地址</li>
              <li><strong>模型选择</strong>：选择使用的AI模型</li>
              <li><strong>温度参数</strong>：调整AI的创造性（0.0-1.0）此值越低AI越严谨，越高创造性越强</li>
              <li><strong>恢复默认</strong>：一键恢复默认设置</li>
            </ul>
          </div>

          <div className="feature-detail">
            <h3>5. 调试工具（开发环境）</h3>
            <ul>
              <li><strong>语音调试面板</strong>：查看语音识别状态、日志和错误信息</li>
              <li><strong>API调试面板</strong>：测试API连接和响应</li>
              <li><strong>日程调试面板</strong>：查看事件数据结构和生成的描述</li>
              <li><strong>环境指示器</strong>：顶部显示当前为开发环境</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="help-section">
        <h2>❓ 常见问题解答</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>如何保存我的日程？</h3>
            <p>所有日程自动保存到浏览器本地存储，无需手动保存。</p>
          </div>
          <div className="faq-item">
            <h3>语音识别不工作怎么办？</h3>
            <p>1. 检查麦克风权限是否已授权<br />
              2. 确保浏览器支持Web Speech API<br />
              3. 尝试刷新页面或重启浏览器</p>
          </div>
          <div className="faq-item">
            <h3>为什么我的指令没有被正确执行？</h3>
            <p>1. 确保指令清晰明确<br />
              2. 检查网络连接是否正常<br />
              3. 确认API设置正确（设置页面）</p>
          </div>
          <div className="faq-item">
            <h3>如何手动编辑事件？</h3>
            <p>1. 选择要调整的事件块<br />
              2. 在右侧面板编辑属性<br />
              3. 系统会自动计算并更新事件的紧迫性</p>
          </div>
        </div>
      </div>

      <div className="help-section">
        <h2>🎯 高级使用技巧</h2>
        <div className="tips-grid">
          <div className="tip">
            <h3>批量操作</h3>
            <p>使用智能指令同时操作多个事件："把今天下午的所有会议推迟一小时"</p>
          </div>
          <div className="tip">
            <h3>语音文本输入</h3>
            <p>使用"输入"指令快速添加事件描述："输入项目需求文档初稿已完成"</p>
          </div>
        </div>
      </div>

      <div className="help-footer">
        <p>需要更多帮助？请访问我们的GitHub仓库提出issue：</p>
        <a
          href="https://github.com/gfjdh/hci-schedule"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://github.com/gfjdh/hci-schedule
        </a>
      </div>
    </div>
  );
};

export default HelpPage;