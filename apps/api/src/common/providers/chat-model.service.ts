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
    this.generationModel = new ChatOpenAI({
      openAIApiKey: configService.get<string>('OPENAI_API_KEY'),
      modelName: configService.get<string>('GENERATION_MODEL', 'gpt-4o'),
    });

    this.gradingModel = new ChatOpenAI({
      openAIApiKey: configService.get<string>('OPENAI_API_KEY'),
      modelName: configService.get<string>('GRADING_MODEL', 'gpt-4o-mini'),
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
