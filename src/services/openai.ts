interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(messages: OpenAIMessage[], ragContext?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }

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
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: finalMessages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to get response from OpenAI');
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  }

  static getStoredApiKey(): string | null {
    return localStorage.getItem('openai-api-key');
  }

  static setApiKey(apiKey: string): void {
    localStorage.setItem('openai-api-key', apiKey);
  }

  static clearApiKey(): void {
    localStorage.removeItem('openai-api-key');
  }
}