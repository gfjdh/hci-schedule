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
    const helpPrompt = `你是一个日程管理助手，请向用户介绍你的功能和使用方法。用户的问题是：${userInput}
    
    功能说明：
    1. 添加新事件：点击"新建日程"按钮创建新事件
    2. 事件编辑：点击磁贴选择事件，在右侧面板编辑详细信息
    3. 事件管理：编辑、删除或调整事件的重要性和紧迫性
    4. 语音输入：使用语音指令快速添加事件
    5. 四象限时间管理：根据事件的重要性和紧迫性进行分类
    
    请用友好、简洁的语言回答用户的问题，并提供有用的建议。`;

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