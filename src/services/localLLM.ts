import { BaseAIService, AIMessage } from './baseAI';

interface OllamaResponse {
  message: {
    content: string;
  };
}

export class LocalLLMService extends BaseAIService {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama2') {
    super(''); // Local LLM doesn't need API key
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async sendMessage(messages: AIMessage[], ragContext?: string): Promise<string> {
    // If RAG context is provided, modify the system message
    let finalMessages = [...messages];
    if (ragContext && finalMessages[0]?.role === 'system') {
      finalMessages[0] = {
        ...finalMessages[0],
        content: `${finalMessages[0].content}\n\nKNOWLEDGE BASE CONTEXT:\n${ragContext}\n\nIMPORTANT: You must use the information from the KNOWLEDGE BASE CONTEXT above to answer the user's question. Base your response primarily on this context when it's relevant to the question.`
      };
    }

    console.log('Sending to Ollama:', { model: this.model, messages: finalMessages });

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: finalMessages,
          stream: false,
          options: {
            temperature: 0.7,
            num_ctx: 2048, // Reduce context window for faster response
            num_predict: 500, // Limit response length
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Ollama server error:', error);
        throw new Error(error.error || `Ollama server error: ${response.status}`);
      }

      const data: OllamaResponse = await response.json();
      console.log('Ollama response:', data);
      
      const content = data.message?.content;
      if (!content || content.trim() === '') {
        console.warn('Empty response from Ollama');
        return 'The model provided an empty response. This might be due to the model configuration or the query format.';
      }
      
      return content;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Cannot connect to Ollama server. Make sure Ollama is running on localhost:11434');
        }
        throw error;
      }
      throw new Error('Failed to get response from local LLM');
    }
  }

  static getStoredApiKey(): string | null {
    return localStorage.getItem('local-llm-config');
  }

  static setApiKey(config: string): void {
    localStorage.setItem('local-llm-config', config);
  }

  static clearApiKey(): void {
    localStorage.removeItem('local-llm-config');
  }

  static getStoredConfig(): { baseUrl: string; model: string } {
    const stored = localStorage.getItem('local-llm-config');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { baseUrl: 'http://localhost:11434', model: 'llama2' };
      }
    }
    return { baseUrl: 'http://localhost:11434', model: 'llama2' };
  }

  static setConfig(baseUrl: string, model: string): void {
    localStorage.setItem('local-llm-config', JSON.stringify({ baseUrl, model }));
  }
}