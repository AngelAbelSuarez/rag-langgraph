import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatMessage } from '@rag/shared';
import { ChatModelProvider, GenerationResult } from './chat-model.interface.js';

@Injectable()
export class ChatModelProviderService implements ChatModelProvider {
  private generationModel: ChatOpenAI;
  private gradingModel: ChatOpenAI;

  constructor(configService: ConfigService) {
    const baseUrl = configService.get<string>('NVIDIA_BASE_URL', 'https://integrate.api.nvidia.com/v1');
    const apiKey = configService.get<string>('NVIDIA_API_KEY');

    this.generationModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: configService.get<string>('GENERATION_MODEL', 'nvidia/llama-3.3-nemotron-super-49b-v1'),
      configuration: { baseURL: baseUrl },
    });

    this.gradingModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: configService.get<string>('GRADING_MODEL', 'nvidia/nemotron-mini-4b-instruct'),
      configuration: { baseURL: baseUrl },
    });
  }

  async generate(systemPrompt: string, messages: ChatMessage[], context: Document[]): Promise<GenerationResult> {
    const langChainMessages = this.buildMessages(systemPrompt, messages, context);
    const response = await this.generationModel.invoke(langChainMessages);
    return {
      content: response.content as string,
      tokenUsage: response.usage_metadata
        ? {
            prompt: response.usage_metadata.input_tokens,
            completion: response.usage_metadata.output_tokens,
            total: response.usage_metadata.total_tokens,
          }
        : undefined,
    };
  }

  async *generateStream(systemPrompt: string, messages: ChatMessage[], context: Document[]): AsyncIterable<GenerationResult> {
    const langChainMessages = this.buildMessages(systemPrompt, messages, context);
    const stream = await this.generationModel.stream(langChainMessages);
    for await (const chunk of stream) {
      yield { content: typeof chunk.content === 'string' ? chunk.content : '' };
    }
  }

  private buildMessages(systemPrompt: string, messages: ChatMessage[], context: Document[]): Array<SystemMessage | HumanMessage | AIMessage> {
    const contextStr = context.map(d => d.pageContent).join('\n\n');
    const result: Array<SystemMessage | HumanMessage | AIMessage> = [
      new SystemMessage(`${systemPrompt}\n\nContext:\n${contextStr}`),
    ];

    for (const m of messages) {
      if (m.role === 'user') {
        result.push(new HumanMessage(m.content));
      } else {
        result.push(new AIMessage(m.content));
      }
    }

    return result;
  }

  getGenerationModel(): ChatOpenAI {
    return this.generationModel;
  }

  getGradingModel(): ChatOpenAI {
    return this.gradingModel;
  }
}
