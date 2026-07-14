import { SourceCitation } from '@rag/shared';

export class ChatResponseDto {
  answer!: string;
  sources!: SourceCitation[];
  conversationId!: string;
}
