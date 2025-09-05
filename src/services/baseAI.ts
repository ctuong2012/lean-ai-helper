export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export abstract class BaseAIService {
  protected apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  abstract sendMessage(messages: AIMessage[], ragContext?: string): Promise<string>;
}

export interface AIServiceStatic {
  getStoredApiKey(): string | null;
  setApiKey(apiKey: string): void;
  clearApiKey(): void;
}

export enum AIProvider {
  OPENAI = 'openai',
  LOCAL = 'local',
  // Add more providers as needed
}