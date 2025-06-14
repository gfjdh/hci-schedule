// 暂未投入使用

interface DeepSeekConfig {
    baseURL: string
    key: string
    model: string
    temperature: number
}

interface Msg {
    role: string
    content: string
}

interface DeepSeekPayload {
    model: string
    messages: Msg[]
    temperature: number
    max_tokens?: number
    stream?: boolean
}

export class DeepSeekClient {
    private config: DeepSeekConfig
    
    constructor() {
        this.config = {
            baseURL: 'https://api.deepseek.com/v1/chat/completions',
            key: this.getApiKey(),
            model: 'deepseek-chat',
            temperature: 0.7
        }
    }

    // 获取API密钥(请写在.env.local文件中)
    private getApiKey(): string {
        // 在Vite中，环境变量需要VITE_前缀才能在客户端访问
        const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
        
        if (!apiKey) {
            console.warn('DeepSeek API key not found. Please set VITE_DEEPSEEK_API_KEY in .env.local');
        }
        
        return apiKey;
    }

    // 检查API密钥是否存在
    public hasApiKey(): boolean {
        return !!this.config.key;
    }

    // 发送聊天请求
    public async chat(messages: Msg[]): Promise<{ content: string, error: boolean, errorMessage?: string }> {
        if (!this.hasApiKey()) {
            return {
                content: '',
                error: true,
                errorMessage: 'API密钥未配置，请在.env.local文件中设置VITE_DEEPSEEK_API_KEY'
            };
        }

        const payload = this.createPayload(messages);
        return await this.tryRequest(payload);
    }

    // 生成请求体
    private createPayload(messages: Msg[]): DeepSeekPayload {
        return {
            model: this.config.model,
            messages,
            temperature: this.config.temperature,
            max_tokens: 64,    // 当前仅调试用
            stream: false
        };
    }

    // 尝试请求
    private async tryRequest(payload: DeepSeekPayload): Promise<{ content: string; error: boolean; errorMessage?: string }> {
        try {
            const headers = this.createHeaders();
            
            const response = await fetch(this.config.baseURL, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(30000) // 30秒超时
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return this.handleAPIError(response.status, errorData);
            }

            const responseData = await response.json();
            const content = responseData.choices?.[0]?.message?.content || '';
            
            return { 
                content: content, 
                error: false 
            };
        } catch (error: any) {
            return this.handleNetworkError(error);
        }
    }

    // 生成请求头
    private createHeaders(): Record<string, string> {
        return {
            'Authorization': `Bearer ${this.config.key}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // 处理API错误
    private handleAPIError(status: number, errorData: any): { content: string, error: boolean, errorMessage: string } {
        const errorCode = errorData?.error?.code || 'unknown';
        const message = errorData?.error?.message || '未知错误';
        
        let errorMessage: string;
        
        switch (status) {
            case 400:
                errorMessage = `${errorCode}: 请求格式错误 - ${message}`;
                break;
            case 401:
                errorMessage = `${errorCode}: API密钥无效或已过期 - ${message}`;
                break;
            case 402:
                errorMessage = `${errorCode}: 账户余额不足 - ${message}`;
                break;
            case 403:
                errorMessage = `${errorCode}: 访问被拒绝 - ${message}`;
                break;
            case 429:
                errorMessage = `${errorCode}: 请求频率过高，请稍后重试 - ${message}`;
                break;
            case 500:
                errorMessage = `${errorCode}: DeepSeek服务器内部错误 - ${message}`;
                break;
            case 503:
                errorMessage = `${errorCode}: DeepSeek服务暂时不可用 - ${message}`;
                break;
            default:
                errorMessage = `HTTP ${status}: ${message}`;
        }
        
        return { 
            content: '', 
            error: true, 
            errorMessage 
        };
    }

    // 处理网络错误
    private handleNetworkError(error: any): { content: string, error: boolean, errorMessage: string } {
        let errorMessage: string;
        
        if (error.name === 'AbortError') {
            errorMessage = '请求超时，请检查网络连接';
        } else if (error.message?.includes('fetch')) {
            errorMessage = '网络连接失败，请检查网络设置';
        } else {
            errorMessage = `网络错误: ${error.message || '未知错误'}`;
        }
        
        return { 
            content: '', 
            error: true, 
            errorMessage 
        };
    }

    // 更新配置
    public updateConfig(newConfig: Partial<DeepSeekConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    // 获取当前配置
    public getConfig(): DeepSeekConfig {
        return { ...this.config };
    }
}