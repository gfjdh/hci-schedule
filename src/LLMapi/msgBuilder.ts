// msgBuilder.ts
import { APIClient } from './api';
import type { Event } from '../EventManager';

// 定义用户指令意图类型
type IntentType =
  | 'help'
  | 'suggest_with_info'
  | 'suggest_without_info'
  | 'modify_with_info'
  | 'modify_without_info';

// 第一步意图识别的响应结构
interface IntentResponse {
  intent: IntentType;
  missing_info?: string;
}

// 第二步操作指令的结构
interface OperationCommand {
  operation: 'add' | 'update' | 'delete';
  event: Partial<Event>;
}

export class MessageBuilder {
  private apiClient: APIClient;
  constructor() {
    this.apiClient = new APIClient();
  }

  // 第一步：意图识别
  public async detectIntent(userInput: string): Promise<IntentResponse> {
    const prompt = `你是一个日程管理助手。请根据用户输入判断他的意图，并返回一个JSON对象，包含两个字段：intent和missing_info。

可能的意图：
- help: 用户需要帮助，例如询问如何使用、功能说明等
- suggest_with_info: 用户要求生成今日安排建议，并且已经提供了今日的空闲时长（例如"我今天有4小时空闲"）
- suggest_without_info: 用户要求生成今日安排建议，但没有提供今日的空闲时长
- modify_with_info: 用户要求增删改日程，并且提供了足够的信息（例如事件名称、时间等，注意：删除或修改只需要日程名）
- modify_without_info: 用户要求增删改日程，但信息不足（例如缺少时间、事件名称等，注意：删除或修改只需要日程名）

注意：如果用户要求增删改日程，但缺少必要信息，请在missing_info中说明需要补充什么信息（例如"请提供事件的具体时间"）。

用户输入：${userInput}

请只返回JSON，不要有其他内容。`;

    const messages = [
      { role: 'system', content: '你是一个智能助手，需要根据用户输入判断意图，并以JSON格式回答。' },
      { role: 'user', content: prompt }
    ];

    const response = await this.apiClient.chat(messages);
    const filteredResponse = response.content.trim().match(/```json\s*({[\s\S]*})\s*```/);
    const jsonMatch = filteredResponse ? filteredResponse[1] : response.content;
    try {
      const result: IntentResponse = JSON.parse(jsonMatch);
      if (!result.intent) {
        throw new Error('返回的JSON格式不正确');
      }
      return result;
    } catch (e: any) {
      throw new Error(`解析意图失败: ${e.message}，返回内容：${response.content}`);
    }
  }

  // 第二步：处理帮助请求
  public async handleHelpRequest(userInput: string): Promise<string> {
    const helpPrompt = `你是一个日程管理助手，请向用户介绍你的功能和使用方法。注意：讲解的根据仅限于给你的资料，任何与之无关的内容都不需要提及。
  用户的问题是：${userInput}

## 🚀 核心功能概览

1. **四象限时间管理法**
   - 根据事件的重要性和紧迫性将任务分为四个象限
   - 右上角：重要且紧急（立即处理）
   - 左上角：重要但不紧急（需要计划）
   - 右下角：紧急但不重要（尽快处理）
   - 左下角：不紧急也不重要（可搁置）

2. **事件管理系统**
   - 添加/编辑/删除事件
   - 设置事件时间、地点、备注
   - 调整重要性(0-1)和剩余工作量(0-100%)
   - 事件颜色自动根据紧迫性变化（红=紧急，蓝=不紧急）

3. **语音控制系统**
   - 语音指令：添加事件、删除事件、编辑事件、保存编辑
   - 语音文本输入：将语音转换为指令框文本
   - 麦克风权限管理

4. **智能指令系统**
   - 自然语言处理："今天下午3点团队会议"
   - 复杂指令："把设计评审改为明天上午"
   - 日程建议："我今天有4小时空闲，有什么建议？"

5. **高级设置**
   - API密钥配置
   - 模型选择（默认：deepseek-R1）
   - 温度参数调整（0.0-1.0）
   - 恢复默认设置

## 📝 详细使用指南

### 1. 事件管理
- **添加事件**：点击"新建日程"按钮或使用语音指令"添加事件"
- **编辑事件**：点击磁贴选择事件，在右侧面板编辑详细信息
- **删除事件**：选择事件后点击删除按钮或使用语音指令"删除事件"
- **调整属性**：
  - 拖动"重要性"滑块(0-1)
  - 设置"剩余工作量"(0-100%)
  - 修改开始/结束时间
  - 系统会自动计算紧迫性并更新事件位置和颜色

### 2. 语音控制
- **启动语音识别**：点击"🎤开始监听"按钮（绿色）
- **停止语音识别**：点击"🎤停止监听"按钮（红色）
- **支持指令**：
  - "添加事件" - 创建新事件
  - "删除事件" - 删除当前选中事件
  - "编辑事件" - 进入当前选中事件的编辑模式
  - "保存编辑" - 保存当前编辑的事件
  - "输入[文本]" - 将文本输入到指令框中
- **麦克风权限**：首次使用需授权麦克风访问权限

### 3. 智能指令
- **指令格式**：在顶部指令框输入自然语言指令
- **示例指令**：
  - "今天下午3点团队会议，地点会议室A"
  - "把周报会议改为明天上午10点"
  - "删除午餐会议"
  - "我今天下午有2小时空闲时间"
- **指令处理**：
  1. 系统识别指令意图
  2. 解析为具体操作（添加/修改/删除）
  3. 执行操作并显示结果

### 4. 四象限视图
- **Y轴**：重要性（顶部=重要，底部=不重要）
- **X轴**：紧急性（右侧=紧急，左侧=不紧急）
- **事件大小**：表示剩余工作量（越大表示工作量越大）
- **交互操作**：点击事件磁贴查看/编辑详情

### 5. 设置页面
- **访问方式**：点击顶部"⚙设置"按钮
- **配置选项**：
  - API基础URL
  - API密钥（保密字段）
  - 模型名称
  - 温度参数（影响AI创造性）
- **保存设置**：点击"保存设置"按钮
- **恢复默认**：点击"恢复默认"按钮

## ❓ 常见问题解答

**Q: 我的日程数据存储在哪里？**
A: 所有日程数据自动保存在浏览器的本地存储中，无需手动保存。

**Q: 语音识别不工作怎么办？**
A: 
1. 检查浏览器麦克风权限
2. 确保使用支持Web Speech API的浏览器（Chrome, Edge等）
3. 尝试刷新页面

**Q: 为什么我的指令没有被正确执行？**
A: 
1. 确保指令清晰明确
2. 检查网络连接
3. 确认API设置正确（设置页面）

**Q: 如何调整事件的优先级？**
A: 
1. 选择要调整的事件
2. 在右侧面板拖动"重要性"滑块
3. 系统会自动计算并更新事件的紧迫性

## 💡 使用技巧

- **优先级管理**：优先处理右上角（重要且紧急）的事件
- **工作量估算**：使用"size"属性准确估算任务所需时间
- **批量操作**：使用智能指令同时操作多个事件
- **语音效率**：用"输入"指令快速添加事件描述
- **颜色提示**：关注红色事件（高紧迫性）确保及时处理

如需更多帮助，请访问我们的GitHub仓库：https://github.com/gfjdh/hci-schedule
`;

    const messages = [
      { role: 'system', content: '你是一个乐于助人的日程管理助手。' },
      { role: 'user', content: helpPrompt }
    ];

    const response = await this.apiClient.chat(messages);

    if (response.error) {
      throw new Error(`处理帮助请求失败: ${response.content}`);
    }

    return response.content;
  }

  // 第二步：处理日程建议请求
  public async handleSuggestionRequest(userInput: string, scheduleDescription: string): Promise<string> {
    const prompt = `你是一个日程管理助手，请根据用户提供的空闲时间和当前日程，为用户生成今日的安排建议。
今天的日期是：${new Date().toISOString().split('T')[0]}。
当前日程事件列表：
${scheduleDescription}

用户输入：${userInput}

请生成一个合理的安排，注意不要超过空闲时间，并优先安排重要且紧急的事件。`;

    const messages = [
      { role: 'system', content: '你是一个专业的日程规划师。' },
      { role: 'user', content: prompt }
    ];

    const response = await this.apiClient.chat(messages);

    if (response.error) {
      throw new Error(`生成日程建议失败: ${response.content}`);
    }

    return response.content;
  }

  // 第二步：解析操作指令
  public async parseOperationCommands(userInput: string, scheduleDescription: string): Promise<OperationCommand[]> {
    const prompt = `你是一个日程管理助手，请将用户的自然语言指令转换成机器可读的JSON指令。
今天的日期是：${new Date().toISOString().split('T')[0]}。
当前日程事件列表：
${scheduleDescription}

用户输入：${userInput}
如果用户输入的信息不完整，你可以估计一个合理的值。
除非用户明确要求，否则对日程的操作都只针对同一个事件。
请返回一个JSON数组，数组中的每个元素是一个操作指令。每个操作指令包含以下字段：
- operation: 字符串，只能是"add", "delete", "update"
- event: 事件对象，包含以下字段：
    * id: 事件的唯一标识（必须提供，值可以和今天的日期相关）
    * name: 事件名称（新增时必须）
    * startTime: 开始时间（ISO8601格式）
    * endTime: 结束时间（ISO8601格式）
    * importance: 重要性（0-1之间的数字）
    * size: 剩余工作量（0-100之间的整数）
    * details: 对象，包含location, notes, estimatedHours等

示例：
[
  {
    "operation": "add",
    "event": {
      "id": "evt_12345",
      "name": "团队会议",
      "startTime": "2023-12-15T10:00:00",
      "endTime": "2023-12-15T11:30:00",
      "importance": 0.8,
      "size": 100,
      "details": {
        "location": "会议室A",
        "estimatedHours": 1.5
      }
    }
  },
  {
    "operation": "delete",
    "event": {
      "id": "evt_12345",
      "name": "旧会议"
    }
  }
]

请只返回JSON数组，不要有其他内容。`;

    const messages = [
      { role: 'system', content: '你是一个指令转换器，需要将自然语言转换为JSON格式的机器指令。' },
      { role: 'user', content: prompt }
    ];

    const response = await this.apiClient.chat(messages);
    const filteredResponse = response.content.trim().match(/```json\s*(\[[\s\S]*\]|\{[\s\S]*\})\s*```/);
    const jsonMatch = filteredResponse ? filteredResponse[1] : response.content;


    if (response.error) {
      throw new Error(`解析操作指令失败: ${response.content}`);
    }

    try {
      const commands: OperationCommand[] = JSON.parse(jsonMatch);
      if (!Array.isArray(commands)) {
        throw new Error('返回的不是数组');
      }
      return commands;
    } catch (e: any) {
      throw new Error(`解析操作指令失败: ${e.message}，返回内容：${response.content}`);
    }
  }

  // 主处理函数
  public async processCommand(userInput: string, scheduleDescription: string): Promise<{
    status: 'success' | 'need_more_info' | 'error';
    message: string;
    data?: any;
    missingInfo?: string;
  }> {
    try {
      // 第一步：意图识别
      const intentResult = await this.detectIntent(userInput);

      // 第二步：根据意图处理
      switch (intentResult.intent) {
        case 'help':
          const helpResponse = await this.handleHelpRequest(userInput);
          return {
            status: 'success',
            message: helpResponse
          };

        case 'suggest_without_info':
          return {
            status: 'need_more_info',
            message: '请补充今日的空闲时间信息（例如"我今天有4小时空闲"）',
            missingInfo: '空闲时间'
          };

        case 'suggest_with_info':
          const suggestion = await this.handleSuggestionRequest(userInput, scheduleDescription);
          return {
            status: 'success',
            message: suggestion
          };

        case 'modify_without_info':
          return {
            status: 'need_more_info',
            message: `请补充以下信息：${intentResult.missing_info || '缺少必要信息'}`,
            missingInfo: intentResult.missing_info || '缺少必要信息'
          };

        case 'modify_with_info':
          const commands = await this.parseOperationCommands(userInput, scheduleDescription);
          return {
            status: 'success',
            message: `解析到${commands.length}个操作指令`,
            data: commands
          };

        default:
          return {
            status: 'error',
            message: `无法识别的意图: ${intentResult.intent}`
          };
      }
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || '处理命令时出错'
      };
    }
  }
}

export default MessageBuilder;