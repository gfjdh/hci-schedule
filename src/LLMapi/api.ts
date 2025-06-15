import { LocalStorageService } from '../hooks/useLocalStorageService';

interface APIConfig {
    baseURL: string
    key: string
    appointModel: string
    temperature: number
}

interface Msg {
    role: string
    content: string
}

interface Payload {
    model: string
    messages: Msg[]
    temperature: number
    top_p: number
}

export class APIClient {
    private config: APIConfig
    constructor() {
        this.config = {
            baseURL: 'https://api.deepseek.com/v1/chat/completions',
            key: '', 
            appointModel: 'deepseek-R1',
            temperature: 0.7
        }
        this.updateAPIConfig()
    }

    // 发送聊天请求
    public async chat(messages: Msg[]): Promise<{ content: string, error: boolean }> {
        const payload = this.createPayload(messages, this.config.appointModel)
        return await this.tryRequest(this.config.baseURL, payload, this.config.key)
    }

    // 检查API密钥是否存在
    public hasApiKey(): boolean {
        return !!this.config.key;
    }

    // 生成请求体
    private createPayload(messages: Msg[], model: string) {
        return {
            model: model,
            messages,
            temperature: this.config.temperature,
            top_p: 1
        }
    }

    // 尝试请求
    private async tryRequest(URL: string, payload: Payload, key: string): Promise<{ content: string; error: boolean }> {
        const url = URL
        const headers = this.createHeaders(key)
        try {
            const responseData = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(3600000)
            })
            const response = await responseData.json()
            const requestInfo = (`APIID: ${response.id}, 输入token: ${response.usage.prompt_tokens}, 输出token: ${response.usage.completion_tokens}, 总token: ${response.usage.total_tokens}`)
            const reasoning_content = response.choices[0].message.reasoning_content || '无'
            console.log(`API请求成功: ${requestInfo}, 推理内容: ${reasoning_content}, 返回内容: ${response.choices[0].message.content}`)
            const content = response.choices[0].message.content
            return { content: content, error: false }
        } catch (error) {
            return this.handleAPIError(error)
        }
    }

    // 生成请求头
    private createHeaders(key: string): Record<string, string> {
        return {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json'
        }
    }

    // 处理API错误
    private handleAPIError(error: any): { content: string, error: boolean } {
        const status = error.response?.status || 0;
        const errorCode = error.response?.data?.error?.code || 'unknown';
        const message = error.response?.data?.error?.message || error.message;
        switch (status) {
            case 400:
                return { content: errorCode + ':请求体格式错误', error: true };
            case 401:
                return { content: errorCode + ':API key 错误，认证失败', error: true };
            case 402:
                return { content: errorCode + ':账号余额不足', error: true };
            case 422:
                return { content: errorCode + ':请求体参数错误', error: true };
            case 429:
                return { content: errorCode + ':请求速率（TPM 或 RPM）达到上限', error: true };
            case 500:
                return { content: errorCode + ':api服务器内部故障', error: true };
            case 503:
                return { content: errorCode + ':api服务器负载过高', error: true };
            default:
                return { content: message, error: true };
        }
    }

    // 更新配置
    public updateAPIConfig(): void {
        const setting = LocalStorageService.loadData<APIConfig>('app_settings', this.config);
        this.config = { ...this.config, ...setting };
    }

    // 获取当前配置
    public getAPIConfig(): APIConfig {
        return { ...this.config };
    }
}