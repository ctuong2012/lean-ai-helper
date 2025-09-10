import { BaseAIService, AIMessage } from './baseAI';

interface TogetherAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class FreeLLMCloudService extends BaseAIService {
  private baseUrl = 'https://api.together.xyz/v1';
  private model: string;

  constructor(apiKey: string = '', model: string = 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo') {
    super(apiKey);
    this.model = model;
  }

  async sendMessage(messages: AIMessage[], ragContext?: string): Promise<string> {
    // If RAG context is provided, modify the system message
    let finalMessages = [...messages];
    if (ragContext && finalMessages[0]?.role === 'system') {
      finalMessages[0] = {
        ...finalMessages[0],
        content: `${finalMessages[0].content}\n\nAdditional context from uploaded documents:\n${ragContext}\n\nPlease use this context to provide more accurate and relevant answers when applicable.`
      };
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey || 'free'}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: finalMessages,
        max_tokens: 500,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to get response from Free LLM Cloud');
    }

    const data: TogetherAIResponse = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  }

  static getStoredApiKey(): string | null {
    return localStorage.getItem('free-llm-cloud-api-key') || '';
  }

  static setApiKey(apiKey: string): void {
    localStorage.setItem('free-llm-cloud-api-key', apiKey);
  }

  static clearApiKey(): void {
    localStorage.removeItem('free-llm-cloud-api-key');
  }

  static getStoredConfig(): { model: string } {
    const stored = localStorage.getItem('free-llm-cloud-config');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall back to default if parsing fails
      }
    }
    return { model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo' };
  }

  static setConfig(model: string): void {
    localStorage.setItem('free-llm-cloud-config', JSON.stringify({ model }));
  }
}