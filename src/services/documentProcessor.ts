import * as mammoth from 'mammoth';

interface ProcessedDocument {
  id: string;
  filename: string;
  content: string;
  chunks: string[];
  uploadedAt: Date;
}

export class DocumentProcessor {
  private static readonly STORAGE_KEY = 'rag-documents';
  private static readonly CHUNK_SIZE = 500;
  private static readonly OVERLAP = 50;

  static async processDocument(file: File): Promise<ProcessedDocument> {
    const content = await this.extractTextFromFile(file);
    const chunks = this.createChunks(content);
    
    const processedDoc: ProcessedDocument = {
      id: Date.now().toString(),
      filename: file.name,
      content,
      chunks,
      uploadedAt: new Date(),
    };

    this.saveDocument(processedDoc);
    return processedDoc;
  }

  private static async extractTextFromFile(file: File): Promise<string> {
    // Handle DOCX files
    if (file.name.toLowerCase().endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            resolve(result.value);
          } catch (error) {
            reject(new Error('Failed to extract text from DOCX file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read DOCX file'));
        reader.readAsArrayBuffer(file);
      });
    }
    
    // Handle text files
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private static createChunks(text: string): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if ((currentChunk + trimmedSentence).length > this.CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        // Overlap: start new chunk with last few words
        const words = currentChunk.split(' ');
        currentChunk = words.slice(-this.OVERLAP).join(' ') + ' ' + trimmedSentence;
      } else {
        currentChunk += ' ' + trimmedSentence;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  static getStoredDocuments(): ProcessedDocument[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  }

  private static saveDocument(doc: ProcessedDocument): void {
    const existing = this.getStoredDocuments();
    existing.push(doc);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
  }

  static removeDocument(id: string): void {
    const existing = this.getStoredDocuments();
    const filtered = existing.filter(doc => doc.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  static findRelevantChunks(query: string, maxChunks: number = 2): string[] {
    const documents = this.getStoredDocuments();
    const allChunks: { chunk: string; score: number }[] = [];

    documents.forEach(doc => {
      doc.chunks.forEach(chunk => {
        const score = this.calculateRelevanceScore(query, chunk);
        allChunks.push({ chunk, score });
      });
    });

    // Filter out chunks with very low relevance scores (threshold: 0.1)
    const relevantChunks = allChunks
      .filter(item => item.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxChunks)
      .map(item => item.chunk);

    return relevantChunks;
  }

  private static calculateRelevanceScore(query: string, chunk: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const chunkWords = chunk.toLowerCase().split(/\s+/);
    
    let score = 0;
    queryWords.forEach(queryWord => {
      chunkWords.forEach(chunkWord => {
        if (chunkWord.includes(queryWord) || queryWord.includes(chunkWord)) {
          score += 1;
        }
      });
    });

    return score / Math.sqrt(queryWords.length * chunkWords.length);
  }
}